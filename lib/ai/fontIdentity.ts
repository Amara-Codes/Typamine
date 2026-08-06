import { SchemaType } from "@google/generative-ai";
import { z } from "zod";
import { FONT_LICENSE_TYPES } from "@/lib/constants/fontLicenseTypes";
import { generateWithKeyFallback } from "@/lib/ai/geminiKeyPool";

// Lookup fattuale su un font: chi l'ha fatto (autore/fonderia) e con che
// diritti (licenza). Separato da fontQuality.ts (rating+tag, giudizio
// soggettivo) — qui sono due fatti collegati: sapere che e' un font
// pubblicato su Google Fonts implica quasi sempre licenza OFL, sapere che
// e' di una fonderia commerciale nota implica quasi sempre Commercial. Una
// sola chiamata Gemini per entrambi, invece di due, sfrutta questo legame
// invece di ignorarlo.
// "Unknown" ammesso anche per licenseType (oltre che per author, gia'
// previsto): Gemini deve poter dichiarare di non saperlo invece di essere
// forzato a indovinare una licenza reale — il chiamante (detectFontIdentityWithAI)
// mappa "Unknown" sul placeholder terminale invece che su un FONT_LICENSE_TYPES vero.
const LICENSE_RESPONSE_VALUES = [...FONT_LICENSE_TYPES, "Unknown"] as const;

// Sotto questa soglia la prima risposta (fatta "a memoria", senza ricerca)
// non e' abbastanza affidabile da salvare a DB cosi' com'e' — si ripete la
// domanda con la ricerca web attivata (vedi generateFontIdentityWithSearch).
const CONFIDENCE_THRESHOLD = 5.5;

function buildFontIdentityResponseSchema(): any {
  return {
    type: SchemaType.OBJECT,
    properties: {
      fontFamily: { type: SchemaType.STRING },
      author: { type: SchemaType.STRING },
      licenseType: { type: SchemaType.STRING, enum: [...LICENSE_RESPONSE_VALUES] },
      // 1-10, un decimale: quanto Gemini si fida di questa risposta data "a
      // memoria" (nessuna ricerca in questo step) — vedi CONFIDENCE_THRESHOLD.
      confidence: { type: SchemaType.NUMBER },
    },
    required: ["fontFamily", "author", "licenseType", "confidence"],
  };
}

const fontIdentitySchema = z.object({
  fontFamily: z.string().min(1),
  author: z.string().min(1),
  licenseType: z.enum(LICENSE_RESPONSE_VALUES),
  confidence: z.number().min(1).max(10),
});

// Step 2 (ricerca web) non usa responseSchema/JSON mode — su questo SDK i
// due non si combinano in modo affidabile con il tool di ricerca — quindi lo
// schema qui e' piu' permissivo e la confidence e' opzionale (il modello puo'
// ometterla, non ci serve piu' una volta che ha gia' cercato).
const fontIdentitySearchSchema = z.object({
  fontFamily: z.string().min(1),
  author: z.string().min(1),
  licenseType: z.enum(LICENSE_RESPONSE_VALUES),
});

export interface FontIdentityResult {
  /** Risultato finale usato dal chiamante: step2 se e' girato ed e' andato a buon fine, altrimenti step1. */
  author: string;
  licenseType: string;
  /** Sempre presente: risposta "a memoria", nessuna ricerca. */
  step1: { author: string; licenseType: string; confidence: number };
  /** Presente solo se la confidence dello step1 era sotto soglia E lo step2 (ricerca web) e' andato a buon fine. */
  step2?: { author: string; licenseType: string };
  /** Presente solo se lo step2 e' stato tentato ma fallito (tool non supportato, JSON non parsabile, rete...). */
  step2Error?: string;
}

// Lo step di ricerca web non e' in JSON mode (niente responseSchema), quindi
// il modello puo' incorniciare il JSON in prosa o dentro un code fence
// ```json ... ``` nonostante il prompt lo vieti esplicitamente — questo
// estrae il primo oggetto { ... } valido invece di affidarsi a JSON.parse
// diretto sull'intera risposta.
function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  try {
    return JSON.parse(candidate.trim());
  } catch {
    // fallback: prendi dalla prima "{" all'ultima "}"
  }

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Nessun oggetto JSON trovato nella risposta.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

