"use client";

import React from 'react';

import Paragraph from '@/components/common/Paragraph';
import ParagraphWithImage from '@/components/common/ParagraphWithImage';
import Quote from '@/components/common/Quote';
import { PAGE_THEMES, COLOR_PAIRS, FONT_FAMILIES } from '@/components/admin/common/content-modules/shared';

import { cn } from "@/lib/utils";

// Le combo di PAGE_THEMES sono tutte "chiaro in light mode, scuro in dark
// mode" (stessa direzione di contrasto del tema base del sito), quindi un
// singolo testo neutro funziona su tutte senza bisogno di una mappa dedicata.
const PAGE_THEMES_MAP: Record<string, string> = Object.fromEntries(
  PAGE_THEMES.map((t) => [t.id, t.classes])
);
const PAGE_TEXT_CLASS = "text-black dark:text-white";

const COLOR_PAIRS_MAP: Record<string, string> = Object.fromEntries(
  COLOR_PAIRS.map((c) => [c.id, c.classes])
);

const FONT_FAMILIES_MAP: Record<string, string> = Object.fromEntries(
  FONT_FAMILIES.map((f) => [f.id, f.class])
);

interface Module {
  id: string;
  type: string;
  props: Record<string, any>;
}

interface BlogPost {
  title: string;
  thumbnailUrl?: string | null;
  createdAt: Date | string;
  showAuthor?: boolean;
  pageTheme?: string;
  author?: {
    name: string | null;
    surname?: string | null;
    imageUrl?: string | null;
    image?: string | null;
    biography?: string | null;
  } | null;
  [key: string]: any;
}

export default function BlogPageRenderer({ content, post }: { content: string, post?: BlogPost }) {
  let modules: Module[] = [];

  try {
    modules = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse blog content:", e);
    return <div>Error loading content.</div>;
  }

  const replaceVariables = (text: string): string => {
    if (!text || !post) return text;
    return text.replace(/\{\{post\.(.*?)\}\}/g, (match, path) => {
      const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], post);
      if (value instanceof Date) return value.toLocaleDateString();
      return value !== undefined && value !== null ? String(value) : match;
    });
  };

  const resolveMediaUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('media://')) {
      const key = url.replace('media://', '');
      return `/api/media/${key}`;
    }
    return url;
  };

  return (
    <div className={cn(
      "w-full flex flex-col gap-y-16 min-h-screen transition-colors duration-700 pb-32",
      post?.pageTheme ? PAGE_THEMES_MAP[post.pageTheme] : "bg-white dark:bg-black",
      PAGE_TEXT_CLASS
    )}>
      {modules.map((module) => {
        const { id, type, props } = module;

        switch (type) {

          case 'paragraph':
            return (
              <section key={id} className="px-6 md:px-12 lg:px-24 transition-colors duration-500">
                <div className="max-w-7xl mx-auto">
                  <Paragraph
                    as={props.as}
                    size={props.size}
                    align={props.align}
                    scrollReveal={props.scrollReveal}
                    weight={props.weight}
                    colorClassName={props.colorClassName}
                    className={cn(
                      "lg:py-24 px-0 md:px-16 rounded-2xl",
                      COLOR_PAIRS_MAP[props.colors],
                      FONT_FAMILIES_MAP[props.fontFamily]
                    )}
                  >
                    {replaceVariables(props.children)}
                  </Paragraph>
                </div>
              </section>
            );

          case 'paragraphWithImage': {
            const isBg = props.imagePosition === 'background';
            return (
              <section key={id} className={cn("transition-colors duration-500", !isBg && "md:px-12 lg:px-24")}>
                <div className={cn(!isBg && "max-w-7xl mx-auto")}>
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
                    className={cn(COLOR_PAIRS_MAP[props.colors], FONT_FAMILIES_MAP[props.fontFamily])}
                  >
                    {replaceVariables(props.children)}
                  </ParagraphWithImage>
                </div>
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

            return (
              <section key={id} className="px-6 md:px-12 lg:px-24 transition-colors duration-500">
                <div className="max-w-7xl mx-auto">
                  <Quote
                    author={replaceVariables(props.author)}
                    authorDates={replaceVariables(props.authorDates)}
                    authorInfo={replaceVariables(props.authorInfo)}
                    colorClassName={props.colorClassName}
                    bgColorClassName={props.bgColorClassName}
                    className={cn(
                      "rounded-2xl p-8 sm:p-12 md:p-16 border border-black/5 dark:border-white/5 backdrop-blur-md",
                      fallbackBgClass,
                      FONT_FAMILIES_MAP[props.fontFamily]
                    )}
                  >
                    {replaceVariables(props.children)}
                  </Quote>
                </div>
              </section>
            );
          }

          default:
            return (
              <div key={id} className="py-12 px-8 bg-red-50 text-red-500 text-xs font-mono">
                Unknown module type: {type}
              </div>
            );
        }
      })}

      {/* Author Card Footer */}
      {post?.showAuthor && post.author && (
        <section className="px-6 md:px-12 lg:px-24 mt-16 transition-colors duration-500">
          <div className="max-w-3xl mx-auto">
            {/* Author Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 p-8 sm:p-10 rounded-2xl bg-zinc-100/20 dark:bg-black/20 border border-black/5 dark:border-white/5 backdrop-blur-md shadow-lg hover:shadow-2xl hover:border-white/30 dark:hover:border-white/20 transition-all duration-500 group">
              <div className="h-20 w-20 rounded-full border-2 border-white/40 dark:border-white/20 shadow-md overflow-hidden flex items-center justify-center shrink-0 bg-zinc-100/40 dark:bg-black/40 group-hover:scale-105 transition-transform duration-500">
                {post.author.imageUrl ? (
                  <img src={post.author.imageUrl} alt={post.author.name || ""} className="h-full w-full object-cover" />
                ) : post.author.image ? (
                  <img src={post.author.image} alt={post.author.name || ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-white/20 via-black/5 to-red-500/10 flex items-center justify-center">
                    <span className="text-2xl font-black font-star opacity-40">{post.author.name?.[0]?.toUpperCase() || "A"}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-3">
                <p className="text-[10px] font-bold text-black/40 dark:text-white/50 uppercase tracking-[0.2em]">Published By</p>
                <h4 className="text-3xl font-star leading-tight text-black dark:text-white">
                  {post.author.name} {post.author.surname || ""}
                </h4>
                <p className="text-sm opacity-80 leading-relaxed max-w-xl text-black/80 dark:text-white/70">
                  {post.author.biography || "Dedicated author sharing wisdom, insights, and stories to support your floating journey and overall well-being."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
