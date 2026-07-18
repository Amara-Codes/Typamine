"use client";

import RAW_PAIRINGS from "@/lib/sample-data/pairings.json";
import ALL_INGREDIENTS from "@/lib/sample-data/fonts.json";
import { Prescription, Ingredient } from "@/types";
import Link from "next/link";

const PAIRINGS: Prescription[] = RAW_PAIRINGS.map((raw) => ({
  ...raw,
  fonts: raw.fonts.map((slug) => ALL_INGREDIENTS.find(f => f.slug === slug) as Ingredient).filter(Boolean)
}));
import { Button } from "@/components/common/Button";
import { PrescriptionCard } from "@/components/pairing/PrescriptionCard";
import { PageHeading } from "@/components/common/PageHeading";
import { Cta } from "@/components/common/Cta";
import { useThemeStore } from "@/store/themeStore";

export default function PrescriptionsPage() {
  const { theme } = useThemeStore();

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      {/* Route Header */}
      <PageHeading
        title="PRESCRIPTIONS // Font Pairing Examples"
        subtitle="Visual recommendations for combining heading compounds and body reading solutions."
        useGrainient
        grainientOptions={{
          color1: theme === "light" ? "#fdfdfd" : "#09090b",
          color2: theme === "light" ? "#c0d3ed" : "#570d22",
          color3: theme === "light" ? "#e5e7eb" : "#27272a",
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-0">
        {PAIRINGS.map((pair) => (
          <PrescriptionCard key={pair.id} prescription={pair} />
        ))}
      </div>
            <Cta 
        title={<>The <span className="text-blue dark:text-red font-star px-2">Vintage</span> Archive</>}
        subtitle="Explore our curated collection of vintage posters, spanning from Soviet propaganda and 1950s sci-fi to Bauhaus, Futurism, and Art Deco."
        align="center"
        bgImage="/images/prescriptions/cta-bg.png"
        useGlassmorphism

      >
        <Link href="/prescriptions/archive" className="inline-block">
          <Button variant="primary">Explore the Archive</Button>
        </Link>
      </Cta>
      <p className="font-star text-4xl"> infondo una cta - autotherapy - crea da soloo la tua bl bla dove posto ad una pagina dove uno fga gli import e prova< br /> < br />cta esempi famosi (pagina ancora da creare con poster cinema etc)</p>
    </div>
  );
}