// DEBUG risolto (log reali, vedi chat): ho provato a ruotare lo step2 anche
// sul modello, non solo sulla chiave, per capire se il 429 "exceeded quota"
// fosse per-progetto o per-modello. Risultato:
// - gemini-2.5-flash -> 404 "no longer available to new users" (ritirato)
// - gemini-3-flash    -> 404 "not found" (id non esiste)
// - gemini-3.6-flash  -> 429 IDENTICO, e questo NON e' un modello "lite"
// - gemini-3.5-flash-lite / gemini-3.1-flash-lite -> 429 identico
// Un modello full-size che fallisce uguale ai lite esclude "solo i lite non
// supportano grounding" — resta solo: il tool grounding (googleSearch)
// richiede billing abilitato sul progetto Google Cloud, gate universale a
// prescindere dal modello. Nessuna delle 5 chiavi ce l'ha. Ruotare modelli
// non risolve, quindi non lo si fa piu' — solo un modello, GEMINI_STEP2_ENABLED
// per spegnere lo step del tutto finche' non abiliti billing su una chiave.
const STEP2_MODEL = "gemini-3.5-flash-lite";

// Step 2: rifatta la stessa domanda MA con il tool di ricerca Google
// attivato — usato solo quando lo step 1 (a memoria) risponde con
// confidence troppo bassa o "Unknown". Se questo step fallisce per
// qualsiasi motivo (tool non supportato, JSON non parsabile, errore
// rete...) il chiamante deve ripiegare sul risultato dello step 1 invece di
// far fallire l'intera identificazione — una risposta incerta e' comunque
// meglio di nessuna risposta.
//
// Se GEMINI_STEP2_ENABLED="false" lo step2 non viene nemmeno tentato: utile
// per non sprecare ~8-13s a font (5 chiavi che falliscono garantito) finche'
// il billing sul grounding non e' abilitato — vedi commento sopra.
async function generateFontIdentityWithSearch(fontFamily: string): Promise<{ author: string; licenseType: string }> {
  if (process.env.GEMINI_STEP2_ENABLED === "false") {
    throw new Error("Step 2 disabilitato (GEMINI_STEP2_ENABLED=false) — vedi commento su STEP2_MODEL per il perche'.");
  }

  const prompt = `
You are a typography expert with deep knowledge of type design history, foundries, and font licensing.

Font family: "${fontFamily}"

You were previously unsure about this font. This time, use your web search tool before answering — do not answer from memory alone.

Treat DaFont and Google Fonts as your main reference sources. Search the web using the query "${fontFamily} dafont" (the font name plus the keyword "dafont") — this surfaces the DaFont listing page with author and license, or leads to the real source if the font isn't on DaFont. If that doesn't turn up a reliable answer, try one more search without the "dafont" keyword before giving up.

Tasks:
1. Identify the real author/designer or foundry who created this typeface. If genuinely unknown or unverifiable after searching, answer "Unknown".
2. Identify the most accurate license type for this typeface, choosing EXACTLY one value from this list: ${JSON.stringify(FONT_LICENSE_TYPES)}. If genuinely uncertain even after searching, answer "Unknown" instead of forcing a choice.

These two facts are usually linked: fonts published on Google Fonts are virtually always "Open Source (SIL OFL)", many indie/display fonts distributed on sites like DaFont are "Free" or "Free for Personal Use", boutique/retail type foundry releases are usually "Commercial".

After searching, respond with ONLY a JSON object matching exactly this shape, no extra commentary, no markdown code fence:
{"fontFamily": "${fontFamily}", "author": "<author name>", "licenseType": "<one value from the list above, or Unknown>"}
`;

  const responseText = await generateWithKeyFallback(
    (genAI) =>
      genAI.getGenerativeModel(
        {
          model: STEP2_MODEL,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
          // `googleSearch` e' il nome campo corretto per il tool grounding su
          // Gemini 2.0+ (il vecchio `googleSearchRetrieval` e' deprecato — vedi
          // commento sopra STEP2_MODEL per la storia completa del debug).
          tools: [{ googleSearch: {} } as any],
        },
        { apiVersion: "v1beta" }
      ),
    prompt
  );
  const parsed = extractJsonObject(responseText);
  const validated = fontIdentitySearchSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Risposta Gemini (ricerca web) per "${fontFamily}" fuori schema atteso.`);
  }

  return {
    author: validated.data.author.trim(),
    licenseType: validated.data.licenseType,
  };
}

export async function generateFontIdentityWithGemini(rawFontFamily: string): Promise<FontIdentityResult> {
  // A DB il nome del font è salvato con underscore al posto degli spazi
  // (comodità di storage/slug) — Gemini deve cercare il nome vero, non
  // "Font_Name_Bold", altrimenti la ricerca fallisce o produce falsi match.
  const fontFamily = rawFontFamily.replace(/_/g, " ").trim();

  const prompt = `
You are a typography expert with deep knowledge of type design history, foundries, and font licensing.

Font family: "${fontFamily}"

Tasks:
1. Identify the real author/designer or foundry who created this typeface. If genuinely unknown or unverifiable, answer "Unknown".
2. Identify the most accurate license type for this typeface, choosing EXACTLY one value from this list: ${JSON.stringify(FONT_LICENSE_TYPES)}. If genuinely uncertain and unable to make an informed guess, answer "Unknown" instead of forcing a choice.
3. Rate your own confidence in this answer from 1 to 10, with one decimal place (e.g. 7.5) — how sure are you, from memory alone, that the author and license above are correct? Be honest and self-critical: a guess or a common assumption should score low, not high.

These two facts are usually linked: fonts published on Google Fonts are virtually always "Open Source (SIL OFL)", many indie/display fonts distributed on sites like DaFont are "Free" or "Free for Personal Use", boutique/retail type foundry releases are usually "Commercial".

Treat DaFont and Google Fonts as your main reference sources for this kind of question in general.

Respond ONLY with JSON matching exactly this shape, no extra commentary:
{"fontFamily": "${fontFamily}", "author": "<author name>", "licenseType": "<one value from the list above, or Unknown>", "confidence": <number 1-10, one decimal>}
`;

  // Step 1: risposta "a memoria", nessuna ricerca — economica e veloce,
  // sufficiente per i font notissimi. Include una self-rated confidence
  // (1-10, un decimale) per decidere se serve il secondo step.
  const responseText = await generateWithKeyFallback(
    (genAI) =>
      genAI.getGenerativeModel(
        {
          model: "gemini-3.1-flash-lite",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: buildFontIdentityResponseSchema(),
            temperature: 0.2,
            maxOutputTokens: 512,
          },
        },
        { apiVersion: "v1beta" }
      ),
    prompt
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Gemini ha risposto con un JSON non valido per "${fontFamily}".`);
  }

  const validated = fontIdentitySchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Risposta Gemini per "${fontFamily}" fuori schema atteso.`);
  }

  const step1 = {
    author: validated.data.author.trim(),
    licenseType: validated.data.licenseType,
    confidence: validated.data.confidence,
  };

  // "Unknown" forza lo step2 SEMPRE, a prescindere dalla confidence: una
  // confidence alta su "non lo so" (Gemini sicuro di non sapere) e' comunque
  // un risultato che vogliamo provare a risolvere con la ricerca, non da
  // accettare cosi' com'e' solo perche' il numero e' alto.
  const step1IsUnknown = step1.author.trim().toLowerCase() === "unknown" || step1.licenseType.trim().toLowerCase() === "unknown";

  if (step1.confidence >= CONFIDENCE_THRESHOLD && !step1IsUnknown) {
    return { author: step1.author, licenseType: step1.licenseType, step1 };
  }

  // Confidence bassa o "Unknown": step 2 con ricerca web (a sua volta con
  // cascata sulle 5 chiavi — vedi generateFontIdentityWithSearch). Se fallisce comunque su
  // tutte, ripiega sul risultato incerto dello step 1 invece di propagare
  // l'errore. Il chiamante riceve comunque entrambi gli step per poterli
  // mostrare.
  try {
    const step2 = await generateFontIdentityWithSearch(fontFamily);
    return { author: step2.author, licenseType: step2.licenseType, step1, step2 };
  } catch (err) {
    const step2Error = err instanceof Error ? err.message : String(err);
    console.warn(`[fontIdentity] Step di ricerca web fallito su tutte le chiavi per "${fontFamily}", uso risultato incerto dello step 1:`, err);
    return { author: step1.author, licenseType: step1.licenseType, step1, step2Error };
  }
}
