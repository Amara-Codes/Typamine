import React from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import Link from "next/link";
import { MediaBackground, LoopSettings } from "./MediaBackground";

interface HeroProps {
  badgeText?: string;
  title: React.ReactNode;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  bgImage?: string;
  bgOpacity?:number;
  loopSettings?: LoopSettings;
  layout?: "contentCenter" | "contentLeft" | "contentRight";
  fullWidth?: boolean;
  clearView?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  badgeText,
  title,
  description,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
  bgImage,
  bgOpacity = 0.8,
  loopSettings,
  layout = "contentCenter",
  fullWidth = false,
  clearView = false,
}) => {
  // Mapping for layout alignments
  const alignmentStyles = {
    contentLeft: "text-left items-start mr-auto",
    contentCenter: "text-center items-center mx-auto",
    contentRight: "text-right items-end ml-auto",
  };
 
  const bgStyles = clearView ? "bg-transparent" : "bg-white/70 dark:bg-black/70";

  // aspect-[1200/630] (formato social-card, il piu' comune per queste
  // immagini) invece di h-[100dvh]: un contenitore a piena altezza viewport
  // forzava con object-cover un crop pesantissimo su mobile. Ma le immagini
  // caricate qui non hanno TUTTE esattamente questo ratio (niente crop
  // lato server), quindi anche con l'aspect-ratio "giusto" object-cover
  // poteva continuare a tagliare quando il ratio reale differiva — vedi
  // object-contain sotto, che elimina il crop del tutto qualunque sia il
  // ratio dell'immagine (a costo di eventuali bande vuote, riempite dal
  // background della sezione invece di lasciarle vuote).
  const containerStyles = fullWidth
    ? `w-full aspect-[1200/630] border-0 ${bgStyles} rounded-none mb-0 pt-16 pb-6 px-6 md:px-12 relative overflow-hidden transition-colors duration-300 flex flex-col justify-center`
    : `w-full aspect-video border border-zinc-300 dark:border-zinc-800 ${bgStyles} rounded-lg p-6 md:p-8 relative overflow-hidden transition-colors duration-300 flex flex-col justify-center`;
 
  return (
    <section className={containerStyles}>
      {/* Optional Background Media (image, gif or video) */}
      {bgImage && (
        <MediaBackground
          src={bgImage}
          alt="Hero Background"
          opacity={clearView ? 1 : bgOpacity}
          loopSettings={loopSettings}
          className="absolute inset-0 object-contain w-full h-full -z-20 pointer-events-none select-none"
        />
      )}
      
      {/* Glow accent */}
      {!clearView && (
        <div className="absolute right-0 top-0 w-96 h-96 bg-radial from-[#ff3131]/10 to-transparent pointer-events-none -z-10" />
      )}
 
      <div className={`max-w-3xl flex flex-col space-y-4 relative z-10 ${alignmentStyles[layout]}`}>
        {badgeText && (
          <Badge ping>
            {badgeText}
          </Badge>
        )}

        <h1 className="font-haas text-2xl md:text-5xl font-bold tracking-tight text-foreground text-glow-red">
          {title}
        </h1>

        <p className="text-zinc-700 dark:text-zinc-300 text-xs md:text-base max-w-xl leading-relaxed">
          {description}
        </p>

        <div className="pt-4 flex flex-wrap gap-3">
          {ctaHref && ctaText && (
            <Link href={ctaHref}>
              <Button variant="primary">
                {ctaText}
              </Button>
            </Link>
          )}
          {secondaryCtaHref && secondaryCtaText && (
            <Link href={secondaryCtaHref}>
              <Button variant="outline">
                {secondaryCtaText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
