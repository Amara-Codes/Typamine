"use server";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
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
  return null;
}

export async function deleteTag(id: string) {
  await checkPermission("font:delete");
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
  revalidatePath("/admin/pairings");
}
