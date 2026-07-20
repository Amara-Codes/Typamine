"use server";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
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

    let existingPairing: { imageUrl: string | null; insight: string | null } | null = null;
    if (id) {
      existingPairing = await prisma.prescription.findUnique({
        where: { id },
        select: { imageUrl: true, insight: true },
      });
    }

    const pairingId = id || crypto.randomUUID();

    const baseData = {
      name,
      slug,
      description,
      insight,
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
    try {
      if (removeImage) {
        await prisma.prescription.update({
          where: { id: pairing.id },
          data: { imageUrl: null },
        });
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

    // Insight Modules Image Processing: i moduli "paragraphWithImage" arrivano
    // con l'immagine come data-URL base64 dentro il JSON `insight` (solo per
    // l'anteprima live) e il file vero in un input nascosto `module_<id>_image`
    // dentro lo stesso <form>. Qui carichiamo il file reale su R2 e sostituiamo
    // l'imageSrc con l'URL definitivo prima di scrivere `insight` a DB.
    try {
      interface InsightModuleRecord {
        id: string;
        type: string;
        props: Record<string, unknown> & { imageSrc?: string };
      }

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

        let insightChanged = false;

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
              const fileName = `${pairing.id}-${timestamp}-${index}.${ext}`;

              const { url } = await uploadToR2(
                buffer,
                "pairings/insights/images",
                fileName,
                file.type || "image/png"
              );
              mod.props.imageSrc = url;
              insightChanged = true;

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
          }
        }

        if (insightChanged) {
          await prisma.prescription.update({
            where: { id: pairing.id },
            data: { insight: JSON.stringify(modules) },
          });
        }
      }
    } catch (insightError) {
      console.error("Failed to process insight modules images:", insightError);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === "NEXT_REDIRECT") throw error;
    console.error("[Pairing Action] Error saving pairing:", error);
    return errorMessage || "Failed to save pairing.";
  }

  revalidatePath("/admin/pairings");
  revalidatePath("/prescriptions");
  redirect("/admin/pairings");
}
