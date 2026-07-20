import { notFound } from "next/navigation";
import PairingForm from "@/components/admin/pairings/PairingForm";
import { getAdminPairingById } from "@/lib/actions/pairing";
import { getFonts } from "@/lib/actions/font";
import { getAdminTags } from "@/lib/actions/tag";
import TabHeading from "@/components/admin/common/TabHeading";

export const dynamic = "force-dynamic";

interface EditPairingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPairingPage({ params }: EditPairingPageProps) {
  const { id } = await params;
  
  const [pairing, fonts, tags] = await Promise.all([
    getAdminPairingById(id),
    getFonts(),
    getAdminTags(),
  ]);

  if (!pairing) {
    notFound();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <TabHeading
        title="Edit Pairing"
        showButton={false}
      />
      <PairingForm initialData={pairing} fonts={fonts} tags={tags} />
    </div>
  );
}
