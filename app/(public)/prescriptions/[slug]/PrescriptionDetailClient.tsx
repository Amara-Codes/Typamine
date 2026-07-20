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

interface PrescriptionDetailClientProps {
  prescription: Prescription;
}

export default function PrescriptionDetailClient({ prescription }: PrescriptionDetailClientProps) {
  const { theme } = useThemeStore();
  const { primaryFont, secondaryFont } = prescription;
  const tags = (prescription.tags || []).map((t): Tag =>
    typeof t === "string" ? { id: t, name: t } : t
  );



  const grainientColors = {
    color1: theme === "light" ? "#fdfdfd" : "#321c1c",
    color2: theme === "light" ? "#c0d3ed" : "#7c1111",
    color3: theme === "light" ? "#e5e7eb" : "#380b36",
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-10">
      {/* Back button */}
      <MinimalLink
        href="/prescriptions"
        label="Back to Prescriptions"
        icon={<MoveLeft size={12} />}
        iconPosition="left"
        className="font-bold tracking-widest text-bluegray-800 dark:text-redgray-200 hover:text-black dark:hover:text-white"
      />

      {/* Hero: image background, centered name */}
      <Hero
        title=" "
        description=" "
        layout="contentCenter"
        bgImage={prescription.imageUrl}
        ctaText=""
        ctaHref=""
        secondaryCtaText=""
        secondaryCtaHref=""
      />

<div className="flex flex-col rounded-xl bg-ocragray-200 dark:bg-ocragray-900 p-6">
      <h1 className="text-5xl font-bold text-black dark:text-white text-center mb-4">{prescription.name}</h1>
      {/* Description Section with Grainient Background */}
      {prescription.description && (
        <section className="relative overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-3 mb-8">
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
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={tags.length > 0 ? "lg:col-span-8 space-y-2" : "lg:col-span-12 space-y-2"}>
              <h2 className="font-star text-4xl text-black dark:text-white">About this Pairing</h2>
              <p className="text-black dark:text-white leading-relaxed max-w-3xl font-medium mb-0">
                {prescription.description}
              </p>
            </div>

            {tags.length > 0 && (
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-black/10 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6 space-y-3">
                <h2 className="font-star text-4xl text-black dark:text-white">Tags & Categories</h2>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <Link key={tag.id} href={`/prescriptions?tags=${encodeURIComponent(tag.id)}`}>
                      <Badge className="hover:scale-105 transition-transform">{tag.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-star text-4xl text-black dark:text-white text-center">The <span className="text-blue dark:text-red">Ingredients</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2  gap-4">
          {[primaryFont, secondaryFont]
            .filter((font): font is Ingredient => Boolean(font))
            .map((font, idx) => (
              <IngredientCard key={font.id} font={font} idx={idx} linklabel="Download Now" fontSize={32}/>
            ))}
        </div>
      </section>
    </div>
    </div>
  );
}
