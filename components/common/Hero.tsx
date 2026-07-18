import React from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import Link from "next/link";
import Image from "next/image";
 
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
  layout?: "contentCenter" | "contentLeft" | "contentRight";
  fullWidth?: boolean;
}
 
export const Hero: React.FC<HeroProps> = ({
  badgeText,
  title,
  description,
  ctaText = "[LAUNCH ARCHIVE]",
  ctaHref = "/ingredients",
  secondaryCtaText = "[DEV TOOLS]",
  secondaryCtaHref = "/labs",
  bgImage,
  bgOpacity = 0.8,
  layout = "contentCenter",
  fullWidth = false,
}) => {
  // Mapping for layout alignments
  const alignmentStyles = {
    contentLeft: "text-left items-start mr-auto",
    contentCenter: "text-center items-center mx-auto",
    contentRight: "text-right items-end ml-auto",
  };
 
  const containerStyles = fullWidth
    ? "w-full h-[100dvh] border-0 bg-white/70 dark:bg-black/70 rounded-none pt-16 pb-6 px-6 md:px-12 relative overflow-hidden transition-colors duration-300 flex flex-col justify-center"
    : "w-full aspect-video border border-zinc-300 dark:border-zinc-800 bg-white/70 dark:bg-black/70 rounded-lg p-6 md:p-8 relative overflow-hidden transition-colors duration-300 flex flex-col justify-center";
 
  return (
    <section className={containerStyles}>
      {/* Optional Background Image */}
      {bgImage && (
        <Image
          src={bgImage}
          alt="Hero Background"
          fill
          priority
          className={`absolute inset-0 object-cover w-full h-full -z-20 pointer-events-none select-none`} style={{ opacity: bgOpacity }}
        />
      )}
      
      {/* Glow accent */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-radial from-[#ff3131]/10 to-transparent pointer-events-none -z-10" />
 
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
