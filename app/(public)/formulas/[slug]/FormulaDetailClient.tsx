"use client";

import Link from "next/link";
import { MoveLeft, Sparkles } from "lucide-react";
import MinimalLink from "@/components/common/MinimalLink";
import { PageHeading } from "@/components/common/PageHeading";
import { useThemeStore } from "@/store/themeStore";
import { IngredientCard } from "@/components/font/IngredientCard";
import { Badge } from "@/components/common/Badge";
import { Cta } from "@/components/common/Cta";
import { Button } from "@/components/common/Button";
import { Formula } from "@/types";

interface FormulaDetailClientProps {
  formula: Formula;
  isCurated: boolean;
}

export default function FormulaDetailClient({ formula, isCurated }: FormulaDetailClientProps) {
  const { theme } = useThemeStore();

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      <div className="mb-4">
        <MinimalLink
          href="/formulas"
          label="Back to Collections"
          icon={<MoveLeft size={12} />}
          iconPosition="left"
          className="font-bold tracking-widest text-bluegray-800 dark:text-redgray-200 hover:text-black dark:hover:text-white"
        />

      </div>

      {/* Description */}
      {formula.description && (
        <section className="space-y-2">
          <h1 className="font-haas uppercase text-4xl font-bold text-center text-black dark:text-white">{formula.name}</h1>
          <p className="max-w-3xl mx-auto text-center text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {formula.description}
          </p>
        </section>
      )}

      {/* The fonts in this collection */}
      <section className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          {formula.tags && formula.tags.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="uppercase font-bold text-sm text-black dark:text-white">Tags</span>
              <div className="flex flex-wrap gap-2">
                {formula.tags.map((tag) => (
                  <Badge key={tag.id}>{tag.name}</Badge>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <h2 className="flex justify-end items-baseline gap-2 uppercase font-bold text-sm text-right text-black dark:text-white">
            <span className="font-star text-blue dark:text-red">{formula.fonts.length}</span> Fonts in this collection
          </h2>
        </div>
        {formula.fonts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {formula.fonts.map((font, idx) => (
              <IngredientCard key={font.id} font={font} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-lg text-zinc-500 dark:text-zinc-400 font-haas">
            NO_FONTS_IN_THIS_COLLECTION_YET
          </div>
        )}
      </section>

      <Cta
        title={<>Explore <span className="text-blue dark:text-red font-star px-2">More</span> Fonts?</>}
        subtitle="Browse the full archive to find your next favorite typeface, or check out our expert pairing prescriptions."
        align="center"
      >
        <Link href="/ingredients" className="inline-block">
          <Button variant="primary">BROWSE_ALL_FONTS</Button>
        </Link>
        <Link href="/prescriptions" className="inline-block">
          <Button variant="secondary">VIEW_PRESCRIPTIONS</Button>
        </Link>
      </Cta>
    </div>
  );
}
