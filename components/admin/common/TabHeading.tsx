import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import Link from "next/link";

interface TabHeadingProps {
  title: string;
  subtitle?: string;
  buttonHref?: string;
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  showButton?: boolean;
}

export default function TabHeading({
  title,
  subtitle,
  buttonHref,
  buttonLabel,
  buttonIcon = <Plus className="h-5 w-5" />,
  showButton = true,
}: TabHeadingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2 pb-4">
      <div className="space-y-2 ps-4">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-star text-zinc-900 dark:text-white tracking-tight leading-none">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-200 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {showButton && buttonHref && buttonLabel && (
        <Link href={buttonHref}>
          <Button
            variant="secondary"
            size="md"
            roundness="xl"
            className="shrink-0 sm:self-center self-start shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {buttonIcon}
            {buttonLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
