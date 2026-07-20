import { Suspense } from "react";
import PrescriptionsClient from "./PrescriptionsClient";
import PrescriptionsResults from "./PrescriptionsResults";
import { PrescriptionCardSkeleton } from "@/components/pairing/skeletons/PrescriptionCardSkeleton";
import { getTags } from "@/lib/services/tag";
import { PairingSort } from "@/lib/services/pairing";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

interface PrescriptionsPageProps {
  searchParams: Promise<{
    page?: string;
    tags?: string;
    search?: string;
    sort?: string;
    font?: string;
  }>;
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-0">
      {Array.from({ length: PER_PAGE }).map((_, idx) => (
        <PrescriptionCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export default async function PrescriptionsPage({ searchParams }: PrescriptionsPageProps) {
  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const tagIds = (resolved.tags || "").split(",").filter(Boolean);
  const search = resolved.search || "";
  const sort = (resolved.sort || "recent") as PairingSort;
  const fontName = resolved.font || "";

  const tags = await getTags();

  return (
    <PrescriptionsClient tags={tags}>
      <Suspense key={`${page}-${tagIds.join(",")}-${search}-${sort}-${fontName}`} fallback={<ResultsSkeleton />}>
        <PrescriptionsResults page={page} perPage={PER_PAGE} tagIds={tagIds} search={search} sort={sort} fontName={fontName} />
      </Suspense>
    </PrescriptionsClient>
  );
}
