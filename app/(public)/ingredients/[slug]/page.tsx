import { notFound } from "next/navigation";
import { getIngredientBySlug } from "@/lib/services/font";
import { getPairingsCountForFont } from "@/lib/services/pairing";
import IngredientDetailClient from "./IngredientDetailClient";

interface IngredientDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function IngredientDetailPage({ params }: IngredientDetailPageProps) {
  const { slug } = await params;
  const ingredient = await getIngredientBySlug(slug);

  if (!ingredient) {
    notFound();
  }

  const pairingsCount = await getPairingsCountForFont(ingredient.id);

  return <IngredientDetailClient ingredient={ingredient} hasPairings={pairingsCount > 0} />;
}
