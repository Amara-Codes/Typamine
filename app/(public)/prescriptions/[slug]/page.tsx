import { notFound } from "next/navigation";
import { getPairingBySlug } from "@/lib/services/pairing";
import PrescriptionDetailClient from "./PrescriptionDetailClient";

interface PrescriptionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PrescriptionDetailPage({ params }: PrescriptionDetailPageProps) {
  const { slug } = await params;
  const prescription = await getPairingBySlug(slug);

  if (!prescription) {
    notFound();
  }

  return <PrescriptionDetailClient prescription={prescription} />;
}
