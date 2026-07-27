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

interface PillsClientProps {
  tags: { id: string; name: string }[];
  children: React.ReactNode;
}

// Shell statico: hero e barra di ricerca/filtri vivono qui e non dipendono
// dal fetch, quindi non smontano/rimontano mai (niente "flash") quando cambi
// pagina — solo `children` (i risultati) è dentro un Suspense boundary,
// stesso pattern di ArchiveClient. La lista usa ancora DoubleHero (a
// differenza della pagina di dettaglio, dove i post costruiscono già la
// propria hero coi moduli simpleHero/gridHero).
export default function PillsClient({ tags, children }: PillsClientProps) {
    const { theme } = useThemeStore();
    const dynamicArchiveBgImageUrl = theme === "dark" ? "/images/pills/double-hero/hero-bg-dark.png" : "/images/pills/double-hero/hero-bg-light.png";
  return (
    <DoubleHero
      title={
        <span className="text-blue-800 dark:text-red-400 font-positivesys">Typamine Pills</span>
      }
      layout="contentCenter"
      description="Bite-sized essays, deep dives and behind-the-scenes notes on typography, type design, and everything we build here at Typamine."
      vLayout="contentBottom"
      bgImage={dynamicArchiveBgImageUrl}
      fullWidth
    >
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <SearchSortFilter
          searchPlaceholder="Search pills by title, caption or description..."
          sortOptions={SORT_OPTIONS}
          tags={tags}
          filtersModalTitle="Filter by Tags"
        />

        {children}
      </div>
    </DoubleHero>
  );
}
