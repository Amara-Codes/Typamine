"use client";

import { DoubleHero } from "@/components/common/DoubleHero";
import MinimalLink from "@/components/common/MinimalLink";
import { IngredientCard } from "@/components/font/IngredientCard";
import { IngredientCardSkeleton } from "@/components/font/skeletons/IngredientCardSkeleton";
import { PrescriptionCard } from "@/components/pairing/PrescriptionCard";
import { PrescriptionCardSkeleton } from "@/components/pairing/skeletons/PrescriptionCardSkeleton";
import { FormulaCard } from "@/components/collection/FormulaCard";
import { Cta } from "@/components/common/Cta";
import { Button } from "@/components/common/Button";
import Link from "next/link";
import { useThemeStore } from "@/store/themeStore";
import { Formula, Ingredient, Prescription } from "@/types";

interface HomeClientProps {
  recentIngredients?: Ingredient[];
  recentPairings?: Prescription[];
  featuredFormulas?: { formula: Formula; isCurated: boolean }[];
}

export default function HomeClient({ recentIngredients = [], recentPairings = [], featuredFormulas = [] }: HomeClientProps) {
  const { theme } = useThemeStore();
  const dynamicHeroBgImageUrl = theme === "dark" ? "/images/home/double-hero/hero-bg-dark.png" : "/images/home/double-hero/hero-bg-light.png";

  const safeIngredients = recentIngredients || [];
  const safePairings = recentPairings || [];

  return (
    <div className="flex flex-col">
      {/* 1. DOUBLE HERO SECTION */}
      <DoubleHero
        title={
          <>
            Your new <br />
            <span className="text-red">&quot;Looking for a Font&quot;</span>
            <br /> Therapy
          </>
        }
        layout="contentRight"
        description="Browse a vast catalog of fonts, find expert pairings, generate custom assets on the fly, and read our latest typographic prescriptions. Built for modern creators and developers."
        ctaText="Fonts Catalog"
        ctaHref="/ingredients"
        secondaryCtaText="Our Suggestions"
        secondaryCtaHref="/prescriptions"
        bgImage={dynamicHeroBgImageUrl}
        fullWidth
      >
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* 3. FEATURED INGREDIENTS (FONT TILES) — unica sezione rimasta dentro
              DoubleHero: Prescriptions e tutto il resto sono stati spostati fuori. */}
          <section className="space-y-4 pb-32">
            <div className="flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-red font-haas text-sm">[+]</span>
                <h2 className="font-haas text-sm font-bold tracking-wider">LAST IMPORTED INGREDIENTS // Fonts</h2>
              </div>
              <MinimalLink href="/ingredients" label="ALL FONTS" />
            </div>

            {/* Font tiles catalog grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {safeIngredients.length === 0
                ? Array.from({ length: 8 }).map((_, idx) => (
                  <IngredientCardSkeleton key={idx} />
                ))
                : safeIngredients.map((font, idx) => (
                  <IngredientCard key={font.id} font={font} idx={idx} />
                ))}
            </div>
          </section>
        </div>
      </DoubleHero>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* 4. OUR PRESCRIPTIONS (PAIRINGS) — ora fuori da DoubleHero, primo
            elemento di questo contenitore: mt-48 piatto basta perché il
            confine DoubleHero->div successivo (py-8 doppio + margini interni)
            aggiunge da solo l'extra necessario per arrivare allo stesso gap
            totale (304px = 19rem) delle altre transizioni — stesso meccanismo
            di cui prima beneficiava Formulas, quando era lei subito dopo DoubleHero. */}
        <section className="space-y-4 mt-48 lg:mt-0">
          <div className="flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-500 dark:text-zinc-400 font-haas text-sm">[x]</span>
              <h2 className="font-haas text-sm font-bold tracking-wider">POPULAR PRESCRIPTIONS // Font Pairing Examples</h2>
            </div>
            <MinimalLink href="/prescriptions" label="OUR PAIRING SELECTION" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safePairings.length === 0
              ? Array.from({ length: 4 }).map((_, idx) => (
                <PrescriptionCardSkeleton key={idx} />
              ))
              : safePairings.map((prescription) => (
                <PrescriptionCard key={prescription.id} prescription={prescription} />
              ))}
          </div>
        </section>

        {/* 5. ACTIVE FORMULAS (COLLECTIONS) — stesso contenitore di Prescriptions
            sopra, nessun confine da attraversare: serve il margin-top esplicito
            più grande (stesso ruolo che prima aveva la sezione Prescriptions). */}
        <section className="space-y-4 mt-[19rem] lg:mt-0">
          <div className="flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue font-haas text-sm">[o]</span>
              <h2 className="font-haas text-sm font-bold tracking-wider">FEATURED FORMULAS // Collections</h2>
            </div>
            <MinimalLink href="/formulas" label="BROWSE COLLECTIONS" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredFormulas.map(({ formula, isCurated }) => (
              <FormulaCard key={formula.id} formula={formula} isCurated={isCurated} />
            ))}
          </div>
        </section>

        {/* 6. CTA SECTION — stesso mt-[19rem] della sezione Prescriptions sopra
            (stesso contenitore, nessun confine da attraversare): vedi nota lì. */}
        <div className="mt-[19rem] lg:mt-0">
          <Cta
            title={<>Daily <span className="text-blue dark:text-red font-star px-2">Typographic</span> Pills</>}
            subtitle="Subscribe to our blog for weekly doses of typographic inspiration, technical tutorials, and experimental font pairings directly to your console."
            align="center"
            useGrainient
            useGlassmorphism
            grainientOptions={{
              color1: theme === "light" ? "#c1dada" : "#321c1c",
              color2: theme === "light" ? "#024A70" : "#7c1111",
              color3: theme === "light" ? "#FCCEE9" : "#fca2a2",
            }}
          >
            <Link href="/pills" className="inline-block">
              <Button variant="secondary">READ_THE_BLOG</Button>
            </Link>
          </Cta>
        </div>
      </div>
    </div>
  );
}
