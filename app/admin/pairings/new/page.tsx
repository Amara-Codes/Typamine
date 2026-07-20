import PairingForm from "@/components/admin/pairings/PairingForm";
import { getFonts } from "@/lib/actions/font";
import { getAdminTags } from "@/lib/actions/tag";
import TabHeading from "@/components/admin/common/TabHeading";

export const dynamic = "force-dynamic";

export default async function NewPairingPage() {
  const [fonts, tags] = await Promise.all([
    getFonts(),
    getAdminTags(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <TabHeading
        title="New Pairing"
        showButton={false}
      />
      <PairingForm fonts={fonts} tags={tags} />
    </div>
  );
}
