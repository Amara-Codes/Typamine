"use server";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";
import { revalidatePath, revalidateTag } from "next/cache";
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

export async function getAdminTags() {
  await checkPermission("font:read");
  return withSafeDbQuery(() =>
    prisma.tag.findMany({
      orderBy: { name: "asc" },
    })
  );
}

export interface TagsPageResult {
  items: { id: string; name: string }[];
  nextCursor: string | null;
}

// Stessa paginazione cursor-based di getFontsPage (lib/actions/font.ts), per
// TagPicker in modalità self-fetching — i tag oggi sono pochi, ma tenere lo
// stesso pattern evita di dover rifare questo lavoro quando cresceranno.
export async function getTagsPage({
  search = "",
  cursor = null,
  limit = 30,
}: {
  search?: string;
  cursor?: string | null;
  limit?: number;
}): Promise<TagsPageResult> {
  await checkPermission("font:read");

  const trimmed = search.trim();
  const where = trimmed ? { name: { contains: trimmed } } : undefined;

  const rows = await withSafeDbQuery(() =>
    prisma.tag.findMany({
      where,
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
  );

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

// Risolve tag specifici per id (es. quelli già selezionati, per mostrarne il
// nome come chip anche se non sono nella pagina caricata).
export async function getTagsByIds(ids: string[]): Promise<{ id: string; name: string }[]> {
  await checkPermission("font:read");
  if (ids.length === 0) return [];

  return withSafeDbQuery(() =>
    prisma.tag.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })
  );
}

export async function saveTag(prevState: any, formData: FormData, id?: string) {
  const session = await getServerAuthSession();
  if (!session?.user) return "Unauthorized";

  try {
    if (id) {
      await checkPermission("font:update");
    } else {
      await checkPermission("font:create");
    }

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;

    if (!name) {
      return "Tag name is required.";
    }

    // Check unique name constraint
    const existing = await prisma.tag.findFirst({
      where: {
        name,
        NOT: id ? { id } : undefined,
      },
    });

    if (existing) {
      return "A tag with this name already exists.";
    }

    if (id) {
      await prisma.tag.update({
        where: { id },
        data: { name, description },
      });
    } else {
      await prisma.tag.create({
        data: {
          id: crypto.randomUUID(),
          name,
          description,
        },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === "NEXT_REDIRECT") throw error;
    console.error("[Tag Action] Error saving tag:", error);
    return errorMessage || "Failed to save tag.";
  }

  revalidatePath("/admin/tags");
  revalidatePath("/admin/pairings");
  revalidateTag(CACHE_TAGS.tags, "max");
  return null;
}

export async function deleteTag(id: string) {
  await checkPermission("font:delete");
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
  revalidatePath("/admin/pairings");
  revalidateTag(CACHE_TAGS.tags, "max");
}
