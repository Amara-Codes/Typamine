"use client";

import Link from "next/link";
import { FormulaCard } from "@/components/collection/FormulaCard";
import { PageHeading } from "@/components/common/PageHeading";
import { useThemeStore } from "@/store/themeStore";
import { Cta } from "@/components/common/Cta";
import { Button } from "@/components/common/Button";
import { Formula } from "@/types";

interface FormulasClientProps {
  items: { formula: Formula; isCurated: boolean }[];
}

export default function FormulasClient({ items }: FormulasClientProps) {
  const { theme } = useThemeStore();

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      {/* Route Header */}
      <PageHeading
        title="CURATED_FORMULAS // Our Collections"
        subtitle={`TOTAL_FORMULAS_CATALOGUED: ${items.length} // ISOLATION_STATUS: SAFE`}
        useGrainient
        grainientOptions={{
          color1: theme === "light" ? "#fdfdfd" : "#09090b",
          color2: theme === "light" ? "#c0d3ed" : "#570d22",
          color3: theme === "light" ? "#e5e7eb" : "#27272a",
        }}
      />

      {/* Formula cards catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-0 mb-8">
        {items.map(({ formula, isCurated }) => (
          <FormulaCard key={formula.id} formula={formula} isCurated={isCurated} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-lg text-zinc-500 dark:text-zinc-400 font-haas">
          NO_FORMULAS_AVAILABLE_YET
        </div>
      )}

      <Cta
        title={<>Looking for <span className="text-blue dark:text-red font-star px-2">Inspirations?</span></>}
        subtitle="Check out our Prescriptions for expert typography pairings, or dive into our Vintage Archive to discover great examples from the past."
        align="right"
        bgImage="/images/formulas/cta-bg.png"
        useGlassmorphism
      >
        <Link href="/prescriptions" className="inline-block">
          <Button variant="secondary">VIEW_PRESCRIPTIONS</Button>
        </Link>
        <Link href="/prescriptions/archive" className="inline-block">
          <Button variant="primary">THE_ARCHIVE</Button>
        </Link>
      </Cta>
    </div>
  );
}
