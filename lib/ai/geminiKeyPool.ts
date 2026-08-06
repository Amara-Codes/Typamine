import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Rate limit Gemini API e' per PROGETTO Google Cloud, non per account ne'
// per singola API key nello stesso progetto (vedi discussione in chat) —
// GEMINI_API_KEY resta il progetto principale (provato per primo),
// GEMINI_FONTS_API_KEY_2..5 sono progetti separati creati apposta per
// sommare pool RPM/RPD indipendenti invece di uno solo.
function collectApiKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_FONTS_API_KEY_2,
    process.env.GEMINI_FONTS_API_KEY_3,
    process.env.GEMINI_FONTS_API_KEY_4,
    process.env.GEMINI_FONTS_API_KEY_5,
  ];
  return keys.filter((k): k is string => !!k && k.trim().length > 0);
}

export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || /quota|too many requests/i.test(message);
}

function parseRetryDelayMs(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/"retryDelay":"(\d+(?:\.\d+)?)s"/) || message.match(/retry in ([\d.]+)s/i);
  if (!match) return null;
  return Math.ceil(parseFloat(match[1]) * 1000);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Un 429 "quota exceeded" senza retryDelay esplicito e' quota di
// progetto esaurita (ore, non secondi) — riprovare alla cieca sulla STESSA
// chiave non serve a nulla, meglio passare subito alla chiave successiva
// (progetto diverso, pool separato). Si onora un retry solo se Google
// stesso da' un retryDelay breve (rate limit davvero transitorio).
const MAX_RETRY_DELAY_MS = 30000;
const MAX_RETRIES_PER_KEY = 2;

/**
 * Prova ogni GEMINI_*_API_KEY configurata in ordine (GEMINI_API_KEY prima,
 * poi GEMINI_FONTS_API_KEY_2..5). Su ogni chiave riprova solo se l'API da'
 * un retryDelay esplicito e corto; qualunque altro errore (rate limit
 * esaurito senza hint, chiave invalida, rete...) fa passare SUBITO alla
 * chiave successiva, senza aspettare — nessun senso aspettare su un
 * progetto che sappiamo gia' saturo quando ce n'e' un altro pronto.
 * Lancia l'ultimo errore incontrato solo se TUTTE le chiavi falliscono.
 */
export async function generateWithKeyFallback(
  buildModel: (genAI: GoogleGenerativeAI) => GenerativeModel,
  prompt: string
): Promise<string> {
  const apiKeys = collectApiKeys();
  if (apiKeys.length === 0) {
    throw new Error("Nessuna GEMINI_API_KEY / GEMINI_FONTS_API_KEY_* configurata nell'ambiente.");
  }

  let lastError: unknown = null;
  let keysTried = 0;

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    keysTried += 1;
    const genAI = new GoogleGenerativeAI(apiKeys[keyIndex]);
    const model = buildModel(genAI);

    // Diagnostica: ultimi 6 caratteri della chiave (mai la chiave intera nei
    // log) + modello + tools effettivamente in uso per QUESTA richiesta —
    // per verificare a occhio se sta davvero girando su chiavi diverse e se
    // il tool config e' quello che ci si aspetta (es. dopo un cambio come
    // googleSearchRetrieval -> googleSearch).
    const keySuffix = apiKeys[keyIndex].slice(-6);
    console.log(
      `[geminiKeyPool] key ${keyIndex + 1}/${apiKeys.length} (...${keySuffix}) — model=${model.model} tools=${JSON.stringify(model.tools ?? null)}`
    );

    for (let attempt = 0; attempt <= MAX_RETRIES_PER_KEY; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        if (keyIndex > 0) {
          console.log(`[geminiKeyPool] Riuscito su key ${keyIndex + 1}/${apiKeys.length} dopo che le precedenti hanno fallito.`);
        }
        return result.response.text();
      } catch (err) {
        lastError = err;
        const retryDelay = isRateLimitError(err) ? parseRetryDelayMs(err) : null;

        // Log esteso: status/statusText/errorDetails (GoogleGenerativeAIFetchError)
        // spesso portano un "QuotaFailure" con quota_metric/quota_id — e'
        // l'unico modo per sapere QUALE quota sta davvero colpendo (RPM del
        // modello base vs grounding vs altro) invece di indovinare dal solo
        // messaggio testuale.
        const anyErr = err as any;
        console.warn(`[geminiKeyPool] key ${keyIndex + 1}/${apiKeys.length} (...${keySuffix}) fallita (tentativo ${attempt + 1}/${MAX_RETRIES_PER_KEY + 1})`, {
          message: err instanceof Error ? err.message : String(err),
          status: anyErr?.status,
          statusText: anyErr?.statusText,
          errorDetails: anyErr?.errorDetails,
        });

        if (retryDelay !== null && retryDelay <= MAX_RETRY_DELAY_MS && attempt < MAX_RETRIES_PER_KEY) {
          await sleep(retryDelay);
          continue;
        }

        // Chiave esaurita/non valida per questa richiesta: si esce dal
        // retry loop per passare alla chiave successiva (se ce n'e' una).
        break;
      }
    }
  }

  // Il numero di chiavi provate finisce nel messaggio stesso: e' l'unico
  // modo per verificare dal log della UI (che mostra solo l'errore finale,
  // non i tentativi intermedi) se la cascata e' davvero passata per tutte
  // le chiavi configurate o si e' fermata prima.
  const baseMessage = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`[tried ${keysTried}/${apiKeys.length} keys] ${baseMessage}`);
}

