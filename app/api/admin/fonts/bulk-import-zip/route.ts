import { NextRequest, NextResponse } from "next/server";
import { unzipSync } from "fflate";
// @ts-expect-error fontverter has no official types
import fontverter from "fontverter";
import prisma from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import { isVariableFont, getFontWeightAndStyle, getVariantLabel } from "@/lib/fontMeta";
import { getOrCreatePlaceholderFontAuthorId } from "@/lib/services/fontAuthor";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cacheTags";
import crypto from "crypto";

const FONT_EXTENSIONS = new Set(["ttf", "otf", "woff", "woff2"]);

function extOf(path: string): string {
  return path.split(".").pop()?.toLowerCase() || "";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Ogni cartella di primo livello nello zip diventa un Ingredient; i file
// font al suo interno (ttf/otf/woff/woff2, in qualunque sottocartella) ne
// diventano le FontVariant, stesso schema del bulk-import da provider
// (app/api/admin/fonts/bulk-import/route.ts) ma con peso/stile letti dalla
// tabella OS/2 del font invece che dalla chiave di un manifest esterno.
//
// Lo ZIP spec impone "/" come separatore, ma alcuni tool Windows (es. store
// diretto via WinRAR/API Windows) scrivono "\" nei path interni — senza
// normalizzare qui, ogni entry finiva trattata come "file alla radice"
// (nessun "/" da splittare) e lo zip risultava con zero cartelle valide.
function normalizePathSeparators(path: string): string {
  return path.replace(/\\/g, "/");
}

function groupEntriesByFolder(entries: Record<string, Uint8Array>): Map<string, Array<{ path: string; data: Uint8Array }>> {
  const groups = new Map<string, Array<{ path: string; data: Uint8Array }>>();

  for (const [rawPath, data] of Object.entries(entries)) {
    if (data.length === 0) continue; // directory entry
    const path = normalizePathSeparators(rawPath);
    if (path.includes("__MACOSX/") || path.split("/").pop()?.startsWith(".")) continue;

    const segments = path.split("/").filter(Boolean);
    if (segments.length < 2) continue; // file at zip root, not inside a folder: skip

    const folder = segments[0];
    if (!FONT_EXTENSIONS.has(extOf(path))) continue;

    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder)!.push({ path, data });
  }

  return groups;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No zip file provided" }, { status: 400 });
    }

    const zipBuffer = new Uint8Array(await file.arrayBuffer());
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(zipBuffer);
    } catch (zipErr: any) {
      return NextResponse.json({ error: `Invalid or corrupted zip file: ${zipErr.message}` }, { status: 400 });
    }

    const folders = groupEntriesByFolder(entries);
    if (folders.size === 0) {
      return NextResponse.json({ error: "No folders with font files (.ttf/.otf/.woff/.woff2) found in the zip." }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const total = folders.size;
    const localBulkImportAuthorId = await getOrCreatePlaceholderFontAuthorId("localBulkImport");

    // Risposta streammata (NDJSON, una riga = un evento JSON): la scansione di
    // uno zip con decine di cartelle puo' richiedere svariati secondi, e con
    // una singola JSON response il terminale del popup restava fermo su
    // "Extracting..." per tutta la durata. Qui invece ogni cartella processata
    // emette subito il proprio esito (skip per doppione, import riuscito, errore).
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        const imported: string[] = [];
        const failed: Array<{ family: string; error: string }> = [];

        send({ type: "total", total });

        let index = 0;
        for (const [folderName, files] of folders) {
          index += 1;
          const familyName = folderName.trim();
          send({ type: "log", message: `[${index}/${total}] Processing "${familyName}"...` });

          try {
            const slug = slugify(familyName);

            const existing = await prisma.ingredient.findUnique({ where: { slug } });
            if (existing) {
              failed.push({ family: familyName, error: "Font family already exists in database." });
              send({ type: "log", message: `Skipped: "${familyName}" is already in the database.` });
              send({ type: "progress", current: index, total });
              continue;
            }

            const ingredientId = crypto.randomUUID();
            const fontFamilyName = `Typamine_${familyName.replace(/\s+/g, "")}`;

            const createdVariants: Array<{
              id: string;
              fontFamilyName: string;
              weight: number;
              style: string;
              woff2Url: string;
              label: string;
            }> = [];

            let isVariable = false;
            // Stessa cartella puo' contenere lo stesso peso/stile in piu' formati
            // (es. Roboto-Regular.ttf + Roboto-Regular.otf): teniamo solo il primo,
            // altrimenti finiremmo con 2 FontVariant identiche (nessun vincolo DB le impedisce).
            const seenVariants = new Set<string>();

            for (const { path, data } of files) {
              try {
                const fileBuffer: Buffer = Buffer.from(data);

                // Rileva il formato reale e ricava un SFNT (ttf/otf) da cui leggere
                // metadata; e in parallelo un WOFF2 da salvare, riusando fontverter
                // esattamente come fa /api/admin/fonts/convert e il bulk-import da provider.
                const format = fontverter.detectFormat(fileBuffer);

                const sfntBuffer: Buffer = format === "sfnt"
                  ? fileBuffer
                  : Buffer.from(await fontverter.convert(fileBuffer, "sfnt"));

                const { isVar } = isVariableFont(sfntBuffer);
                const { weight, style } = getFontWeightAndStyle(sfntBuffer);

                const variantKey = isVar ? "variable" : `${weight}-${style}`;
                if (seenVariants.has(variantKey)) {
                  console.warn(`[Bulk Import Zip] Skipping duplicate ${variantKey} in "${folderName}": ${path}`);
                  continue;
                }
                seenVariants.add(variantKey);

                if (isVar) isVariable = true;

                const woff2Buffer: Buffer = format === "woff2"
                  ? fileBuffer
                  : Buffer.from(await fontverter.convert(fileBuffer, "woff2"));

                const label = isVar ? "Variable" : getVariantLabel(weight, style);

                const variantId = crypto.randomUUID();
                const uploadRes = await uploadToR2(
                  woff2Buffer,
                  "fonts/files",
                  `${variantId}.woff2`,
                  "font/woff2"
                );

                createdVariants.push({
                  id: variantId,
                  fontFamilyName,
                  weight,
                  style,
                  woff2Url: uploadRes.url,
                  label,
                });

                // Un font variabile porta gia' tutti i pesi in un solo file:
                // fermiamoci al primo trovato nella cartella, come nel bulk-import da provider.
                if (isVar) break;
              } catch (fileErr: any) {
                console.error(`[Bulk Import Zip] Failed to process ${path}:`, fileErr);
              }
            }

            if (createdVariants.length === 0) {
              throw new Error("No valid font file could be processed in this folder.");
            }

            await prisma.ingredient.create({
              data: {
                id: ingredientId,
                name: familyName,
                slug,
                category: "Sans-Serif",
                creator: "Typamine Import",
                rating: "9.0",
                importedFrom: "Local Bulk Upload",
                authorId: localBulkImportAuthorId,
                isVariable,
                createdAt: new Date(),
                variants: {
                  create: createdVariants,
                },
              },
            });

            imported.push(familyName);
            send({ type: "log", message: `Imported "${familyName}" (${createdVariants.length} variant${createdVariants.length === 1 ? "" : "s"}).` });
          } catch (folderErr: any) {
            console.error(`[Bulk Import Zip] Error importing folder ${folderName}:`, folderErr);
            failed.push({ family: folderName, error: folderErr.message || "Unknown error" });
            send({ type: "log", message: `Failed "${familyName}": ${folderErr.message || "Unknown error"}` });
          }

          send({ type: "progress", current: index, total });
        }

        if (imported.length > 0) revalidateTag(CACHE_TAGS.ingredients, "max");
        send({ type: "done", imported, failed });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("[Bulk Import Zip Route] Global Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process zip import request." }, { status: 500 });
  }
}
