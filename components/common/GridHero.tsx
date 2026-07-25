"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { dynamicTextStyle, dynamicBgStyle } from "@/lib/dynamicStyle";
import { FONT_FAMILIES } from "@/components/admin/common/content-modules/shared";
import { Button } from "@/components/common/Button";

const FONT_FAMILIES_MAP: Record<string, string> = Object.fromEntries(
  FONT_FAMILIES.map((f) => [f.id, f.class])
);

interface GridHeroProps {
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  topTitle?: string;
  topSubtitle?: string;
  topBgColorClassName?: string;
  topTitleColorClassName?: string;
  topTitleFontFamily?: string;
  topSubtitleColorClassName?: string;
  topSubtitleFontFamily?: string;
  bottomParagraph?: string;
  bottomBgColorClassName?: string;
  bottomParagraphColorClassName?: string;
  bottomFontFamily?: string;
  hasButton?: boolean;
  buttonLabel?: string;
  buttonHref?: string;
  buttonVariant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
}

export default function GridHero({
  imageSrc,
  imageAlt,
  imagePosition = "left",
  topTitle,
  topSubtitle,
  topBgColorClassName,
  topTitleColorClassName,
  topTitleFontFamily,
  topSubtitleColorClassName,
  topSubtitleFontFamily,
  bottomParagraph,
  bottomBgColorClassName,
  bottomParagraphColorClassName,
  bottomFontFamily,
  hasButton,
  buttonLabel,
  buttonHref,
  buttonVariant,
  className,
}: GridHeroProps) {
  const imageOnRight = imagePosition === "right";

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden min-h-[100dvh]", imageOnRight && "md:[direction:rtl]", className)}>
      <div className="relative min-h-[50vh] md:min-h-0 h-full md:[direction:ltr]">
        {imageSrc && <Image src={imageSrc} alt={imageAlt || ""} fill className="object-cover" />}
      </div>
      <div className="flex flex-col h-full md:[direction:ltr]">
        <div className="flex-1 flex flex-col justify-center gap-2 p-8 dyn-bg" style={dynamicBgStyle(topBgColorClassName)}>
          {topTitle && (
            <h3 className={cn("font-star text-2xl sm:text-3xl dyn-text", FONT_FAMILIES_MAP[topTitleFontFamily || ""])} style={dynamicTextStyle(topTitleColorClassName)}>
              {topTitle}
            </h3>
          )}
          {topSubtitle && (
            <p className={cn("text-sm sm:text-base dyn-text", FONT_FAMILIES_MAP[topSubtitleFontFamily || ""])} style={dynamicTextStyle(topSubtitleColorClassName)}>
              {topSubtitle}
            </p>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center gap-4 p-8 dyn-bg" style={dynamicBgStyle(bottomBgColorClassName)}>
          {bottomParagraph && (
            <p className={cn("text-sm sm:text-base dyn-text", FONT_FAMILIES_MAP[bottomFontFamily || ""])} style={dynamicTextStyle(bottomParagraphColorClassName)}>
              {bottomParagraph}
            </p>
          )}
          {hasButton && buttonLabel && (
            <Link href={(buttonHref || "/") as any} className="self-start">
              <Button variant={buttonVariant || "primary"}>{buttonLabel}</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
