import { getServerAuthSession } from "@/lib/session";
import { protectPage } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getAdminTags } from "@/lib/actions/tag";
import { withSafeDbQuery } from "@/lib/services/dbMigration";
import FontForm from "@/components/admin/fonts/FontForm";

export default async function EditFontPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerAuthSession();
  await protectPage(session, "font");

  const [font, tags, authors] = await Promise.all([
    prisma.ingredient.findUnique({
      where: { id },
      include: {
        variants: true,
        tags: true,
      },
    }),
    getAdminTags(),
    withSafeDbQuery(() => prisma.fontAuthor.findMany({ orderBy: { name: "asc" } })),
  ]);

  if (!font) {
    notFound();
  }

  return <FontForm font={font} tags={tags} authors={authors} />;
}
