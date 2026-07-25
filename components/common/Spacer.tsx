"use client";

import { cn } from "@/lib/utils";
import { dynamicBgStyle } from "@/lib/dynamicStyle";

const SPACER_HEIGHT_MAP: Record<string, string> = {
  xs: "h-4", sm: "h-8", md: "h-16", lg: "h-24", xl: "h-32", "2xl": "h-48",
  "10vh": "h-[10vh]", "20vh": "h-[20vh]",
};

interface SpacerProps {
  height?: string;
  type?: "spacer" | "divider";
  lineColorClassName?: string;
  lineHeight?: string | number;
  lineWidth?: string;
  className?: string;
}

export default function Spacer({
  height = "md",
  type = "spacer",
  lineColorClassName,
  lineHeight = 1,
  lineWidth = "100%",
  className,
}: SpacerProps) {
  if (type === "divider") {
    return (
      <div className={cn("flex justify-center py-4", className)}>
        <div
          className="dyn-bg"
          style={{
            width: lineWidth,
            height: `${lineHeight}px`,
            ...dynamicBgStyle(lineColorClassName || "bg-black/20 dark:bg-white/20"),
          }}
        />
      </div>
    );
  }
  return <div className={cn(SPACER_HEIGHT_MAP[height] || "h-16", className)} />;
}
