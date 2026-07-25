import React from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import Link from "next/link";
import Image from "next/image";

interface DoubleHeroProps {
  badgeText?: string;
  title: React.ReactNode;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  bgImage?: string;
  bgOpacity?: number;
  bgObjectFit?: "cover" | "contain";
  bgObjectPosition?: "top" | "center" | "bottom";
  layout?: "contentCenter" | "contentLeft" | "contentRight";
  vLayout?: "contentCenter" | "contentTop" | "contentBottom";
  fullWidth?: boolean;
  clearView?: boolean;
  children?: React.ReactNode;
}

export const DoubleHero: React.FC<DoubleHeroProps> = ({
  badgeText,
  title,
  description,
  ctaText = "",
  ctaHref = "",
  secondaryCtaText = "",
  secondaryCtaHref = "",
  bgImage,
  bgOpacity = 0.8,
  bgObjectFit = "cover",
  bgObjectPosition = "top",
  layout = "contentCenter",
  vLayout = "contentCenter",
  fullWidth = true,
  clearView = false,
  children,
}) => {
  // Mapping for layout alignments
  const alignmentStyles = {
    contentLeft: "text-left items-start mr-auto",
    contentCenter: "text-center items-center mx-auto",
    contentRight: "text-right items-end ml-auto",
  };

  const vAlignmentStyles = {
    contentTop: "justify-start",
    contentCenter: "justify-center",
    contentBottom: "justify-end",
  };

  const bgStyles = clearView ? "bg-transparent" : "bg-white/70 dark:bg-black/70";

  const containerStyles = fullWidth
    ? `w-full min-h-[200dvh] border-0 ${bgStyles} rounded-none relative overflow-hidden transition-colors duration-300 flex flex-col justify-between`
    : `w-full min-h-[200dvh] border border-zinc-300 dark:border-zinc-800 ${bgStyles} rounded-lg relative overflow-hidden transition-colors duration-300 flex flex-col justify-between`;

  const objectFitClass = bgObjectFit === "contain" ? "object-contain" : "object-cover";
  const objectPosClass = bgObjectPosition === "top" ? "object-top" : bgObjectPosition === "bottom" ? "object-bottom" : "object-center";

  return (
    <section className={containerStyles}>
      {/* Optional Background Image spanning the double-height viewport */}
      {bgImage && (
        <Image
          src={bgImage}
          alt="Hero Background"
          fill
          priority
          className={`absolute inset-0 ${objectFitClass} ${objectPosClass} w-full h-full -z-20 pointer-events-none select-none`}
          style={{ opacity: clearView ? 1 : bgOpacity }}
        />
      )}

      {/* Glow accent */}
      {!clearView && (
        <div className="absolute right-0 top-0 w-96 h-96 bg-radial from-[#ff3131]/10 to-transparent pointer-events-none -z-10" />
      )}

      {/* 1st Viewport (Hero Header Content) */}
      <div className={`w-full h-[100dvh] pt-24 pb-12 px-6 md:px-12 flex flex-col relative z-10 ${vAlignmentStyles[vLayout]}`}>
        <div className={`max-w-3xl flex flex-col space-y-4 ${alignmentStyles[layout]} `}>
          {badgeText && <Badge ping>{badgeText}</Badge>}

          <h1 className="font-haas text-2xl md:text-5xl font-bold tracking-tight text-foreground text-glow-blue dark:text-glow-red">
            {title}
          </h1>

          <p className="text-zinc-700 dark:text-zinc-300 text-xs md:text-base max-w-xl leading-relaxed">
            {description}
          </p>

          <div className="pt-4 flex flex-wrap gap-3">
            {ctaHref && ctaText && (
              <Link href={ctaHref}>
                <Button variant="primary">{ctaText}</Button>
              </Link>
            )}
            {secondaryCtaHref && secondaryCtaText && (
              <Link href={secondaryCtaHref}>
                <Button variant="outline">{secondaryCtaText}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2nd Viewport (Content laying over the continuation of the background) */}
      {children && (
        <div className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-start pb-12">
          {children}
        </div>
      )}
    </section>
  );
};
