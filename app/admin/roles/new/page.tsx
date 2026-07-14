import RoleForm from "@/components/admin/roles/RoleForm";
import prisma from "@/lib/prisma";
import TabHeading from "@/components/admin/common/TabHeading";

export default async function NewRolePage() {
  const permissions = await prisma.permission.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TabHeading title="Define New Role" showButton={false} />
      <RoleForm allPermissions={permissions} />
    </div>
  );
}
