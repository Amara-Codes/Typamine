import { getServerAuthSession } from "@/lib/session";
import { protectPage } from "@/lib/rbac";
import FontForm from "@/components/admin/fonts/FontForm";

export default async function NewFontPage() {
  const session = await getServerAuthSession();
  await protectPage(session, "font");

  return <FontForm />;
}
