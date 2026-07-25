import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

// Schema forzato lato Gemini (responseSchema): risposta sempre in questa
// forma esatta, niente parsing euristico di testo libero. `tagNames` usa
// enum sui singoli elementi dell'array: Gemini può SOLO scegliere tra i tag
// che esistono davvero nel DB, non inventarne di nuovi — niente matching
// fuzzy dei nomi dopo, niente tag fantasma creati per errore.
function buildFontRatingResponseSchema(availableTagNames: string[]): any {
  const schema: any = {
    type: SchemaType.OBJECT,
    properties: {
      fontFamily: { type: SchemaType.STRING },
      author: { type: SchemaType.STRING },
      rating: { type: SchemaType.NUMBER },
    },
    required: ["fontFamily", "author", "rating"],
  };

  if (availableTagNames.length > 0) {
    schema.properties.tagNames = {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, enum: availableTagNames },
    };
    schema.required.push("tagNames");
  }

  return schema;
}

// Seconda validazione lato nostro: responseSchema di Gemini vincola la forma
// ma non garantisce tipi/contenuti sensati (né è escluso che il modello a
// volte ignori lo schema), quindi ri-validiamo con zod prima di fidarci.
const fontRatingSchema = z.object({
  fontFamily: z.string().min(1),
  author: z.string().min(1),
  rating: z.number(),
  tagNames: z.array(z.string()).optional(),
});

export interface FontRatingResult {
  author: string;
  rating: number; // 6.0 - 10.0, step 0.2
  tagNames: string[];
}

function clampRating(value: number): number {
  const stepped = Math.round(value / 0.2) * 0.2;
  const clamped = Math.min(10, Math.max(6, stepped));
  // Elimina i residui di floating point (es. 8.399999999999999)
  return Math.round(clamped * 10) / 10;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Il free tier di Gemini limita a 5 richieste/minuto per modello: in un batch
// di N font le chiamate partivano una dopo l'altra e sforavano subito la
// quota (429). Qui leggiamo il "retryDelay" che Google stessa suggerisce
// nell'errore e aspettiamo esattamente quello prima di ritentare.
function parseRetryDelayMs(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/"retryDelay":"(\d+(?:\.\d+)?)s"/) || message.match(/retry in ([\d.]+)s/i);
  if (!match) return null;
  return Math.ceil(parseFloat(match[1]) * 1000);
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || /quota|too many requests/i.test(message);
}

export async function generateFontRatingWithGemini(
  fontFamily: string,
  availableTagNames: string[] = []
): Promise<FontRatingResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY non configurata nell'ambiente.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    {
      // "gemini-flash-latest" risolve a Gemini 3.5 Flash, che sul free tier
      // ha la quota più stretta (5 richieste/minuto, 20/giorno) — da qui i 429
      // costanti. Pinniamo un id esplicito invece di un alias "-latest" che
      // può ripuntare a un modello diverso (e più caro) senza preavviso.
      // Gemini 3.1 Flash-Lite ha 15 richieste/minuto e 500/giorno sul free
      // tier: stesso caso d'uso (JSON strutturato semplice), quota molto più
      // larga e costo per token più basso.
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: buildFontRatingResponseSchema(availableTagNames),
        temperature: 0.3,
        maxOutputTokens: 512,
      },
    },
    { apiVersion: "v1beta" }
  );

  const tagInstruction = availableTagNames.length > 0
    ? `
3. From this exact list of tags: ${JSON.stringify(availableTagNames)}
   Pick ONLY the ones that accurately describe this typeface (style, mood, use case, era, etc.). Pick as many as genuinely fit, or none at all if nothing in the list applies well — do not force a match. Never invent a tag that isn't in the list.`
    : "";

  const prompt = `
You are a typography expert with deep knowledge of type design history and the type design community.

Font family: "${fontFamily}"

Tasks:
1. Identify the real author/designer or foundry who created this typeface. If genuinely unknown or unverifiable, answer "Unknown".
2. Rate this typeface from 6.0 to 10.0, using steps of 0.2 (e.g. 6.0, 6.2, 6.4, 6.6, ... 10.0), based on how expert graphic/type designers and the broader typography community generally perceive it (craftsmanship, versatility, legibility, popularity, influence).
${tagInstruction}

Respond ONLY with JSON matching exactly this shape, no extra commentary:
{"fontFamily": "${fontFamily}", "author": "<author name>", "rating": <number>${availableTagNames.length > 0 ? ', "tagNames": ["<tag from the list>", ...]' : ""}}
`;

  const MAX_RETRIES = 4;
  let responseText: string | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
      break;
    } catch (err) {
      lastError = err;
      if (isRateLimitError(err) && attempt < MAX_RETRIES) {
        const delay = parseRetryDelayMs(err) ?? (attempt + 1) * 15000;
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  if (responseText === null) {
    throw lastError instanceof Error ? lastError : new Error(`Gemini request failed for "${fontFamily}".`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Gemini ha risposto con un JSON non valido per "${fontFamily}".`);
  }

  const validated = fontRatingSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Risposta Gemini per "${fontFamily}" fuori schema atteso.`);
  }

  // Difesa in profondità: lo schema con enum già vincola Gemini ai soli tag
  // esistenti, ma ri-filtriamo comunque contro la lista reale nel caso il
  // modello ignori l'enum (già successo in passato con altri campi).
  const availableTagNamesSet = new Set(availableTagNames);
  const tagNames = (validated.data.tagNames || []).filter((t) => availableTagNamesSet.has(t));

  return {
    author: validated.data.author.trim(),
    rating: clampRating(validated.data.rating),
    tagNames,
  };
}
