"use client";

import { useState } from "react";
import Link from "next/link";
import { MoveLeft, Sparkles, ArrowRight, Download, Loader2 } from "lucide-react";
import MinimalLink from "@/components/common/MinimalLink";
import { PageHeading } from "@/components/common/PageHeading";
import { useThemeStore } from "@/store/themeStore";
import { DynamicPlayground } from "@/components/font/DynamicPlayground";
import { getDeterministicFormula } from "@/lib/utils";
import { Cta } from "@/components/common/Cta";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Ingredient } from "@/types";

interface IngredientDetailClientProps {
  ingredient: Ingredient;
  hasPairings?: boolean;
}

export default function IngredientDetailClient({ ingredient, hasPairings = false }: IngredientDetailClientProps) {
  const { theme } = useThemeStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const fontData = {
    name: ingredient.name,
    fontFamily: ingredient.variants?.[0]?.fontFamilyName || "sans-serif",
    fontUrl: ingredient.variants?.[0]?.woff2Url,
  };

  const prescriptionsHref = `/prescriptions?font=${encodeURIComponent(ingredient.name)}`;
  const tags = ingredient.tags || [];
  const hasTags = tags.length > 0;
  const showRightSidebar = hasPairings || hasTags;

  const sourceUrl = ingredient.variants?.[0]?.woff2Url;

  // Il file reale su R2 non ha un nome utile (spesso solo l'id della variante),
  // quindi lo rinominiamo lato client sullo slug prima del download. L'attributo
  // `download` di un <a> viene ignorato dai browser per URL cross-origin come
  // assets.typamine.com, quindi serve scaricare il blob e servirlo da un
  // object URL same-origin perché il rename abbia effetto.
  const handleDownload = async () => {
    if (!sourceUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${ingredient.slug}.woff2`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Font download failed, falling back to direct link:", err);
      window.open(sourceUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      {/* Back button */}
      <div className="mb-4">
        <MinimalLink
          href="/ingredients"
          label="Back to Ingredients"
          icon={<MoveLeft size={12} />}
          iconPosition="left"
          className="ml-4 font-bold tracking-widest text-bluegray-800 dark:text-redgray-200 hover:text-black dark:hover:text-white"
        />
      </div>

      <PageHeading
        title={`COMPOUND: ${ingredient.name}`}
        subtitle={`CATEGORY: ${ingredient.category}`}
        useGrainient
        grainientOptions={{
          color1: theme === "light" ? "#fdfdfd" : "#09090b",
          color2: theme === "light" ? "#c0d3ed" : "#570d22",
          color3: theme === "light" ? "#e5e7eb" : "#27272a",
        }}
        rightElement={
          <button
            onClick={handleDownload}
            disabled={!sourceUrl || isDownloading}
            className="px-5 py-2.5 bg-red text-black font-haas font-bold text-xs rounded hover:bg-red-600 transition-colors glow-red disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {isDownloading ? "PREPARING..." : "DOWNLOAD_SOURCE_ASSETS.woff2"}
          </button>
        }
      />

      {showRightSidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <DynamicPlayground
              font={fontData}
              hideFontSelector={true}
            />
          </div>

          <div className="lg:col-span-1 flex flex-col justify-between gap-6 p-6 border border-black/5 dark:border-white/5 rounded-lg bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
            {/* Top Section: Tags */}
            {hasTags && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-haas block">
                  TAGS & CATEGORIES
                </span>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: any) => {
                    const tagId = typeof tag === "string" ? tag : tag.id;
                    const tagName = typeof tag === "string" ? tag : tag.name;
                    return (
                      <Link key={tagId} href={`/ingredients?tags=${encodeURIComponent(tagId)}`}>
                        <Badge className="hover:scale-105 transition-transform">{tagName}</Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider when both tags and pairings are present */}
            {hasTags && hasPairings && (
              <div className="border-t border-black/10 dark:border-white/10 my-1" />
            )}

            {/* Bottom Section: Pairings */}
            {hasPairings && (
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-blue/10 dark:bg-red/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue dark:text-red" />
                </div>
                <div>
                  <h3 className="font-star text-lg text-black dark:text-white leading-tight">
                    In the wild
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    See examples of how we used this font in our prescriptions.
                  </p>
                </div>
                <Link href={prescriptionsHref} className="inline-block">
                  <Button variant="outline" size="md" roundness="md" className="flex items-center gap-2">
                    See Examples
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <DynamicPlayground
          font={fontData}
          hideFontSelector={true}
        />
      )}

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
