import { getServerAuthSession } from "@/lib/session";
import { protectPage } from "@/lib/rbac";
import { getAdminTags } from "@/lib/actions/tag";
import FontForm from "@/components/admin/fonts/FontForm";

export default async function NewFontPage() {
  const session = await getServerAuthSession();
  await protectPage(session, "font");

  const tags = await getAdminTags();

  return <FontForm tags={tags} />;
}
