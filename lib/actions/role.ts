"use server";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export async function getRoles() {
  await checkPermission("role:read");
  return prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: { users: true }
      }
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getPermissions() {
  await checkPermission("role:read");
  return prisma.permission.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function deleteRole(id: string) {
  await checkPermission("role:delete");
  
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } }
  });

  if (role?._count.users && role._count.users > 0) {
    throw new Error("Cannot delete a role that has assigned users.");
  }

  if (role?.name === 'SUPERADMIN') {
    throw new Error("Cannot delete the SUPERADMIN role.");
  }

  await prisma.role.delete({ where: { id } });
  revalidatePath("/admin/roles");
}

export async function saveRole(prevState: unknown, formData: FormData, id?: string) {
  const session = await getServerAuthSession();
  if (!session?.user) return "Unauthorized";
  
  try {
    if (id) {
      await checkPermission("role:update");
    } else {
      await checkPermission("role:create");
    }

    const name = (formData.get("name") as string).trim().replace(/\s+/g, "_");
    const permissionIds = formData.getAll("permissions") as string[];

    if (id) {
      await prisma.role.update({
        where: { id },
        data: {
          name,
          permissions: {
            set: permissionIds.map(pid => ({ id: pid }))
          }
        },
      });
    } else {
      const existing = await prisma.role.findUnique({ where: { name } });
      if (existing) return "Role with this name already exists.";

      await prisma.role.create({
        data: {
          name,
          permissions: {
            connect: permissionIds.map(pid => ({ id: pid }))
          }
        },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === "NEXT_REDIRECT") throw error;
    console.error("[Role Action] Error saving role:", error);
    return errorMessage || "Failed to save role.";
  }

  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}
