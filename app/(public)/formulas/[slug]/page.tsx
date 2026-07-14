"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function FormulaDetailPage() {
  const params = useParams();
  const slug = params?.slug as string || "unknown";

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      <div>
        <Link 
          href="/formulas" 
          className="font-haas text-xs text-zinc-500 hover:text-[#00cece] transition-colors"
        >
          &lt;&lt; BACK_TO_FORMULAS_INDEX
        </Link>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg space-y-4">
        <span className="font-haas text-[9px] bg-[#00cece]/10 text-[#00cece] border border-[#00cece]/20 px-2 py-0.5 rounded">
          FORMULA_REPORT
        </span>
        <h1 className="font-haas text-2xl font-bold uppercase text-zinc-100 mt-2">
          FORMULA: {slug}
        </h1>
        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
          This report contains technical evaluation details of compound bundle {slug}. Testing demonstrates low cognitive strain and high layout consistency under dynamic edge rendering conditions.
        </p>
      </div>

      {/* Visual combination showcase */}
      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg space-y-6">
        <h3 className="font-haas text-xs font-bold text-[#ff3131]">VISUAL_SYNTHESIS_PREVIEW:</h3>
        
        <div className="space-y-4 border-l border-zinc-800 pl-4 py-2">
          <div className="space-y-1">
            <span className="font-haas text-[9px] text-zinc-500 uppercase">Primary Title (Inter)</span>
            <h2 className="text-2xl font-bold font-jakarta text-zinc-100">
              The quick brown fox jumps over the lazy dog.
            </h2>
          </div>

          <div className="space-y-1">
            <span className="font-haas text-[9px] text-zinc-500 uppercase">Supporting Details (Geist Mono)</span>
            <p className="text-sm font-haas text-zinc-300">
              0123456789 // status: correct // opacity: 0.85
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
