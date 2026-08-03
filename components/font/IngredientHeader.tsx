"use client";

import { useState } from "react";
import { Download, Loader2, ShieldCheck, ShieldEllipsis } from "lucide-react";
import Grainient from "@/components/cherry/Grainient";
import IngredientRatingWidget from "@/components/font/IngredientRatingWidget";
import { GetSymbol } from "@/components/font/IngredientCard";
import { Ingredient } from "@/types";
import Link from "next/link";

interface IngredientHeaderProps {
  ingredient: Ingredient;
  hasVoted: boolean;
  sourceUrl?: string;
  isDownloading: boolean;
  isLicenseFree: boolean;
  grainientOptions: { color1: string; color2: string; color3: string };
  onDownloadClick: () => void;
}

export default function IngredientHeader({
  ingredient,
  hasVoted,
  sourceUrl,
  isDownloading,
  isLicenseFree,
  grainientOptions,
  onDownloadClick,
}: IngredientHeaderProps) {
  const [glowKey, setGlowKey] = useState(0);

  const triggerGlow = () => {
    setGlowKey((prev) => prev + 1);
  };

  const handleDownloadClick = () => {
    triggerGlow();
    onDownloadClick();
  };

  return (
    // Un unico contenitore, un solo Grainient di sfondo (posizionamento
    // assoluto standard per il layer decorativo, non per il symbol) —
    // symbol, rating e heading tutti nel normale flusso flex dentro.
    <div className="relative flex flex-col rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Grainient
          timeSpeed={0.5}
          colorBalance={0}
          warpStrength={0.5}
          warpFrequency={3}
          warpSpeed={0.5}
          warpAmplitude={30}
          blendAngle={0}
          blendSoftness={0.1}
          rotationAmount={100}
          noiseScale={2}
          grainAmount={0.15}
          grainScale={1.5}
          grainAnimated={false}
          contrast={1.2}
          gamma={1}
          saturation={0.5}
          centerX={0}
          centerY={0}
          zoom={1}
          {...grainientOptions}
        />
      </div>

      {/* Riga 1 — symbol + rating, entrambi nel flusso normale */}
      <div className="relative z-10 flex items-stretch gap-3">
        <div className="m-4">
          <div
            key={glowKey}
            className={`w-24 h-24 shrink-0 border border-blue/30 dark:border-red-200/30 rounded-lg bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center font-haas font-bold text-4xl text-blue dark:text-red-200 ${
              glowKey > 0 ? "animate-glow-pulse-1s" : ""
            }`}
          >
            {GetSymbol({ fontName: ingredient.name })}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center pr-4">
          <IngredientRatingWidget
            bare
            ingredientId={ingredient.id}
            slug={ingredient.slug}
            typamineRating={parseFloat(ingredient.rating) || 0}
            initialUserRating={ingredient.userRating || 0}
            initialUserRatingsCount={ingredient.userRatingsCount || 0}
            initialHasVoted={hasVoted}
            onRateSuccess={triggerGlow}
          />
        </div>
      </div>

      {/* Riga 2 — heading, full width, stesso grainient continua sotto */}
      <div className="relative z-10  p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="space-y-1">
          <h1 className="flex items-baseline gap-x-3 font-haas text-2xl font-bold text-glow-cyan dark:text-glow-red text-blue dark:text-red">
            {ingredient.name.replaceAll('_', " ")} 
            <span className="text-sm">by</span> 
            <Link href={`/ingredients?author=${ingredient.author?.slug}`} className="text-black dark:text-white font-bold text-sm underline"> {ingredient.author?.name}</Link> 
          </h1>
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-haas mt-1">
            CATEGORY: {ingredient.category}
          </div>
        </div>

        <div className="flex-shrink-0 w-full md:w-auto">
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleDownloadClick}
              disabled={!sourceUrl || isDownloading}
              className="px-5 py-2.5 bg-red text-black font-haas font-bold text-xs rounded hover:bg-red-600 transition-colors glow-red disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {isDownloading ? "PREPARING..." : "DOWNLOAD WOFF2"}
            </button>
            <span className="flex items-center gap-1.5 font-haas text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {isLicenseFree ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <ShieldEllipsis className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              License: <span className="text-black dark:text-white font-bold">{ingredient.licenseType || "Unclassified"}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
