import React from "react";

// Stessa struttura/dimensioni di FormulaCard, per evitare che il layout
// "salti" quando i dati reali arrivano dopo il loader.
export const FormulaCardSkeleton: React.FC = () => {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950 p-4 rounded-lg flex flex-col sm:flex-row sm:items-stretch justify-between gap-4 animate-pulse">
      <div className="space-y-2 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-3.5 w-full max-w-md rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3.5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 mt-2" />
      </div>

      <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-end gap-2 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800 pt-2 sm:pt-0.5 sm:pb-1">
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
};

export default FormulaCardSkeleton;
