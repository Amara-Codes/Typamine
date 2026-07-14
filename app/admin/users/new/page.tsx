import UserForm from "@/components/admin/users/UserForm";
import prisma from "@/lib/prisma";
import TabHeading from "@/components/admin/common/TabHeading";

export default async function NewUserPage() {
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TabHeading title="New Authorized User" showButton={false} />
      <UserForm roles={roles} />
    </div>
  );
}
