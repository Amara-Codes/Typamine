import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import { FONT_LICENSE_TYPES } from "@/lib/constants/fontLicenseTypes";

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

function buildFontIdentityResponseSchema(): any {
  return {
    type: SchemaType.OBJECT,
    properties: {
      fontFamily: { type: SchemaType.STRING },
      author: { type: SchemaType.STRING },
      licenseType: { type: SchemaType.STRING, enum: [...LICENSE_RESPONSE_VALUES] },
    },
    required: ["fontFamily", "author", "licenseType"],
  };
}

const fontIdentitySchema = z.object({
  fontFamily: z.string().min(1),
  author: z.string().min(1),
  licenseType: z.enum(LICENSE_RESPONSE_VALUES),
});

export interface FontIdentityResult {
  author: string;
  licenseType: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function generateFontIdentityWithGemini(fontFamily: string): Promise<FontIdentityResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY non configurata nell'ambiente.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
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
  );

  const prompt = `
You are a typography expert with deep knowledge of type design history, foundries, and font licensing.

Font family: "${fontFamily}"

Tasks:
1. Identify the real author/designer or foundry who created this typeface. If genuinely unknown or unverifiable, answer "Unknown".
2. Identify the most accurate license type for this typeface, choosing EXACTLY one value from this list: ${JSON.stringify(FONT_LICENSE_TYPES)}. If genuinely uncertain and unable to make an informed guess, answer "Unknown" instead of forcing a choice.

These two facts are usually linked: fonts published on Google Fonts are virtually always "Open Source (SIL OFL)", many indie/display fonts distributed on sites like DaFont are "Free" or "Free for Personal Use", boutique/retail type foundry releases are usually "Commercial".

Respond ONLY with JSON matching exactly this shape, no extra commentary:
{"fontFamily": "${fontFamily}", "author": "<author name>", "licenseType": "<one value from the list above, or Unknown>"}
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

  const validated = fontIdentitySchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Risposta Gemini per "${fontFamily}" fuori schema atteso.`);
  }

  return {
    author: validated.data.author.trim(),
    licenseType: validated.data.licenseType,
  };
}
