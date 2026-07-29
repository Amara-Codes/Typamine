import { getServerAuthSession } from "@/lib/session";
import { protectPage } from "@/lib/rbac";
import { getAdminTags } from "@/lib/actions/tag";
import prisma from "@/lib/prisma";
import { withSafeDbQuery } from "@/lib/services/dbMigration";
import FontForm from "@/components/admin/fonts/FontForm";

export default async function NewFontPage() {
  const session = await getServerAuthSession();
  await protectPage(session, "font");

  const [tags, authors] = await Promise.all([
    getAdminTags(),
    withSafeDbQuery(() => prisma.fontAuthor.findMany({ orderBy: { name: "asc" } })),
  ]);

  return <FontForm tags={tags} authors={authors} />;
}
