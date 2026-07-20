import { getServerAuthSession } from "@/lib/session";
import { protectPage } from "@/lib/rbac";
import { getFonts } from "@/lib/actions/font";
import { getAdminTags } from "@/lib/actions/tag";
import TabHeading from "@/components/admin/common/TabHeading";
import CollectionForm from "@/components/admin/collections/CollectionForm";

export const dynamic = "force-dynamic";

export default async function NewCollectionPage() {
  const session = await getServerAuthSession();
  await protectPage(session, "font");

  const [fonts, tags] = await Promise.all([
    getFonts(),
    getAdminTags(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <TabHeading
        title="New Collection"
        showButton={false}
      />
      <CollectionForm fonts={fonts} tags={tags} />
    </div>
  );
}
