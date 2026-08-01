"use client";

import Link from "next/link";
import { MoveLeft, Download } from "lucide-react";
import MinimalLink from "@/components/common/MinimalLink";
import { Hero } from "@/components/common/Hero";
import { useThemeStore } from "@/store/themeStore";
import Grainient from "@/components/cherry/Grainient";
import { Badge } from "@/components/common/Badge";
import { Prescription, Ingredient, Tag } from "@/types";
import { IngredientCard } from "@/components/font/IngredientCard";
import PairingInsightPageRenderer from "@/components/pairing/PairingInsightPageRenderer";

interface PrescriptionDetailClientProps {
  prescription: Prescription;
}

export default function PrescriptionDetailClient({ prescription }: PrescriptionDetailClientProps) {
  const { theme } = useThemeStore();
  const { primaryFont, secondaryFont } = prescription;
  const tags = (prescription.tags || []).map((t): Tag =>
    typeof t === "string" ? { id: t, name: t } : t
  );

  // L'insight è un JSON di content-module (paragraph/paragraphWithImage/quote);
  // mostriamo la sezione solo se esiste ed effettivamente contiene moduli.
  let hasInsight = false;
  if (prescription.insight) {
    try {
      const parsed = JSON.parse(prescription.insight);
      hasInsight = Array.isArray(parsed) && parsed.length > 0;
    } catch {
      hasInsight = false;
    }
  }



  const grainientColors = {
    color1: theme === "light" ? "#fdfdfd" : "#321c1c",
    color2: theme === "light" ? "#c0d3ed" : "#7c1111",
    color3: theme === "light" ? "#e5e7eb" : "#380b36",
  };

  return (
    <div className="relative w-full mx-auto lg:pb-8 space-y-10">
      {/* Back button — stessa posizione (max-w-7xl, in flusso, pt-24) delle altre pagine di dettaglio */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 mb-4">
        <MinimalLink
          href="/prescriptions"
          label="Back to Prescriptions"
          icon={<MoveLeft size={12} />}
          iconPosition="left"
          className="ml-4 font-bold tracking-widest text-bluegray-800 dark:text-redgray-200 hover:text-black dark:hover:text-white"
        />
      </div>

      {/* Hero: image background, centered name — resta fullwidth, subito sotto il back link */}
      <Hero
        title=" "
        description=" "
        layout="contentCenter"
        bgImage={prescription.imageUrl}
        bgOpacity={1}
        fullWidth
        clearView
      />

<div className="max-w-7xl w-full mx-auto flex flex-col lg:mt-16 lg:rounded-xl bg-ocragray-200 dark:bg-ocragray-900 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8">
          {/* Left Column: Description & Tags (1/3 width) */}
          <div className="lg:col-span-4 flex flex-col">
            <section className="relative overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 h-full flex flex-col justify-between space-y-6">
              <div className="absolute inset-0 h-full mb-0 z-0 pointer-events-none opacity-50 dark:opacity-40">
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
                  saturation={0.7}
                  centerX={0}
                  centerY={0}
                  zoom={1}
                  color1={grainientColors.color1}
                  color2={grainientColors.color2}
                  color3={grainientColors.color3}
                />
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h2 className="font-haas font-bold text-4xl sm:text-5xl text-black dark:text-white leading-tight">
                    {prescription.name}
                  </h2>
                  {prescription.description && (
                    <p className="text-black dark:text-white leading-relaxed font-medium text-sm sm:text-base">
                      {prescription.description}
                    </p>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="border-t border-black/10 dark:border-white/10 pt-4 space-y-2 mt-auto">
                    <h3 className="font-star text-2xl text-black dark:text-white">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Link key={tag.id} href={`/prescriptions?tags=${encodeURIComponent(tag.name)}`}>
                          <Badge hoverZoom>{tag.name}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Ingredients stacked (2/3 width) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <div className="flex-1 flex flex-col gap-4">
              {[primaryFont, secondaryFont]
                .filter((font): font is Ingredient => Boolean(font))
                .map((font, idx) => (
                  <IngredientCard key={font.id} font={font} idx={idx} linklabel="Download Now" fontSize={32} />
                ))}
            </div>
          </div>
        </div>

        {hasInsight && (
          <section className="space-y-4 mt-8">

            <PairingInsightPageRenderer content={prescription.insight as string} />
          </section>
        )}
      </div>
    </div>
  );
}
