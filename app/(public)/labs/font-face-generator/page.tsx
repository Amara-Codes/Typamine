import { getIngredientBySlug, getIngredientsPage } from "@/lib/services/font";
import FontFaceGeneratorClient from "./FontFaceGeneratorClient";

export const dynamic = "force-dynamic";

interface FontFaceGeneratorPageProps {
  searchParams: Promise<{ ingredient?: string }>;
}

export default async function FontFaceGeneratorPage({ searchParams }: FontFaceGeneratorPageProps) {
  const { ingredient: ingredientSlug } = await searchParams;

  const [initialIngredient, catalogPage] = await Promise.all([
    ingredientSlug ? getIngredientBySlug(ingredientSlug) : Promise.resolve(null),
    getIngredientsPage({ perPage: 200, sort: "name_asc" }),
  ]);

  return (
    <FontFaceGeneratorClient
      initialIngredient={initialIngredient}
      catalog={catalogPage.items}
      ingredientSlug={ingredientSlug}
    />
  );
}
