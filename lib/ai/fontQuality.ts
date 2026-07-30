import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

// Giudizio soggettivo/qualitativo su un font: rating + tag. Separato da
// fontIdentity.ts (autore + licenza, lookup fattuale) — due domini diversi,
// due prompt dedicati invece di uno solo che li mischia (vedi discussione
// in chat: rating/tag = "com'e' fatto e che stile ha", autore/licenza =
// "chi l'ha fatto e con che diritti").
function buildFontQualityResponseSchema(availableTagNames: string[]): any {
  const schema: any = {
    type: SchemaType.OBJECT,
    properties: {
      fontFamily: { type: SchemaType.STRING },
      rating: { type: SchemaType.NUMBER },
    },
    required: ["fontFamily", "rating"],
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

const fontQualitySchema = z.object({
  fontFamily: z.string().min(1),
  rating: z.number(),
  tagNames: z.array(z.string()).optional(),
});

export interface FontQualityResult {
  rating: number; // 6.0 - 10.0, step 0.2
  tagNames: string[];
}

function clampRating(value: number): number {
  const stepped = Math.round(value / 0.2) * 0.2;
  const clamped = Math.min(10, Math.max(6, stepped));
  return Math.round(clamped * 10) / 10;
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

export async function generateFontQualityWithGemini(
  fontFamily: string,
  availableTagNames: string[] = []
): Promise<FontQualityResult> {
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
        responseSchema: buildFontQualityResponseSchema(availableTagNames),
        temperature: 0.3,
        maxOutputTokens: 512,
      },
    },
    { apiVersion: "v1beta" }
  );

  const tagInstruction = availableTagNames.length > 0
    ? `
2. From this exact list of tags: ${JSON.stringify(availableTagNames)}
   Pick ONLY the ones that accurately describe this typeface (style, mood, use case, era, etc.). Pick as many as genuinely fit, or none at all if nothing in the list applies well — do not force a match. Never invent a tag that isn't in the list.`
    : "";

  const prompt = `
You are a typography expert with deep knowledge of type design history and the type design community.

Font family: "${fontFamily}"

Tasks:
1. Rate this typeface from 6.0 to 10.0, using steps of 0.2 (e.g. 6.0, 6.2, 6.4, 6.6, ... 10.0), based on how expert graphic/type designers and the broader typography community generally perceive it (craftsmanship, versatility, legibility, popularity, influence).
${tagInstruction}

Respond ONLY with JSON matching exactly this shape, no extra commentary:
{"fontFamily": "${fontFamily}", "rating": <number>${availableTagNames.length > 0 ? ', "tagNames": ["<tag from the list>", ...]' : ""}}
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

  const validated = fontQualitySchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Risposta Gemini per "${fontFamily}" fuori schema atteso.`);
  }

  const availableTagNamesSet = new Set(availableTagNames);
  const tagNames = (validated.data.tagNames || []).filter((t) => availableTagNamesSet.has(t));

  return {
    rating: clampRating(validated.data.rating),
    tagNames,
  };
}
