import { Suspense } from "react";
import IngredientsClient from "./IngredientsClient";
import IngredientsResults from "./IngredientsResults";
import { IngredientCardSkeleton } from "@/components/font/skeletons/IngredientCardSkeleton";
import { getTags } from "@/lib/services/tag";
import { IngredientSort } from "@/lib/services/font";

const PER_PAGE = 12;

interface IngredientsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    rating?: string;
    tags?: string;
    search?: string;
    sort?: string;
  }>;
}

function ResultsSkeleton() {
  return (
    <>
      <div className="h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-0">
        {Array.from({ length: PER_PAGE }).map((_, idx) => (
          <IngredientCardSkeleton key={idx} />
        ))}
      </div>
    </>
  );
}

export default async function IngredientsPage({ searchParams }: IngredientsPageProps) {
  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const category = resolved.category || "ALL";
  const rating = resolved.rating || "ALL";
  const tagNames = (resolved.tags || "").split(",").filter(Boolean);
  const search = resolved.search || "";
  const sort = (resolved.sort || "recent") as IngredientSort;

  const tags = await getTags();
  // L'URL usa il nome del tag (human-readable) — conversione a id qui,
  // senza query aggiuntiva dato che `tags` è già caricato sopra.
  const tagIds = tags.filter((t) => tagNames.includes(t.name)).map((t) => t.id);

  return (
    <IngredientsClient tags={tags}>
      <Suspense key={`${page}-${category}-${rating}-${tagIds.join(",")}-${search}-${sort}`} fallback={<ResultsSkeleton />}>
        <IngredientsResults
          page={page}
          category={category}
          rating={rating}
          tagIds={tagIds}
          search={search}
          sort={sort}
          perPage={PER_PAGE}
        />
      </Suspense>
    </IngredientsClient>
  );
}
