import React from "react";

export const PrescriptionCardSkeleton: React.FC = () => {
  return (
    <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-between overflow-hidden min-h-[220px] bg-white/50 dark:bg-zinc-950/50 animate-pulse">
      <div className="space-y-4">
        {/* Top Tag Badges */}
        <div className="flex justify-end gap-2 mb-3">
          <div className="h-4 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-2">
          <div className="h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Description & Footer */}
      <div className="mt-8 space-y-3">
        <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center justify-between border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3">
          <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
};

export default PrescriptionCardSkeleton;
