"use client"

import React from "react";
import { DoubleHero } from "@/components/common/DoubleHero";
import { SearchSortFilter } from "@/components/common/SearchSortFilter";
import { useThemeStore } from "@/store/themeStore";

const SORT_OPTIONS = [
  { label: "NEWEST FIRST", value: "recent" },
  { label: "TITLE (A-Z)", value: "name_asc" },
  { label: "TITLE (Z-A)", value: "name_desc" },
];

interface ArchiveClientProps {
  tags: { id: string; name: string }[];
  children: React.ReactNode;
}

// Shell statico: hero e barra di ricerca/filtri vivono qui e non dipendono
// dal fetch, quindi non smontano/rimontano mai (niente "flash") quando cambi
// pagina — solo `children` (i risultati) è dentro un Suspense boundary,
// stesso pattern di PrescriptionsClient.
export default function ArchiveClient({ tags, children }: ArchiveClientProps) {
  const { theme } = useThemeStore();
  const dynamicArchiveBgImageUrl = theme === "dark" ? "/images/archive/double-hero/hero-bg-dark.png" : "/images/archive/double-hero/hero-bg-light.png";

  return (
    <DoubleHero
      title={
        <span className="text-blue-800 dark:text-red-400 font-positivesys">The Typography&apos;s Wayback Machine</span>
      }
      layout="contentCenter"
      description="Browse a vast catalog of fonts, find expert pairings, generate custom assets on the fly, and read our latest typographic prescriptions. Built for modern creators and developers."
      bgImage={dynamicArchiveBgImageUrl}
      vLayout="contentBottom"
      fullWidth
    >
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <SearchSortFilter
          searchPlaceholder="Search the archive by title, caption or description..."
          sortOptions={SORT_OPTIONS}
          tags={tags}
          filtersModalTitle="Filter by Tags"
        />

        {children}
      </div>
    </DoubleHero>
  );
}
