import { getIngredientBySlug } from "@/lib/services/font";
import FontConverterClient from "./FontConverterClient";

export const dynamic = "force-dynamic";

interface FontConverterPageProps {
  searchParams: Promise<{ ingredient?: string }>;
}

export default async function FontConverterPage({ searchParams }: FontConverterPageProps) {
  const { ingredient: ingredientSlug } = await searchParams;
  const initialIngredient = ingredientSlug ? await getIngredientBySlug(ingredientSlug) : null;

  return <FontConverterClient ingredientSlug={ingredientSlug} initialIngredient={initialIngredient} />;
}
