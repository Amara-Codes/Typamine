import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Configurazione del client S3 compatibile con Cloudflare R2
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const endpoint = process.env.R2_ENDPOINT || (ACCOUNT_ID ? `https://${ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

const s3Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_DOMAIN || ""; // L'URL pubblico associato al bucket o dominio personalizzato

/**
 * Estrae la chiave (Key/Path) del file all'interno del bucket partendo dal suo URL pubblico.
 */
export function getKeyFromUrl(url: string): string {
  return url.replace(`${PUBLIC_URL}/`, "");
}

/**
 * Operazione Atomica: Carica un file su R2.
 */
export async function uploadToR2(
  fileBuffer: Buffer | Uint8Array,
  folderPath: string,
  fileName: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  // Normalizza il percorso rimuovendo slash iniziali o finali ridondanti
  const cleanFolder = folderPath.replace(/^\/+|\/+$/g, "");
  const key = `${cleanFolder}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return {
    url: `${PUBLIC_URL}/${key}`,
    key,
  };
}

/**
 * Operazione Atomica: Elimina un file da R2 usando la chiave o l'URL completo.
 */
export async function deleteFromR2(fileUrlOrKey: string): Promise<void> {
  const key = fileUrlOrKey.startsWith(PUBLIC_URL)
    ? getKeyFromUrl(fileUrlOrKey)
    : fileUrlOrKey;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * SALVATAGGIO SICURO (Prima R2 -> Poi DB)
 * Carica il file su R2 e, in caso di successo, esegue la callback per aggiornare il database.
 * Se la callback del DB fallisce, cancella automaticamente il file caricato su R2 per evitare file orfani.
 */
export async function safeUploadWithDb<T>(
  fileBuffer: Buffer | Uint8Array,
  folderPath: string,
  fileName: string,
  contentType: string,
  dbUpdateCallback: (url: string) => Promise<T>
): Promise<T> {
  const { url, key } = await uploadToR2(fileBuffer, folderPath, fileName, contentType);

  try {
    // Esegui la query sul DB passando l'URL del file appena caricato
    return await dbUpdateCallback(url);
  } catch (dbError) {
    // ROLLBACK: Se il database fallisce, pulisci R2 eliminando il file appena caricato
    try {
      await deleteFromR2(key);
    } catch (cleanupError) {
      console.error("Errore critico durante il rollback di R2:", cleanupError);
    }
    throw dbError; // Rilancia l'errore per farlo gestire all'applicazione
  }
}

/**
 * SOSTITUZIONE SICURA (Prima R2 -> Poi DB -> Infine Rimozione Vecchio File)
 * 1. Carica il nuovo file su R2.
 * 2. Esegue la callback per aggiornare il database con il nuovo URL.
 * 3. Se tutto va a buon fine, elimina il vecchio file da R2.
 * In caso di errore nel DB, effettua il rollback eliminando il nuovo file caricato.
 */
export async function safeReplaceWithDb<T>(
  newFileBuffer: Buffer | Uint8Array,
  oldFileUrl: string | null | undefined,
  folderPath: string,
  fileName: string,
  contentType: string,
  dbUpdateCallback: (url: string) => Promise<T>
): Promise<T> {
  // 1. Carica la nuova risorsa
  const { url: newUrl, key: newKey } = await uploadToR2(
    newFileBuffer,
    folderPath,
    fileName,
    contentType
  );

  try {
    // 2. Aggiorna il DB
    const dbResult = await dbUpdateCallback(newUrl);

    // 3. Se il DB ha successo, elimina la vecchia risorsa (se esisteva)
    if (oldFileUrl) {
      try {
        await deleteFromR2(oldFileUrl);
      } catch (deleteError) {
        // Non blocchiamo il flusso se la vecchia immagine non viene cancellata.
        // L'app funziona correttamente con la nuova, registriamo solo il warning.
        console.warn("Impossibile eliminare la vecchia risorsa da R2:", deleteError);
      }
    }

    return dbResult;
  } catch (dbError) {
    // ROLLBACK: Il DB è fallito, eliminiamo la nuova immagine appena caricata
    try {
      await deleteFromR2(newKey);
    } catch (cleanupError) {
      console.error("Errore critico nel rollback della nuova immagine R2:", cleanupError);
    }
    throw dbError;
  }
}

/**
 * CANCELLAZIONE SICURA (Prima R2 -> Poi DB)
 * Elimina fisicamente il file da R2 e poi esegue l'aggiornamento sul DB.
 */
export async function safeDeleteWithDb<T>(
  fileUrl: string | null | undefined,
  dbDeleteCallback: () => Promise<T>
): Promise<T | null> {
  if (!fileUrl) {
    // Se non c'era nessun file, aggiorniamo solo il DB (es: rimuovendo il riferimento)
    return await dbDeleteCallback();
  }

  // 1. Rimuovi da R2
  await deleteFromR2(fileUrl);

  // 2. Esegui la query sul DB
  return await dbDeleteCallback();
}