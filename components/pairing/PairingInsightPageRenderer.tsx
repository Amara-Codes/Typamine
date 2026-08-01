"use client";

import React from 'react';

import Paragraph from '@/components/common/Paragraph';
import ParagraphWithImage from '@/components/common/ParagraphWithImage';
import Quote from '@/components/common/Quote';
import { COLOR_PAIRS, FONT_FAMILIES } from '@/components/admin/common/content-modules/shared';

import { cn } from "@/lib/utils";

// Stesso renderer di components/post/PostInsightPageRenderer.tsx, ma limitato ai 3 tipi di modulo
// che PairingForm permette di creare per l'"insight" di una pairing
// (paragraph, paragraphWithImage, quote — niente hero/cta/slider/spacer).
const COLOR_PAIRS_MAP: Record<string, string> = Object.fromEntries(
  COLOR_PAIRS.map((c) => [c.id, c.classes])
);

const FONT_FAMILIES_MAP: Record<string, string> = Object.fromEntries(
  FONT_FAMILIES.map((f) => [f.id, f.class])
);

interface InsightModule {
  id: string;
  type: string;
  props: Record<string, any>;
}

const resolveMediaUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('media://')) {
    const key = url.replace('media://', '');
    return `/api/media/${key}`;
  }
  return url;
};

export default function PairingInsightPageRenderer({ content }: { content: string }) {
  let modules: InsightModule[] = [];

  try {
    modules = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse pairing insight content:", e);
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-y-4 text-black dark:text-white">
      {modules.map((module) => {
        const { id, type, props } = module;

        switch (type) {
          case 'paragraph':
            return (
              // Niente padding qui: Paragraph sotto ha gia' py-8 px-6 di suo
              // (vedi className passata) — un altro px-6 qui raddoppiava il
              // padding orizzontale su ogni breakpoint sotto lg (48px invece
              // di 24px per lato, ~25% di viewport sprecato su mobile).
              <section key={id}>
                <Paragraph
                  as={props.as}
                  size={props.size}
                  align={props.align}
                  weight={props.weight}
                  colorClassName={props.colorClassName}
                  className={cn(
                    "p-4 lg:py-8 lg:px-6 rounded-sm lg:rounded-xl bg-white/50 dark:bg-ocragray-800",
                    COLOR_PAIRS_MAP[props.colors],
                    FONT_FAMILIES_MAP[props.fontFamily]
                  )}
                >
                  {props.children}
                </Paragraph>
              </section>
            );

          case 'paragraphWithImage': {
            const isBg = props.imagePosition === 'background';
            // Niente padding sul <section>: containerClassName sotto ha gia'
            // p-8 sm:p-12 md:p-16 di suo quando non e' background — stesso
            // problema di doppio padding del case 'paragraph' sopra.
            return (
              <section key={id}>
                <ParagraphWithImage
                  imageSrc={resolveMediaUrl(props.imageUrl || props.image || props.imageSrc) || ""}
                  imageAlt={props.imageAlt}
                  imagePosition={props.imagePosition}
                  imageAspectRatio={props.imageAspectRatio}
                  parallax={props.parallax}
                  parallaxSpeed={props.parallaxSpeed}
                  overlayOpacity={props.overlayOpacity}
                  size={props.size}
                  weight={props.weight}
                  colorClassName={props.colorClassName}
                  containerClassName={cn(
                    "rounded-sm lg:rounded-xl overflow-hidden",
                    !isBg && cn("p-4 lg:p-8 bg-white/50 dark:bg-ocragray-800", COLOR_PAIRS_MAP[props.colors] )
                  )}
                  className={cn(FONT_FAMILIES_MAP[props.fontFamily])}
                >
                  {props.children}
                </ParagraphWithImage>
              </section>
            );
          }

          case 'quote': {
            // bgColorClassName/colorClassName sono stringhe Tailwind dinamiche
            // (colore + opacità scelti in admin, sfondo anche a gradiente):
            // passate come prop dedicate, Quote le risolve in CSS reale
            // internamente (vedi lib/dynamicStyle.ts) invece di iniettarle
            // come classi statiche che Tailwind non genererebbe mai.
            const fallbackBgClass = props.bgColorClassName ? undefined : (COLOR_PAIRS_MAP[props.colors] || "bg-zinc-100/20 dark:bg-black/20");
            const defaultQuoteClass = fallbackBgClass + " rounded-sm lg:rounded-xl border-2 border-blue-600 dark:border-red-200 transition-all duration-500" 
            return (
              // Nessun padding verticale qui — vedi la nota equivalente in
              // PostInsightPageRenderer: sommato allo spacing del wrapper
              // esterno raddoppiava il bottom quando la pagina finiva con un quote.
              <section key={id} className="">
                <Quote
                  author={props.author}
                  authorDates={props.authorDates}
                  authorInfo={props.authorInfo}
                  colorClassName={props.colorClassName}
                  bgColorClassName={props.bgColorClassName}
                  className={cn(
                    defaultQuoteClass,
                    FONT_FAMILIES_MAP[props.fontFamily]
                  )}
                >
                  {props.children}
                </Quote>
              </section>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
