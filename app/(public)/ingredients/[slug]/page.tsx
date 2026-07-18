"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MoveLeft } from "lucide-react";
import MinimalLink from "@/components/common/MinimalLink";
import { PageHeading } from "@/components/common/PageHeading";
import { useThemeStore } from "@/store/themeStore";
import { DynamicPlayground } from "@/components/font/DynamicPlayground";
import ALL_INGREDIENTS from "@/lib/sample-data/fonts.json";
import { getDeterministicFormula } from "@/lib/utils";
import { Cta } from "@/components/common/Cta";
import { Button } from "@/components/common/Button";

export default function IngredientDetailPage() {
  const params = useParams();
  const slug = params?.slug as string || "unknown";
  const { theme } = useThemeStore();

  const fontDataRaw = ALL_INGREDIENTS.find(f => f.slug === slug);
  const fontData = fontDataRaw ? { name: fontDataRaw.name, fontFamily: fontDataRaw.variants?.[0]?.fontFamilyName || "sans-serif" } : undefined;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      {/* Back button */}
      <div className="mb-4">
        <MinimalLink 
          href="/ingredients" 
          label="BACK_TO_LAB_ARCHIVE"
          icon={<MoveLeft size={12}  />}
          iconPosition="left"
          className="ml-4 font-bold uppercase tracking-widest text-bluegray-600 dark:text-redgray-400 hover:text-black dark:hover:text-white"
        />
      </div>

      <PageHeading 
        title={fontDataRaw ? `COMPOUND: ${fontDataRaw.name}` : `COMPOUND: ${slug}`}
        subtitle={fontDataRaw ? `FORMULA_HASH: ${fontDataRaw.formula || getDeterministicFormula(fontDataRaw.name)} // CATEGORY: ${fontDataRaw.category}` : `FORMULA_HASH: F_${slug.toUpperCase()}_56Y // COMPATIBILITY: EXTREME`}
        useGrainient
        grainientOptions={{
          color1: theme === "light" ? "#fdfdfd" : "#09090b",
          color2: theme === "light" ? "#c0d3ed" : "#570d22",
          color3: theme === "light" ? "#e5e7eb" : "#27272a",
        }}
        rightElement={
          <button className="px-5 py-2.5 bg-[#ff3131] text-black font-haas font-bold text-xs rounded hover:bg-red-600 transition-colors glow-red">
            DOWNLOAD_SOURCE_ASSETS.woff2
          </button>
        }
      />

      <DynamicPlayground 
        font={fontData}
        hideFontSelector={true}
      />

      <Cta 
        title={<>Need <span className="text-blue dark:text-red font-star px-2">integration</span> tools?</>}
        subtitle="Head over to the Labs Bench for @font-face snippet generators, WCAG contrast ratio checkers for accessibility, Tailwind CSS utilities, and much more."
        align="right"
        bgImage="/images/ingredient/cta-bg.png"
        
      >
        <Link href="/labs" className="inline-block">
          <Button variant="secondary" >ENTER_THE_LABS</Button>
        </Link>
      </Cta>
    </div>
  );
}
