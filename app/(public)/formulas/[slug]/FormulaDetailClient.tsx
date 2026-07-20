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
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-10">
      {/* Back button */}
      <MinimalLink
        href="/formulas"
        label="Back to Collections"
        icon={<MoveLeft size={12} />}
        iconPosition="left"
        className="font-bold tracking-widest text-bluegray-800 dark:text-redgray-200 hover:text-black dark:hover:text-white"
      />

      <PageHeading
        title={formula.name}
        subtitle={`FONT_CATEGORY: ${formula.fontCategory} // TOTAL_FONTS: ${formula.fonts.length}`}
        useGrainient
        grainientOptions={{
          color1: theme === "light" ? "#fdfdfd" : "#09090b",
          color2: theme === "light" ? "#c0d3ed" : "#570d22",
          color3: theme === "light" ? "#e5e7eb" : "#27272a",
        }}
        rightElement={
          isCurated ? (
            <Badge icon={<Sparkles className="h-3 w-3" />}>Typamine Selection</Badge>
          ) : undefined
        }
      />

      {/* Description */}
      {formula.description && (
        <section className="space-y-2">
          <h2 className="font-star text-2xl text-black dark:text-white">About this Collection</h2>
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
            {formula.description}
          </p>
        </section>
      )}

      {/* Tags, if any (mostly relevant for curated collections) */}
      {formula.tags && formula.tags.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-star text-2xl text-black dark:text-white">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {formula.tags.map((tag) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
          </div>
        </section>
      )}

      {/* The fonts in this collection */}
      <section className="space-y-4">
        <h2 className="font-star text-2xl text-black dark:text-white">The Fonts</h2>
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
