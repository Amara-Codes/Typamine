"use client";

import { FormulaCard } from "@/components/collection/FormulaCard";
import React from "react";
import RAW_FORMULAS from "@/lib/sample-data/collections.json";
import ALL_INGREDIENTS from "@/lib/sample-data/fonts.json";
import { Formula, Ingredient } from "@/types";
import { PageHeading } from "@/components/common/PageHeading";

const FORMULAS: Formula[] = RAW_FORMULAS.map((raw) => ({
  ...raw,
  fonts: raw.fonts.map((slug) => ALL_INGREDIENTS.find(f => f.slug === slug) as Ingredient).filter(Boolean)
}));
import { useThemeStore } from "@/store/themeStore";
import { Cta } from "@/components/common/Cta";
import Link from "next/link";
import { Button } from "@/components/common/Button";

export default function FormulasPage() {
  const { theme } = useThemeStore();

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      {/* Route Header */}
      <PageHeading
        title="CURATED_FORMULAS // Our Collections"
        subtitle={`TOTAL_FORMULAS_CATALOGUED: ${FORMULAS.length} // ISOLATION_STATUS: SAFE`}
        useGrainient
        grainientOptions={{
          color1: theme === "light" ? "#fdfdfd" : "#09090b",
          color2: theme === "light" ? "#c0d3ed" : "#570d22",
          color3: theme === "light" ? "#e5e7eb" : "#27272a",
        }}
      />

      {/* Formula cards catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-0 mb-8">
        {FORMULAS.map((formula) => (
          <FormulaCard key={formula.id} formula={formula} />
        ))}
      </div>

      <Cta
        title={<>Looking for <span className="text-blue dark:text-red font-star px-2">Inspirations?</span></>}
        subtitle="Check out our Prescriptions for expert typography pairings, or dive into our Vintage Archive to discover great examples from the past."
        align="right"
        bgImage="/images/formulas/cta-bg.png"
        useGlassmorphism

      >
        <Link href="/prescriptions" className="inline-block">
          <Button variant="themeResponsive" glow>VIEW_PRESCRIPTIONS</Button>
        </Link>
        <Link href="/prescriptions/archive" className="inline-block">
          <Button variant="outline" glow>THE_ARCHIVE</Button>
        </Link>
      </Cta>
    </div>
  );
}
