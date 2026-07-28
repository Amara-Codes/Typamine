"use server";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";
import { revalidatePath, revalidateTag } from "next/cache";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { parseSeoFormFields, upsertSeoModule } from "@/lib/services/seo";
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

import { withSafeDbQuery } from "@/lib/services/dbMigration";

export async function getAdminPairings() {
  await checkPermission("font:read");
  return withSafeDbQuery(() =>
    prisma.prescription.findMany({
      include: {
        primaryFont: true,
        secondaryFont: true,
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    })
  );
}

export async function getAdminPairingById(id: string) {
  await checkPermission("font:read");
  return withSafeDbQuery(() =>
    prisma.prescription.findUnique({
      where: { id },
      include: {
        primaryFont: { include: { variants: true } },
        secondaryFont: { include: { variants: true } },
        tags: true,
      },
    })
  );
}

export async function deletePairing(id: string) {
  await checkPermission("font:delete");

  const pairing = await prisma.prescription.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  if (pairing?.imageUrl) {
    try {
      await deleteFromR2(pairing.imageUrl);
    } catch (err) {
      console.warn("Failed to delete pairing image from R2:", err);
    }
  }

  await prisma.prescription.delete({ where: { id } });
  revalidatePath("/admin/pairings");
  revalidatePath("/prescriptions");
  revalidateTag(CACHE_TAGS.pairings, "max");
}

async function setPairingPublished(id: string, published: boolean) {
  await checkPermission("font:update");
  await prisma.prescription.update({ where: { id }, data: { published } });
  revalidatePath("/admin/pairings");
  revalidatePath("/prescriptions");
  revalidateTag(CACHE_TAGS.pairings, "max");
}

export async function publishPairing(id: string) {
  return setPairingPublished(id, true);
}

export async function unpublishPairing(id: string) {
  return setPairingPublished(id, false);
}

export async function savePairing(prevState: any, formData: FormData, id?: string) {
  const session = await getServerAuthSession();
  if (!session?.user) return "Unauthorized";

  try {
    if (id) {
      await checkPermission("font:update");
    } else {
      await checkPermission("font:create");
    }

    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const insight = (formData.get("insight") as string)?.trim() || null;
    const primaryFontId = formData.get("primaryFontId") as string;
    const secondaryFontId = formData.get("secondaryFontId") as string;
    const published = formData.get("published") === "true";
    const tagIds = formData.getAll("tagIds") as string[];
    const removeImage = formData.get("removeImage") === "true";
    
    // Image sources: either uploaded file or canvas base64 string
    const imageFile = formData.get("image") as File | null;
    const canvasImageData = formData.get("canvasImageData") as string | null;

    if (!name || !slug || !primaryFontId || !secondaryFontId) {
      return "Name, Slug, Primary Font, and Secondary Font are required.";
    }

    // Check unique slug
    const existingSlug = await prisma.prescription.findFirst({
      where: {
        slug,
        NOT: id ? { id } : undefined,
      },
    });

    if (existingSlug) {
      return "A pairing with this slug already exists.";
    }

    let existingPairing: {
      imageUrl: string | null;
      insight: string | null;
      seo: { id: string } | null;
    } | null = null;
    if (id) {
      existingPairing = await prisma.prescription.findUnique({
        where: { id },
        select: { imageUrl: true, insight: true, seo: { select: { id: true } } },
      });
    }

    const pairingId = id || crypto.randomUUID();

    // Insight Modules Image Processing — PRIMA di scrivere su DB (stesso fix
    // di lib/actions/post.ts): i moduli "paragraphWithImage" arrivano con
    // l'immagine come data-URL base64 dentro il JSON `insight` (anteprima
    // live) e il file vero in un input nascosto `module_<id>_image`. Se lo
    // caricassimo dopo il primo create/update, quel base64 finirebbe scritto
    // nella colonna `insight`, che su D1 ha un limite di dimensione per
    // valore (SQLITE_TOOBIG con immagini grandi).
    interface InsightModuleRecord {
      id: string;
      type: string;
      props: Record<string, unknown> & { imageSrc?: string };
    }
    let finalInsight = insight;
    try {
      const modules: InsightModuleRecord[] = insight ? JSON.parse(insight) : [];
      if (Array.isArray(modules)) {
        let oldModulesById: Record<string, InsightModuleRecord> = {};
        if (existingPairing?.insight) {
          try {
            const oldModules: InsightModuleRecord[] = JSON.parse(existingPairing.insight);
            if (Array.isArray(oldModules)) {
              oldModulesById = Object.fromEntries(oldModules.map((m) => [m.id, m]));
            }
          } catch {}
        }

        for (let index = 0; index < modules.length; index++) {
          const mod = modules[index];
          if (!mod || mod.type !== "paragraphWithImage") continue;

          const file = formData.get(`module_${mod.id}_image`) as File | null;
          const oldImageSrc = oldModulesById[mod.id]?.props?.imageSrc as string | undefined;

          if (file && file.size > 0) {
            try {
              const buffer = Buffer.from(await file.arrayBuffer());
              const ext = file.name.split(".").pop() || "png";
              const timestamp = Date.now();
              // Nome file: [pairingId]-[timestamp]-[indice del modulo in insight]
              const fileName = `${pairingId}-${timestamp}-${index}.${ext}`;

              const { url } = await uploadToR2(
                buffer,
                "pairings/insights/images",
                fileName,
                file.type || "image/png"
              );
              mod.props.imageSrc = url;

              if (oldImageSrc && oldImageSrc.startsWith("http")) {
                try {
                  await deleteFromR2(oldImageSrc);
                } catch (cleanError) {
                  console.warn("Failed to delete previous insight module image from R2:", cleanError);
                }
              }
            } catch (uploadError) {
              console.error("Failed to upload insight module image to R2:", uploadError);
            }
          } else if (!mod.props?.imageSrc && oldImageSrc && oldImageSrc.startsWith("http")) {
            // L'utente ha rimosso l'immagine senza sceglierne una nuova
            try {
              await deleteFromR2(oldImageSrc);
            } catch (cleanError) {
              console.warn("Failed to delete removed insight module image from R2:", cleanError);
            }
          } else if (typeof mod.props?.imageSrc === "string" && mod.props.imageSrc.startsWith("data:")) {
            // Nessun file nell'input nascosto ma imageSrc è ancora un base64
            // (stato client disallineato) — non va MAI scritto su D1: meglio
            // perdere l'immagine che far fallire l'intero salvataggio.
            mod.props.imageSrc = oldImageSrc && oldImageSrc.startsWith("http") ? oldImageSrc : "";
          }
        }

        finalInsight = JSON.stringify(modules);
      }
    } catch (insightError) {
      console.error("Failed to process insight modules images:", insightError);
    }

    const baseData = {
      name,
      slug,
      description,
      insight: finalInsight,
      published,
      primaryFontId,
      secondaryFontId,
    };

    let pairing;
    if (id) {
      pairing = await prisma.prescription.update({
        where: { id },
        data: {
          ...baseData,
          tags: {
            set: tagIds.map((tId) => ({ id: tId })),
          },
        },
      });
    } else {
      pairing = await prisma.prescription.create({
        data: {
          id: pairingId,
          ...baseData,
          createdAt: new Date(),
          tags: {
            connect: tagIds.map((tId) => ({ id: tId })),
          },
        },
      });
    }

    // R2 Image Processing
    let uploadedKey: string | null = null;
    // Immagine finale del pairing (canvas o upload dopo l'elaborazione qui
    // sotto) — usata come fallback per le immagini social del modulo SEO:
    // "assegna quella del canvas" se l'admin non ne assegna una propria
    // (non c'è ancora una tab SEO su Pairing, quindi qui è sempre il fallback).
    let finalImageUrl: string | null = existingPairing?.imageUrl ?? null;
    try {
      if (removeImage) {
        await prisma.prescription.update({
          where: { id: pairing.id },
          data: { imageUrl: null },
        });
        finalImageUrl = null;
        if (existingPairing?.imageUrl) {
          try {
            await deleteFromR2(existingPairing.imageUrl);
          } catch (cleanError) {
            console.warn("Failed to remove old pairing image from R2:", cleanError);
          }
        }
      } else if (canvasImageData && canvasImageData.startsWith("data:image/")) {
        // Base64 from canvas
        const matches = canvasImageData.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          const contentType = matches[1];
          const ext = contentType.split("/")[1] || "png";
          const buffer = Buffer.from(matches[2], "base64");
          const timestamp = Date.now();
          const fileName = `${pairing.id}-${timestamp}.${ext}`;

          const { url, key } = await uploadToR2(
            buffer,
            "pairings/images",
            fileName,
            contentType
          );
          uploadedKey = key;
          finalImageUrl = url;

          await prisma.prescription.update({
            where: { id: pairing.id },
            data: { imageUrl: url },
          });

          if (existingPairing?.imageUrl) {
            try {
              await deleteFromR2(existingPairing.imageUrl);
            } catch (cleanError) {
              console.warn("Failed to delete previous pairing image from R2:", cleanError);
            }
          }
        }
      } else if (imageFile && imageFile.size > 0) {
        // Direct file upload
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const ext = imageFile.name.split(".").pop() || "png";
        const timestamp = Date.now();
        const fileName = `${pairing.id}-${timestamp}.${ext}`;

        const { url, key } = await uploadToR2(
          buffer,
          "pairings/images",
          fileName,
          imageFile.type || "image/png"
        );
        uploadedKey = key;
        finalImageUrl = url;

        await prisma.prescription.update({
          where: { id: pairing.id },
          data: { imageUrl: url },
        });

        if (existingPairing?.imageUrl) {
          try {
            await deleteFromR2(existingPairing.imageUrl);
          } catch (cleanError) {
            console.warn("Failed to delete previous pairing image from R2:", cleanError);
          }
        }
      }

      // Modulo SEO: nessuna tab dedicata ancora su Pairing, quindi qui non
      // passiamo nessun campo testo — solo il fallback immagine ("assegna
      // quella del canvas" se OG/Twitter non hanno un'immagine propria).
      const seoId = await upsertSeoModule(existingPairing?.seo?.id, parseSeoFormFields(formData), {
        fallbackImageUrl: finalImageUrl,
      });
      if (!existingPairing?.seo?.id) {
        await prisma.prescription.update({ where: { id: pairing.id }, data: { seoId } });
      }
    } catch (r2Error) {
      if (uploadedKey) {
        try {
          await deleteFromR2(uploadedKey);
        } catch (cleanError) {
          console.error("Critical: failed to delete uploaded file from R2 after DB error:", cleanError);
        }
      }
      if (!id) {
        try {
          await prisma.prescription.delete({ where: { id: pairing.id } });
        } catch (dbDeleteError) {
          console.error("Critical: failed to roll back pairing creation after R2 upload error:", dbDeleteError);
        }
      }
      throw r2Error;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Pairing Action] Error saving pairing:", error);
    return errorMessage || "Failed to save pairing.";
  }

  // Niente redirect() qui — vedi il commento in lib/actions/font.ts: il
  // ritorno alla lista con pagina/filtri intatti lo fa PairingForm via
  // router.back() lato client dopo un salvataggio riuscito.
  revalidatePath("/admin/pairings");
  revalidatePath("/prescriptions");
  revalidateTag(CACHE_TAGS.pairings, "max");
}
