"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { dynamicTextStyle } from "@/lib/dynamicStyle";
import { FONT_FAMILIES } from "@/components/admin/common/content-modules/shared";
import { Button } from "@/components/common/Button";

const FONT_FAMILIES_MAP: Record<string, string> = Object.fromEntries(
  FONT_FAMILIES.map((f) => [f.id, f.class])
);

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "outline" | "ghost" | "glass";

interface ActionCtaProps {
  title?: string;
  paragraph?: string;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  titleColorClassName?: string;
  paragraphColorClassName?: string;
  fontFamily?: string;
  buttonOneLabel?: string;
  buttonOneLink?: string;
  buttonOneVariant?: ButtonVariant;
  buttonOneIsExternal?: boolean;
  buttonTwoLabel?: string;
  buttonTwoLink?: string;
  buttonTwoVariant?: ButtonVariant;
  buttonTwoIsExternal?: boolean;
  className?: string;
}

// Non è components/common/Cta.tsx (quello è la CTA a sezione intera usata a
// fine pagina) — questo è il content-module "Action CTA" editabile in admin.
export default function ActionCta({
  title,
  paragraph,
  imageSrc,
  imageAlt,
  imagePosition = "right",
  titleColorClassName,
  paragraphColorClassName,
  fontFamily,
  buttonOneLabel,
  buttonOneLink,
  buttonOneVariant,
  buttonOneIsExternal,
  buttonTwoLabel,
  buttonTwoLink,
  buttonTwoVariant,
  buttonTwoIsExternal,
  className,
}: ActionCtaProps) {
  const imageOnRight = imagePosition !== "left";

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 md:p-12", FONT_FAMILIES_MAP[fontFamily || ""], className)}>
      <div className={cn("space-y-4", imageOnRight ? "md:order-1" : "md:order-2")}>
        {title && (
          <h3 className="font-rezland text-3xl dyn-text" style={dynamicTextStyle(titleColorClassName)}>{title}</h3>
        )}
        {paragraph && (
          <p className="text-sm sm:text-base dyn-text" style={dynamicTextStyle(paragraphColorClassName)}>{paragraph}</p>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          {buttonOneLabel && (
            <Link href={(buttonOneLink || "/") as any} target={buttonOneIsExternal ? "_blank" : undefined}>
              <Button variant={buttonOneVariant || "primary"}>{buttonOneLabel}</Button>
            </Link>
          )}
          {buttonTwoLabel && (
            <Link href={(buttonTwoLink || "/") as any} target={buttonTwoIsExternal ? "_blank" : undefined}>
              <Button variant={buttonTwoVariant || "secondary"}>{buttonTwoLabel}</Button>
            </Link>
          )}
        </div>
      </div>
      <div className={cn("relative min-h-[220px] rounded-lg overflow-hidden", imageOnRight ? "md:order-2" : "md:order-1")}>
        {imageSrc && <Image src={imageSrc} alt={imageAlt || ""} fill className="object-cover" />}
      </div>
    </div>
  );
}
