import { getIngredientBySlug, getIngredientsPage } from "@/lib/services/font";
import TailwindGeneratorClient from "./TailwindGeneratorClient";

export const dynamic = "force-dynamic";

interface TailwindGeneratorPageProps {
  searchParams: Promise<{ ingredient?: string }>;
}

export default async function TailwindGeneratorPage({ searchParams }: TailwindGeneratorPageProps) {
  const { ingredient: ingredientSlug } = await searchParams;

  const [initialIngredient, catalogPage] = await Promise.all([
    ingredientSlug ? getIngredientBySlug(ingredientSlug) : Promise.resolve(null),
    getIngredientsPage({ perPage: 200, sort: "name_asc" }),
  ]);

  return (
    <TailwindGeneratorClient
      initialIngredient={initialIngredient}
      catalog={catalogPage.items}
      ingredientSlug={ingredientSlug}
    />
  );
}
