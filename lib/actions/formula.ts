"use server";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";
import { revalidatePath, revalidateTag } from "next/cache";
import { withSafeDbQuery } from "@/lib/services/dbMigration";
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

export async function getFormulas() {
  await checkPermission("font:read");
  return withSafeDbQuery(() =>
    prisma.formula.findMany({
      include: {
        fonts: true,
        tags: true,
      },
      orderBy: { name: "asc" },
    })
  );
}

export async function getFormulaById(id: string) {
  await checkPermission("font:read");
  return withSafeDbQuery(() =>
    prisma.formula.findUnique({
      where: { id },
      include: {
        fonts: true,
        tags: true,
      },
    })
  );
}

export async function deleteFormula(id: string) {
  await checkPermission("font:delete");
  await prisma.formula.delete({ where: { id } });
  revalidatePath("/admin/collections");
  revalidatePath("/formulas");
  revalidateTag(CACHE_TAGS.formulas, "max");
}

export async function saveFormula(prevState: any, formData: FormData, id?: string) {
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
    // Sulla tabella Formula di D1 la colonna description è ancora NOT NULL,
    // ereditata da prima del rename dell'entità (a differenza di href/code
    // non possiamo droppare la colonna: è un campo tuttora in uso). Stringa
    // vuota invece di null soddisfa il vincolo legacy senza toccare lo schema.
    const description = (formData.get("description") as string)?.trim() || "";
    const fontCategory = (formData.get("fontCategory") as string)?.trim();
    const fontIds = formData.getAll("fontIds") as string[];
    const tagIds = formData.getAll("tagIds") as string[];

    if (!name || !slug || !fontCategory) {
      return "Name, Slug, and Font Category are required.";
    }

    if (fontIds.length === 0) {
      return "Select at least one font for this collection.";
    }

    // Check unique slug
    const existingSlug = await prisma.formula.findFirst({
      where: {
        slug,
        NOT: id ? { id } : undefined,
      },
    });

    if (existingSlug) {
      return "A collection with this slug already exists.";
    }

    const formulaId = id || crypto.randomUUID();

    const baseData = {
      name,
      slug,
      description,
      fontCategory,
    };

    if (id) {
      await withSafeDbQuery(() =>
        prisma.formula.update({
          where: { id },
          data: {
            ...baseData,
            fonts: {
              set: fontIds.map((fId) => ({ id: fId })),
            },
            tags: {
              set: tagIds.map((tId) => ({ id: tId })),
            },
          },
        })
      );
    } else {
      await withSafeDbQuery(() =>
        prisma.formula.create({
          data: {
            id: formulaId,
            ...baseData,
            // Impostato esplicitamente invece di affidarsi al DEFAULT a livello di
            // DB: un client Prisma già avviato prima di una modifica allo schema
            // può ignorare il default e scrivere NULL su questa colonna.
            createdAt: new Date(),
            fonts: {
              connect: fontIds.map((fId) => ({ id: fId })),
            },
            tags: {
              connect: tagIds.map((tId) => ({ id: tId })),
            },
          },
        })
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Formula Action] Error saving collection:", error);
    return errorMessage || "Failed to save collection.";
  }

  // Niente redirect() qui — vedi il commento in lib/actions/font.ts: il
  // ritorno alla lista con pagina/filtri intatti lo fa CollectionForm via
  // router.back() lato client dopo un salvataggio riuscito.
  revalidatePath("/admin/collections");
  revalidatePath("/formulas");
  revalidateTag(CACHE_TAGS.formulas, "max");
}
