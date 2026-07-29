import { notFound } from "next/navigation";
import { cookies } from "next/headers";
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

  // Il cookie di voto è httpOnly (anti-tampering via devtools/document.cookie),
  // quindi lo stato "già votato" va letto qui lato server invece che nel client.
  const cookieStore = await cookies();
  const hasVoted = Boolean(cookieStore.get(`tm_rated_${ingredient.id}`));

  return <IngredientDetailClient ingredient={ingredient} hasPairings={pairingsCount > 0} hasVoted={hasVoted} />;
}
