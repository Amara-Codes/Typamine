import { getServerAuthSession } from "@/lib/session";
import { protectPage } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { getFormulaById } from "@/lib/actions/formula";
import { getFonts } from "@/lib/actions/font";
import { getAdminTags } from "@/lib/actions/tag";
import TabHeading from "@/components/admin/common/TabHeading";
import CollectionForm from "@/components/admin/collections/CollectionForm";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerAuthSession();
  await protectPage(session, "font");

  const [formula, fonts, tags] = await Promise.all([
    getFormulaById(id),
    getFonts(),
    getAdminTags(),
  ]);

  if (!formula) {
    notFound();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <TabHeading
        title="Edit Collection"
        showButton={false}
      />
      <CollectionForm formula={formula} fonts={fonts} tags={tags} />
    </div>
  );
}
