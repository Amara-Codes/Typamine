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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-0">
      {Array.from({ length: PER_PAGE }).map((_, idx) => (
        <IngredientCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export default async function IngredientsPage({ searchParams }: IngredientsPageProps) {
  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const category = resolved.category || "ALL";
  const rating = resolved.rating || "ALL";
  const tagIds = (resolved.tags || "").split(",").filter(Boolean);
  const search = resolved.search || "";
  const sort = (resolved.sort || "recent") as IngredientSort;

  const tags = await getTags();

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
