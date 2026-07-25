"use client";

import React from 'react';

import Paragraph from '@/components/common/Paragraph';
import ParagraphWithImage from '@/components/common/ParagraphWithImage';
import Quote from '@/components/common/Quote';
import SimpleHero from '@/components/common/SimpleHero';
import GridHero from '@/components/common/GridHero';
import HorizontalSlider from '@/components/common/HorizontalSlider';
import ActionCta from '@/components/common/ActionCta';
import Spacer from '@/components/common/Spacer';
import { COLOR_PAIRS, FONT_FAMILIES } from '@/components/admin/common/content-modules/shared';
import { dynamicTextStyle } from '@/lib/dynamicStyle';

import { cn } from "@/lib/utils";

// Renderer generico per Post.insight — usato sia da /archive/[slug] che da
// /blog/[slug]. Gestisce tutti gli 8 tipi di content-module (l'admin di
// /admin/archive ne offre solo 3 — paragraph/paragraphWithImage/quote — quindi
// gli altri 5 case semplicemente non compaiono mai in un ArchivePost, ma sono
// necessari per i moduli aggiuntivi che /admin/blog offre).
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

export type InsightSection = "pairing" | "archive" | "blog";

export interface PostInsightPageRendererProps {
  content: string;
  section?: InsightSection;
}

const ARCHIVE_BORDER = "border border-ocragray-500/80 dark:border-ocragray-200/50";

const pairingParagraphClassNames = "";
const archiveParagraphClassNames = ARCHIVE_BORDER;
const blogParagraphClassNames = "";

const PARAGRAPH_SECTION_CLASSNAMES: Record<InsightSection, string> = {
  pairing: pairingParagraphClassNames,
  archive: archiveParagraphClassNames,
  blog: blogParagraphClassNames,
};

const pairingParagraphWithImageClassNames = "";
const archiveParagraphWithImageClassNames = ARCHIVE_BORDER;
const blogParagraphWithImageClassNames = "";

const PARAGRAPH_WITH_IMAGE_SECTION_CLASSNAMES: Record<InsightSection, string> = {
  pairing: pairingParagraphWithImageClassNames,
  archive: archiveParagraphWithImageClassNames,
  blog: blogParagraphWithImageClassNames,
};

const pairingQuoteClassNames = "";
const archiveQuoteClassNames = ARCHIVE_BORDER;
const blogQuoteClassNames = "rounded-tl-4xl rounded-br-4xl";

const QUOTE_SECTION_CLASSNAMES: Record<InsightSection, string> = {
  pairing: pairingQuoteClassNames,
  archive: archiveQuoteClassNames,
  blog: blogQuoteClassNames,
};

