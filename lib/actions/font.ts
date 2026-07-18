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

export async function getFonts() {
  await checkPermission("font:read");
  return prisma.ingredient.findMany({
    include: {
      variants: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getFontById(id: string) {
  await checkPermission("font:read");
  return prisma.ingredient.findUnique({
    where: { id },
    include: {
      variants: true,
    },
  });
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
    const creator = formData.get("creator") as string | null;
    const rating = formData.get("rating") as string;
    const symbol = formData.get("symbol") as string | null;
    const formula = formData.get("formula") as string | null;
    const isVariable = formData.get("isVariable") === "true";

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
      isVariable,
    };

    // 1. Save Ingredient (Font info) first to DB
    let font;
    try {
      if (id) {
        font = await prisma.ingredient.update({
          where: { id },
          data,
        });
      } else {
        font = await prisma.ingredient.create({
          data: {
            id: fontId,
            ...data,
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
    if (errorMessage === "NEXT_REDIRECT") throw error;
    console.error("[Font Action] Error saving font:", error);
    return errorMessage || "Failed to save font.";
  }

  revalidatePath("/admin/fonts");
  redirect("/admin/fonts");
}
