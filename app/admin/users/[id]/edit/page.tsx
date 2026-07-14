import UserForm from "@/components/admin/users/UserForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import TabHeading from "@/components/admin/common/TabHeading";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { roles: true }
    }),
    prisma.role.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  if (!user) notFound();
  
  // Pre-serialize image if it's binary
  const serializedUser = {
    ...user,
    image: (user as any).image ? `data:image/jpeg;base64,${Buffer.from((user as any).image).toString('base64')}` : null
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TabHeading title="Edit User Account" showButton={false} />
      <UserForm user={serializedUser} roles={roles} />
    </div>
  );
}