export default function PostInsightPageRenderer({ content, section }: PostInsightPageRendererProps) {
  let modules: InsightModule[] = [];

  try {
    modules = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse post insight content:", e);
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-y-4 text-black dark:text-white">
      {modules.map((module) => {
        const { id, type, props } = module;

        switch (type) {
          case 'paragraph': {
            const sectionClass = section ? PARAGRAPH_SECTION_CLASSNAMES[section] : "";
            return (
              <section key={id} className="">
                <Paragraph
                  as={props.as}
                  size={props.size}
                  align={props.align}
                  weight={props.weight}
                  colorClassName={props.colorClassName}
                  className={cn(
                    "p-4",
                    COLOR_PAIRS_MAP[props.colors],
                    FONT_FAMILIES_MAP[props.fontFamily],
                    sectionClass
                  )}
                >
                  {props.children}
                </Paragraph>
              </section>
            );
          }

          case 'paragraphWithImage': {
            const isBg = props.imagePosition === 'background';
            const sectionClass = section ? PARAGRAPH_WITH_IMAGE_SECTION_CLASSNAMES[section] : "";
            return (
              <section key={id} className={cn(!isBg && "px-6 md:px-12 lg:px-0")}>
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
                    "overflow-hidden",
                    !isBg && cn("p-8", COLOR_PAIRS_MAP[props.colors]),
                    sectionClass
                  )}
                  className={cn(FONT_FAMILIES_MAP[props.fontFamily])}
                  imageClassName='rounded-none'
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
            const sectionClass = section ? QUOTE_SECTION_CLASSNAMES[section] : "";

            return (
              <section key={id} className="lg:p-8">
                <Quote
                  author={props.author}
                  authorDates={props.authorDates}
                  authorInfo={props.authorInfo}
                  colorClassName={props.colorClassName}
                  bgColorClassName={props.bgColorClassName}
                  className={cn(
                    "p-8 backdrop-blur-md",
                    fallbackBgClass,
                    FONT_FAMILIES_MAP[props.fontFamily],
                    sectionClass
                  )}
                >
                  {props.children}
                </Quote>
              </section>
            );
          }

          case 'simpleHero':
            return (
              <section key={id}>
                <SimpleHero
                  title={props.title}
                  subtitle={props.subtitle}
                  imageSrc={resolveMediaUrl(props.imageSrc)}
                  imageAlt={props.imageAlt}
                  align={props.align}
                  vAlign={props.vAlign}
                  titleColorClassName={props.titleColorClassName}
                  titleFontFamily={props.titleFontFamily}
                  subtitleColorClassName={props.subtitleColorClassName}
                  subtitleFontFamily={props.subtitleFontFamily}
                  overlayColorClassName={props.overlayColorClassName}
                />
              </section>
            );

          case 'gridHero':
            return (
              <section key={id}>
                <GridHero
                  imageSrc={resolveMediaUrl(props.imageSrc)}
                  imageAlt={props.imageAlt}
                  imagePosition={props.imagePosition}
                  topTitle={props.topTitle}
                  topSubtitle={props.topSubtitle}
                  topBgColorClassName={props.topBgColorClassName}
                  topTitleColorClassName={props.topTitleColorClassName}
                  topTitleFontFamily={props.topTitleFontFamily}
                  topSubtitleColorClassName={props.topSubtitleColorClassName}
                  topSubtitleFontFamily={props.topSubtitleFontFamily}
                  bottomParagraph={props.bottomParagraph}
                  bottomBgColorClassName={props.bottomBgColorClassName}
                  bottomParagraphColorClassName={props.bottomParagraphColorClassName}
                  bottomFontFamily={props.bottomFontFamily}
                  hasButton={props.hasButton}
                  buttonLabel={props.buttonLabel}
                  buttonHref={props.buttonHref}
                  buttonVariant={props.buttonVariant}
                />
              </section>
            );

          case 'horizontalSlider':
            return (
              <section key={id}>
                <HorizontalSlider
                  title={props.title}
                  subtitle={props.subtitle}
                  titleColorClassName={props.titleColorClassName}
                  subtitleColorClassName={props.subtitleColorClassName}
                  bgColorClassName={props.bgColorClassName}
                  cardColorClassName={props.cardColorClassName}
                  items={props.items}
                />
              </section>
            );

          case 'actioncta':
            return (
              <section key={id}>
                <ActionCta
                  title={props.title}
                  paragraph={props.paragraph}
                  imageSrc={resolveMediaUrl(props.imageSrc)}
                  imageAlt={props.imageAlt}
                  imagePosition={props.imagePosition}
                  titleColorClassName={props.titleColorClassName}
                  paragraphColorClassName={props.paragraphColorClassName}
                  fontFamily={props.fontFamily}
                  buttonOneLabel={props.buttonOneLabel}
                  buttonOneLink={props.buttonOneLink}
                  buttonOneVariant={props.buttonOneVariant}
                  buttonOneIsExternal={props.buttonOneIsExternal}
                  buttonTwoLabel={props.buttonTwoLabel}
                  buttonTwoLink={props.buttonTwoLink}
                  buttonTwoVariant={props.buttonTwoVariant}
                  buttonTwoIsExternal={props.buttonTwoIsExternal}
                />
              </section>
            );

          case 'spacer':
            return (
              <Spacer
                key={id}
                height={props.height}
                type={props.type}
                lineColorClassName={props.lineColorClassName}
                lineHeight={props.lineHeight}
                lineWidth={props.lineWidth}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
