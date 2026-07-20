import { notFound } from "next/navigation";
import { getFormulaBySlug } from "@/lib/services/formula";
import { getVirtualFormulaBySlug } from "@/lib/services/virtualFormula";
import FormulaDetailClient from "./FormulaDetailClient";

export const dynamic = "force-dynamic";

interface FormulaDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function FormulaDetailPage({ params }: FormulaDetailPageProps) {
  const { slug } = await params;

  // Prima le collezioni curate a mano nel DB reale, poi quelle programmatiche
  // (lib/services/virtualFormula.ts) — così uno slug reale ha sempre la
  // precedenza in caso di collisione col namespace delle formule generate.
  const realFormula = await getFormulaBySlug(slug);
  if (realFormula) {
    return <FormulaDetailClient formula={realFormula} isCurated={true} />;
  }

  const virtualFormula = await getVirtualFormulaBySlug(slug);
  if (virtualFormula) {
    return <FormulaDetailClient formula={virtualFormula} isCurated={false} />;
  }

  notFound();
}
