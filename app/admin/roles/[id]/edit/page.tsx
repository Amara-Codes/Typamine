import RoleForm from "@/components/admin/roles/RoleForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import TabHeading from "@/components/admin/common/TabHeading";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, permissions] = await Promise.all([
    prisma.role.findUnique({
      where: { id },
      include: { permissions: true }
    }),
    prisma.permission.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  if (!role) notFound();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TabHeading title="Configure Role" showButton={false} />
      <RoleForm role={role} allPermissions={permissions} />
    </div>
  );
}
