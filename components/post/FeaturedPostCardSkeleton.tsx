import React from "react";

export const FeaturedPostCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 min-h-[320px] animate-pulse flex flex-col md:flex-row md:justify-between">
      <div className="flex flex-col justify-end gap-4 p-6 sm:p-10 max-w-2xl">
        <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex flex-wrap gap-2">
          <div className="h-5 w-16 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-20 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-14 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-2.5 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="p-6 sm:p-10 flex justify-end items-end">
        <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
};

export default FeaturedPostCardSkeleton;
