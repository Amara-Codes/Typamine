"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { dynamicTextStyle, dynamicBgStyle } from "@/lib/dynamicStyle";
import { FONT_FAMILIES } from "@/components/admin/common/content-modules/shared";

const FONT_FAMILIES_MAP: Record<string, string> = Object.fromEntries(
  FONT_FAMILIES.map((f) => [f.id, f.class])
);

interface SimpleHeroProps {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
  align?: "left" | "center" | "right";
  vAlign?: "top" | "center" | "bottom";
  titleColorClassName?: string;
  titleFontFamily?: string;
  subtitleColorClassName?: string;
  subtitleFontFamily?: string;
  overlayColorClassName?: string;
  className?: string;
}

const ALIGN_MAP: Record<string, string> = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" };
const V_ALIGN_MAP: Record<string, string> = { top: "justify-start", center: "justify-center", bottom: "justify-end" };

export default function SimpleHero({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  align = "center",
  vAlign = "center",
  titleColorClassName,
  titleFontFamily,
  subtitleColorClassName,
  subtitleFontFamily,
  overlayColorClassName,
  className,
}: SimpleHeroProps) {
  return (
    <div className={cn("relative overflow-hidden min-h-[100dvh] flex", className)}>
      {imageSrc && <Image src={imageSrc} alt={imageAlt || ""} fill className="object-cover -z-10" />}
      <div className="absolute inset-0 -z-10 dyn-bg" style={dynamicBgStyle(overlayColorClassName)} />
      <div className={cn("relative z-10 flex flex-col gap-3 p-8 sm:p-16 w-full", ALIGN_MAP[align] || ALIGN_MAP.center, V_ALIGN_MAP[vAlign] || V_ALIGN_MAP.center)}>
        {title && (
          <h2 className={cn("font-star text-4xl sm:text-5xl dyn-text", FONT_FAMILIES_MAP[titleFontFamily || ""])} style={dynamicTextStyle(titleColorClassName)}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className={cn("text-base sm:text-lg dyn-text", FONT_FAMILIES_MAP[subtitleFontFamily || ""])} style={dynamicTextStyle(subtitleColorClassName)}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
