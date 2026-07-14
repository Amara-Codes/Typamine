"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IngredientCard } from "@/components/font/IngredientCard";
import { Select } from "@/components/common/Select";
import ALL_INGREDIENTS from "@/lib/sample-data/fonts.json";
import { Ingredient } from "@/types";
import { PageHeading } from "@/components/common/PageHeading";
import { useThemeStore } from "@/store/themeStore";
import { Cta } from "@/components/common/Cta";
import { Button } from "@/components/common/Button";
const FILTER_OPTIONS = [
  { label: "ALL_COMPOUNDS", value: "ALL" },
  { label: "MONOSPACE", value: "Monospace" },
  { label: "SANS-SERIF", value: "Sans-Serif" },
  { label: "NEO-GROTESQUE", value: "Neo-Grotesque" },
  { label: "GEOMETRIC SANS", value: "Geometric Sans" },
  { label: "SERIF", value: "Serif" },
  { label: "DECORATIVE", value: "Decorative" },
];

export default function IngredientsPage() {
  const { theme } = useThemeStore();
  const [filter, setFilter] = useState("ALL");

  const filteredIngredients = filter === "ALL" 
    ? ALL_INGREDIENTS 
    : ALL_INGREDIENTS.filter(item => item.category === filter);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      {/* Route Header */}
      <PageHeading 
        title="INGREDIENTS_ARCHIVE // All Our Fonts"
        subtitle={`TOTAL_INGREDIENTS_CATALOGUED: ${ALL_INGREDIENTS.length} // ISOLATION_STATUS: SAFE`}
        useGrainient
        grainientOptions={{
          color1: theme === "light" ? "#fdfdfd" : "#09090b",
          color2: theme === "light" ? "#c0d3ed" : "#570d22",
          color3: theme === "light" ? "#e5e7eb" : "#27272a",
        }}
        rightElement={
          <div className="flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1 font-haas text-xs text-zinc-600 dark:text-zinc-400 w-full md:w-auto z-10">
            <span className="shrink-0">FILTER:</span>
            <Select 
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
              className="w-40"
            />
          </div>
        }
      />

      {/* Grid of elements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-0">
        {(filteredIngredients as unknown as Ingredient[]).map((item, idx) => (
          <IngredientCard key={item.id} font={item} idx={idx} />
        ))}
      </div>
      
      {filteredIngredients.length === 0 && (
        <div className="text-center py-12 border border-zinc-800 border-dashed rounded-lg text-zinc-500 font-haas">
          NO_COMPOUNDS_FOUND_FOR_THIS_CLASSIFICATION
        </div>
      )}

      <Cta 
        title={<>Need help finding <br/> <span className="text-blue dark:text-red font-star px-2">what you're looking for?</span></>}
        subtitle="Explore our Curated Collections to find the perfect typographic bundles ready to be used in your next project."
        align="left"
        useGrainient
        useGlassmorphism
        grainientOptions={{
          color1: theme === "light" ? "#c1dada" : "#7c1111",
          color2: theme === "light" ? "#62737c" : "#380b36",
          color3: theme === "light" ? "#f1dce9" : "#693257",
          timeSpeed: 0.2,
          grainScale: 10,
        }}
      >
        <Link href="/formulas" className="inline-block">
          <Button variant="themeResponsive" glow>EXPLORE_COLLECTIONS</Button>
        </Link>
      </Cta>
    </div>
  );
}
