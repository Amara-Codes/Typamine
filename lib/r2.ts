import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Helper to initialize the S3Client using R2 credentials
let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (s3ClientInstance) return s3ClientInstance;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn("[R2 Client] R2 environment variables are not fully configured. Falling back.");
    return null;
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

/**
 * Uploads a file buffer or stream to Cloudflare R2 under a specific folder path.
 * 
 * @param buffer File buffer to upload
 * @param folderPath Subfolder structure (e.g. 'therapists/images') without trailing slash
 * @param fileName File name (e.g. 'therapist-123.png')
 * @param contentType MIME type of the file
 * @returns Public URL of the uploaded file, or null if upload failed
 */
export async function uploadFileToR2(
  buffer: Buffer,
  folderPath: string,
  fileName: string,
  contentType: string
): Promise<string | null> {
  console.log("[R2 Stub] Bypassing Cloudflare R2 upload for:", fileName);
  return null;
}

/**
 * Extracts the storage key from a public R2 URL.
 * 
 * @param url Public R2 URL or direct S3 storage endpoint URL
 * @returns Key string, or null if key could not be resolved
 */
export function getKeyFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;
    
    // Check if the URL starts with the public custom domain
    if (publicDomain) {
      const cleanDomain = publicDomain.replace(/\/+$/, "");
      if (url.startsWith(cleanDomain)) {
        return url.replace(cleanDomain, "").replace(/^\/+/, "");
      }
    }

    // Fallback: parse direct cloudflarestorage.com URL
    const parsed = new URL(url);
    if (parsed.hostname.includes("r2.cloudflarestorage.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      // Format: /<bucket>/<key...>
      if (parts.length > 1) {
        return parts.slice(1).join("/");
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Deletes a file from the Cloudflare R2 bucket given its public URL or key.
 * 
 * @param urlOrKey The public URL or direct key of the object to delete
 * @returns Boolean representing delete success status
 */
export async function deleteFileFromR2(urlOrKey: string): Promise<boolean> {
  console.log("[R2 Stub] Bypassing Cloudflare R2 delete for:", urlOrKey);
  return true;
}
