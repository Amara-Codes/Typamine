"use server";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";
import { revalidatePath, revalidateTag } from "next/cache";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { withCreatedAtBackfill } from "@/lib/services/font";
import { generateFontQualityWithGemini } from "@/lib/ai/fontQuality";
import { generateFontIdentityWithGemini } from "@/lib/ai/fontIdentity";
import {
  getAllPlaceholderFontAuthorIds,
  getOrCreatePlaceholderFontAuthorId,
  findOrCreateFontAuthorByName,
  findOrCreateManuallyFilledFontAuthorByName,
  getOrCreateUnknownAfterAiCheckAuthorId,
  getAllNonRealFontAuthorIds,
} from "@/lib/services/fontAuthor";
import { FONT_LICENSE_TYPES, UNKNOWN_AFTER_AI_CHECK_LICENSE } from "@/lib/constants/fontLicenseTypes";
import { CACHE_TAGS } from "@/lib/cacheTags";
import crypto from "crypto";

async function checkPermission(permission: string) {
  const session = await getServerAuthSession();
  const permissions = session?.user?.permissions || [];
  const roles = session?.user?.roles || [];
  const isSuperAdmin = roles.includes("SUPERADMIN") || roles.includes("ADMIN");

  if (!isSuperAdmin && !permissions.includes(permission)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getFonts() {
  await checkPermission("font:read");
  return withCreatedAtBackfill(() =>
    prisma.ingredient.findMany({
      include: {
        variants: true,
        tags: true,
      },
      orderBy: {
        name: "asc",
      },
    })
  );
}

export async function getFontById(id: string) {
  await checkPermission("font:read");
  return withCreatedAtBackfill(() =>
    prisma.ingredient.findUnique({
      where: { id },
      include: {
        variants: true,
        tags: true,
      },
    })
  );
}

export async function deleteFont(id: string) {
  await checkPermission("font:delete");
  
  // Fetch existing font to clean up font variant files from R2
  const font = await prisma.ingredient.findUnique({
    where: { id },
    include: { variants: true }
  });
  
  if (font) {
    for (const variant of font.variants) {
      if (variant.woff2Url) {
        try {
          await deleteFromR2(variant.woff2Url);
        } catch (err) {
          console.warn("Failed to delete variant asset from R2 during font delete:", err);
        }
      }
    }
  }

  await prisma.ingredient.delete({ where: { id } });
  revalidatePath("/admin/fonts");
  revalidateTag(CACHE_TAGS.ingredients, "max");
}

// Rating + tag: giudizio soggettivo/qualitativo (com'e' fatto, che stile
// ha), indipendente da chi ha creato il font. Nessun flusso di import
// (single upload, bulk zip, bulk provider) assegna mai tag alla creazione,
// quindi "nessun tag" e' il segnale pulito di "non ancora passato dall'AI
// quality review" — a differenza di `rating`, che ha sempre un valore di
// default reale scritto a import time (mai null), quindi non puo' fare da
// segnale di per se'.
const QUALITY_CANDIDATE_WHERE = {
  tags: { none: {} },
};

export async function getFontsNeedingQualityReview() {
  await checkPermission("font:read");
  return prisma.ingredient.findMany({
    where: QUALITY_CANDIDATE_WHERE,
    select: { id: true, name: true, creator: true, rating: true },
    orderBy: { name: "asc" },
  });
}

export async function hasFontsNeedingQualityReview() {
  await checkPermission("font:read");
  const count = await prisma.ingredient.count({ where: QUALITY_CANDIDATE_WHERE });
  return count > 0;
}

export async function rateFontQualityWithAI(fontId: string) {
  await checkPermission("font:update");

  const [font, allTags] = await Promise.all([
    prisma.ingredient.findUnique({ where: { id: fontId }, select: { id: true, name: true } }),
    prisma.tag.findMany({ select: { id: true, name: true } }),
  ]);
  if (!font) throw new Error("Font not found");

  const result = await generateFontQualityWithGemini(font.name, allTags.map((t) => t.name));

  // Gemini sceglie tra i tag già esistenti (enum nello schema, vedi
  // lib/ai/fontQuality.ts) — qui basta mappare nome -> id. connect() invece
  // di set(): non tocca eventuali tag già assegnati manualmente al font.
  const matchedTagIds = allTags.filter((t) => result.tagNames.includes(t.name)).map((t) => ({ id: t.id }));

  await prisma.ingredient.update({
    where: { id: fontId },
    data: {
      rating: result.rating.toFixed(1),
      ...(matchedTagIds.length > 0 ? { tags: { connect: matchedTagIds } } : {}),
    },
  });

  revalidatePath("/admin/fonts");
  revalidateTag(CACHE_TAGS.ingredients, "max");

  return {
    id: font.id,
    family: font.name,
    rating: result.rating,
    tagNames: result.tagNames,
  };
}

// Autore + licenza: lookup fattuale su origine e diritti del font (chi l'ha
// fatto, con che diritti) — i due fatti sono collegati (vedi
// lib/ai/fontIdentity.ts), quindi una sola chiamata Gemini per entrambi.
// Candidato se manca ALMENO UNO dei due: authorId ancora su un FontAuthor
// placeholder d'import, o licenseType mai settato.
async function getIdentityCandidateWhere() {
  const placeholderAuthorIds = await getAllPlaceholderFontAuthorIds();
  return {
    OR: [
      { authorId: { in: placeholderAuthorIds } },
      { licenseType: null },
      { licenseType: "" },
    ],
  };
}

export async function getFontsNeedingIdentityDetection() {
  await checkPermission("font:read");
  const where = await getIdentityCandidateWhere();
  return prisma.ingredient.findMany({
    where,
    select: { id: true, name: true, creator: true, licenseType: true },
    orderBy: { name: "asc" },
  });
}

export async function hasFontsNeedingIdentityDetection() {
  await checkPermission("font:read");
  const where = await getIdentityCandidateWhere();
  const count = await prisma.ingredient.count({ where });
  return count > 0;
}

export async function detectFontIdentityWithAI(fontId: string) {
  await checkPermission("font:update");

  const [font, placeholderAuthorIds] = await Promise.all([
    prisma.ingredient.findUnique({
      where: { id: fontId },
      select: { id: true, name: true, authorId: true, licenseType: true },
    }),
    getAllPlaceholderFontAuthorIds(),
  ]);
  if (!font) throw new Error("Font not found");

  // Un font puo' essere candidato per un solo campo su due (es. autore gia'
  // risolto ma licenza ancora vuota): non sovrascriviamo mai un campo gia'
  // risolto con una nuova ipotesi di Gemini, anche se la chiamata restituisce
  // sempre entrambi i valori.
  const needsAuthor = !font.authorId || placeholderAuthorIds.includes(font.authorId);
  const needsLicense = !font.licenseType;

  const result = await generateFontIdentityWithGemini(font.name);

  const data: { creator?: string; authorId?: string; licenseType?: string } = {};

  if (needsAuthor) {
    data.creator = result.author;
    // Se Gemini non trova un autore reale, il font passa dal placeholder
    // d'import (stato "da controllare") al placeholder terminale "unknown
    // after AI check" (stato "controllato, resta ignoto") — cosi' non
    // ricompare tra i candidati a ogni giro con la stessa domanda gia' risposta.
    const resolvedAuthorId = await findOrCreateFontAuthorByName(result.author);
    data.authorId = resolvedAuthorId ?? (await getOrCreateUnknownAfterAiCheckAuthorId());
  }

  if (needsLicense) {
    // Stessa logica: se Gemini non sa rispondere ("Unknown"), salviamo il
    // placeholder terminale invece del valore letterale "Unknown" (che non
    // e' un FONT_LICENSE_TYPES valido) o di forzare una licenza indovinata.
    data.licenseType =
      result.licenseType.trim().toLowerCase() === "unknown" ? UNKNOWN_AFTER_AI_CHECK_LICENSE : result.licenseType;
  }

  await prisma.ingredient.update({ where: { id: fontId }, data });

  revalidatePath("/admin/fonts");
  revalidateTag(CACHE_TAGS.ingredients, "max");

  return {
    id: font.id,
    family: font.name,
    author: needsAuthor ? result.author : null,
    licenseType: needsLicense ? result.licenseType : null,
  };
}

// "Fill Missing Authors" in dashboard: riempimento manuale, un font alla
// volta, per i font senza un autore reale — placeholder d'import (mai
// controllato), terminale "unknown after AI check" (l'AI non l'ha trovato),
// o authorId null. A differenza del bottone AI, qui l'admin puo' risolvere
// anche i casi su cui Gemini ha gia' rinunciato.
async function getManualAuthorCandidateWhere() {
  const nonRealAuthorIds = await getAllNonRealFontAuthorIds();
  return {
    OR: [{ authorId: { in: nonRealAuthorIds } }, { authorId: null }],
  };
}

export async function getFontsNeedingManualAuthor() {
  await checkPermission("font:read");
  const where = await getManualAuthorCandidateWhere();
  return prisma.ingredient.findMany({
    where,
    select: { id: true, name: true, creator: true },
    orderBy: { name: "asc" },
  });
}

export async function getFontsNeedingManualAuthorCount() {
  await checkPermission("font:read");
  const where = await getManualAuthorCandidateWhere();
  return prisma.ingredient.count({ where });
}

export async function assignManualFontAuthor(fontId: string, authorName: string) {
  await checkPermission("font:update");

  const trimmed = authorName.trim();
  if (!trimmed) throw new Error("Author name is required.");

  const font = await prisma.ingredient.findUnique({ where: { id: fontId }, select: { id: true, name: true } });
  if (!font) throw new Error("Font not found");

  const authorId = await findOrCreateManuallyFilledFontAuthorByName(trimmed);

  await prisma.ingredient.update({
    where: { id: fontId },
    data: { authorId, creator: trimmed },
  });

  revalidatePath("/admin/fonts");
  revalidateTag(CACHE_TAGS.ingredients, "max");

  return { id: font.id, family: font.name, authorName: trimmed };
}

// Stesso pattern di "Fill Missing Authors" ma per licenseType: candidato se
// mai settato o se ancora sul terminale "unknown after AI check" (l'admin
// puo' risolvere anche i casi su cui Gemini ha gia' rinunciato).
async function getManualLicenseCandidateWhere() {
  return {
    OR: [{ licenseType: null }, { licenseType: "" }, { licenseType: UNKNOWN_AFTER_AI_CHECK_LICENSE }],
  };
}

export async function getFontsNeedingManualLicense() {
  await checkPermission("font:read");
  const where = await getManualLicenseCandidateWhere();
  return prisma.ingredient.findMany({
    where,
    select: { id: true, name: true, licenseType: true },
    orderBy: { name: "asc" },
  });
}

export async function getFontsNeedingManualLicenseCount() {
  await checkPermission("font:read");
  const where = await getManualLicenseCandidateWhere();
  return prisma.ingredient.count({ where });
}

export async function assignManualFontLicense(fontId: string, licenseType: string) {
  await checkPermission("font:update");

  const trimmed = licenseType.trim();
  if (!(FONT_LICENSE_TYPES as readonly string[]).includes(trimmed)) {
    throw new Error("Invalid license type.");
  }

  const font = await prisma.ingredient.findUnique({ where: { id: fontId }, select: { id: true, name: true } });
  if (!font) throw new Error("Font not found");

  await prisma.ingredient.update({
    where: { id: fontId },
    data: { licenseType: trimmed },
  });

  revalidatePath("/admin/fonts");
  revalidateTag(CACHE_TAGS.ingredients, "max");

  return { id: font.id, family: font.name, licenseType: trimmed };
}

export async function saveFont(prevState: any, formData: FormData, id?: string) {
  const session = await getServerAuthSession();
  if (!session?.user) return "Unauthorized";
  
  try {
    if (id) {
      await checkPermission("font:update");
    } else {
      await checkPermission("font:create");
    }

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const category = formData.get("category") as string;
    const creatorInput = (formData.get("creator") as string | null)?.trim();
    const creator = creatorInput || "Typamine Import";
    const rating = formData.get("rating") as string;
    const symbol = formData.get("symbol") as string | null;
    const formula = formData.get("formula") as string | null;
    const importedFrom = (formData.get("importedFrom") as string | null) || null;
    const licenseType = (formData.get("licenseType") as string | null) || null;
    let authorId = (formData.get("authorId") as string | null) || null;
    // Nessun autore scelto in creazione (nuovo font via upload singolo in admin):
    // agganciato al placeholder finche' l'AI o un admin non gli assegna l'autore reale.
    if (!id && !authorId) {
      authorId = await getOrCreatePlaceholderFontAuthorId("localSingleImport");
    }
    const isVariable = formData.get("isVariable") === "true";
    const tagIds = formData.getAll("tagIds") as string[];

    if (!name || !slug || !category) {
      return "Name, Slug, and Category are required.";
    }

    const fontId = id || crypto.randomUUID();
    
    // Parse variants arrays
    const variantIds = formData.getAll("variantId") as string[];
    const variantLabels = formData.getAll("variantLabel") as string[];
    const variantWeights = formData.getAll("variantWeight") as string[];
    const variantStyles = formData.getAll("variantStyle") as string[];
    const variantWoff2Urls = formData.getAll("variantWoff2Url") as string[];
    const variantFiles = formData.getAll("variantFile") as File[];

    // Fetch existing variants to compare (for deletions)
    let existingVariants: { id: string; woff2Url: string }[] = [];
    if (id) {
      const existing = await prisma.ingredient.findUnique({
        where: { id },
        select: { variants: { select: { id: true, woff2Url: true } } }
      });
      existingVariants = existing?.variants || [];
    }

    const data = {
      name,
      slug,
      category,
      creator,
      rating,
      symbol,
      formula,
      importedFrom,
      licenseType,
      authorId,
      isVariable,
    };

    // 1. Save Ingredient (Font info) first to DB
    let font;
    try {
      if (id) {
        font = await prisma.ingredient.update({
          where: { id },
          data: {
            ...data,
            tags: {
              set: tagIds.map((tId) => ({ id: tId })),
            },
          },
        });
      } else {
        font = await prisma.ingredient.create({
          data: {
            id: fontId,
            ...data,
            // Impostato esplicitamente invece di affidarsi al DEFAULT a livello di DB:
            // in dev, un client Prisma già avviato prima di una modifica allo schema
            // può ignorare il default e scrivere NULL su questa colonna.
            createdAt: new Date(),
            tags: {
              connect: tagIds.map((tId) => ({ id: tId })),
            },
          }
        });
      }
    } catch (dbError) {
      throw dbError;
    }

    const uploadedKeys: string[] = [];
    const finalVariants: any[] = [];

    // 2. Upload woff2 files to R2 and upsert FontVariant records
    try {
      for (let i = 0; i < variantLabels.length; i++) {
        const label = variantLabels[i];
        const weight = parseInt(variantWeights[i], 10) || 400;
        const style = variantStyles[i] || "normal";
        const file = variantFiles[i];
        const hasNewFile = file && file.size > 0;
        
        let woff2Url = variantWoff2Urls[i] || "";
        const currentValId = variantIds[i] || crypto.randomUUID();
        const fontFamilyName = `Typamine_${name.replace(/\s+/g, "")}`;

        if (hasNewFile) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const finalFileName = `${currentValId}.woff2`;
          
          const { url, key } = await uploadToR2(
            buffer,
            "fonts/files",
            finalFileName,
            "font/woff2"
          );
          woff2Url = url;
          uploadedKeys.push(key);
        }

        finalVariants.push({
          id: currentValId,
          label,
          weight,
          style,
          woff2Url,
          fontFamilyName,
        });
      }

      // Sync variants inside database
      const submittedIds = new Set(finalVariants.map(v => v.id));
      const deletedVariants = existingVariants.filter(ev => !submittedIds.has(ev.id));

      // Delete removed variants from db and R2
      if (deletedVariants.length > 0) {
        const deleteIds = deletedVariants.map(v => v.id);
        await prisma.fontVariant.deleteMany({
          where: { id: { in: deleteIds } }
        });
        
        for (const deleted of deletedVariants) {
          if (deleted.woff2Url) {
            try {
              await deleteFromR2(deleted.woff2Url);
            } catch (cleanError) {
              console.warn("Failed to delete unused variant woff2 file from R2:", cleanError);
            }
          }
        }
      }

      // Upsert submitted variants
      for (const variant of finalVariants) {
        const existingVal = existingVariants.find(ev => ev.id === variant.id);

        await prisma.fontVariant.upsert({
          where: { id: variant.id },
          update: {
            label: variant.label,
            weight: variant.weight,
            style: variant.style,
            woff2Url: variant.woff2Url,
            fontFamilyName: variant.fontFamilyName,
          },
          create: {
            id: variant.id,
            label: variant.label,
            weight: variant.weight,
            style: variant.style,
            woff2Url: variant.woff2Url,
            fontFamilyName: variant.fontFamilyName,
            ingredientId: fontId,
          }
        });

        // If variant file changed, delete the old file
        if (existingVal && existingVal.woff2Url && existingVal.woff2Url !== variant.woff2Url) {
          try {
            await deleteFromR2(existingVal.woff2Url);
          } catch (cleanError) {
            console.warn("Failed to delete old variant woff2 file from R2:", cleanError);
          }
        }
      }
    } catch (variantOrR2Error) {
      // Rollback newly uploaded files from R2
      for (const key of uploadedKeys) {
        try {
          await deleteFromR2(key);
        } catch (cleanupError) {
          console.error("Critical: failed to rollback uploaded key from R2:", cleanupError);
        }
      }

      // Rollback database ingredient if it was new
      if (!id) {
        try {
          await prisma.ingredient.delete({ where: { id: fontId } });
        } catch (dbDeleteError) {
          console.error("Critical: failed to roll back ingredient creation after R2 error:", dbDeleteError);
        }
      }
      throw variantOrR2Error;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Font Action] Error saving font:", error);
    return errorMessage || "Failed to save font.";
  }

  // Niente redirect() qui: un redirect server-side riporta sempre a
  // "/admin/fonts" pagina 1, perdendo pagina/ricerca/ordinamento con cui
  // l'utente era arrivato al form (e anche il tasto Back del browser non
  // recupera quello stato, perché quella pagina "fresca" diventa una nuova
  // voce nella history). Il chiamante (FontForm) fa router.back() lato
  // client dopo un salvataggio riuscito, tornando esattamente alla lista
  // con lo stato con cui l'utente l'aveva lasciata.
  revalidatePath("/admin/fonts");
  revalidateTag(CACHE_TAGS.ingredients, "max");
}
