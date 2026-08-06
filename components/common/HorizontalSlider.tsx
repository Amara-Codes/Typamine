"use client";

import { cn } from "@/lib/utils";
import { dynamicTextStyle, dynamicBgStyle } from "@/lib/dynamicStyle";

interface HorizontalSliderItem {
  id: string;
  title: string;
  description?: string;
}

interface HorizontalSliderProps {
  title?: string;
  subtitle?: string;
  titleColorClassName?: string;
  subtitleColorClassName?: string;
  bgColorClassName?: string;
  cardColorClassName?: string;
  items?: HorizontalSliderItem[];
  className?: string;
}

export default function HorizontalSlider({
  title,
  subtitle,
  titleColorClassName,
  subtitleColorClassName,
  bgColorClassName,
  cardColorClassName,
  items = [],
  className,
}: HorizontalSliderProps) {
  return (
    <div className={cn("py-8 dyn-bg", className)} style={dynamicBgStyle(bgColorClassName)}>
      {(title || subtitle) && (
        <div className="px-6 md:px-12 mb-6 space-y-1">
          {title && (
            <h3 className="font-rezland text-2xl dyn-text" style={dynamicTextStyle(titleColorClassName)}>{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm dyn-text" style={dynamicTextStyle(subtitleColorClassName)}>{subtitle}</p>
          )}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto px-6 md:px-12 pb-2 snap-x">
        {items.map((item) => (
          <div
            key={item.id}
            className="shrink-0 w-64 rounded-lg border border-black/10 dark:border-white/10 p-5 snap-start dyn-bg"
            style={dynamicBgStyle(cardColorClassName)}
          >
            <h4 className="font-haas font-bold text-base mb-2">{item.title}</h4>
            {item.description && <p className="text-sm opacity-80">{item.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