/**
 * Come generateWithKeyFallback, ma rotea ANCHE sul modello — per feature
 * (es. grounding con Google Search) dove non sappiamo ancora se il
 * fallimento e' per-chiave (quota/billing) o per-modello (es. le varianti
 * "flash-lite" potrebbero non supportare un certo tool). Ordine: su OGNI
 * chiave si provano TUTTI i modelli candidati prima di passare alla chiave
 * successiva — cosi' un fallimento "questo modello non lo supporta"
 * (indipendente dalla chiave) emerge subito con pochi tentativi economici,
 * invece di dover esaurire 5 chiavi su un modello sbagliato prima di
 * scoprirlo.
 */
export async function generateWithModelAndKeyFallback(
  modelIds: string[],
  buildModel: (genAI: GoogleGenerativeAI, modelId: string) => GenerativeModel,
  prompt: string
): Promise<{ text: string; modelId: string }> {
  const apiKeys = collectApiKeys();
  if (apiKeys.length === 0) {
    throw new Error("Nessuna GEMINI_API_KEY / GEMINI_FONTS_API_KEY_* configurata nell'ambiente.");
  }
  if (modelIds.length === 0) {
    throw new Error("Nessun modello candidato configurato per generateWithModelAndKeyFallback.");
  }

  const totalCombos = apiKeys.length * modelIds.length;
  let lastError: unknown = null;
  let combosTried = 0;

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const genAI = new GoogleGenerativeAI(apiKeys[keyIndex]);
    const keySuffix = apiKeys[keyIndex].slice(-6);

    for (const modelId of modelIds) {
      combosTried += 1;
      const model = buildModel(genAI, modelId);
      console.log(`[geminiKeyPool] combo ${combosTried}/${totalCombos}: key ...${keySuffix} + ${modelId}`);

      for (let attempt = 0; attempt <= MAX_RETRIES_PER_KEY; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          if (combosTried > 1) {
            console.log(`[geminiKeyPool] Riuscito su combo ${combosTried}/${totalCombos} (key ...${keySuffix} + ${modelId}).`);
          }
          return { text: result.response.text(), modelId };
        } catch (err) {
          lastError = err;
          const retryDelay = isRateLimitError(err) ? parseRetryDelayMs(err) : null;
          const anyErr = err as any;
          console.warn(
            `[geminiKeyPool] combo ${combosTried}/${totalCombos} (key ...${keySuffix} + ${modelId}) fallita (tentativo ${attempt + 1}/${MAX_RETRIES_PER_KEY + 1})`,
            {
              message: err instanceof Error ? err.message : String(err),
              status: anyErr?.status,
              statusText: anyErr?.statusText,
              errorDetails: anyErr?.errorDetails,
            }
          );

          if (retryDelay !== null && retryDelay <= MAX_RETRY_DELAY_MS && attempt < MAX_RETRIES_PER_KEY) {
            await sleep(retryDelay);
            continue;
          }

          break;
        }
      }
    }
  }

  const baseMessage = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`[tried ${combosTried}/${totalCombos} key+model combos] ${baseMessage}`);
}
