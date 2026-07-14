"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PillDetailPage() {
  const params = useParams();
  const slug = params?.slug as string || "unknown";

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      <div>
        <Link 
          href="/pills" 
          className="font-haas text-xs text-zinc-500 hover:text-[#00cece] transition-colors"
        >
          &lt;&lt; BACK_TO_PILLS.cfg
        </Link>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg space-y-4">
        <span className="font-haas text-[9px] bg-[#ff3131]/10 text-[#ff3131] border border-[#ff3131]/20 px-2 py-0.5 rounded">
          DIAGNOSIS_CASE_REPORT
        </span>
        <h1 className="font-haas text-2xl font-bold uppercase text-zinc-100 mt-2">
          CASE: {slug.replace(/-/g, "_")}
        </h1>
        <div className="flex justify-between font-haas text-[10px] text-zinc-500">
          <span>CLASSIFICATION: TECHNICAL_EVALUATION</span>
          <span>DATE: 2026-07-12</span>
        </div>
      </div>

      {/* Case analysis content */}
      <article className="border border-zinc-800 bg-zinc-950/40 rounded-lg p-6 font-haas text-xs text-zinc-400 space-y-4 leading-relaxed">
        <h3 className="font-bold text-[#00cece]">1. EXECUTIVE_SUMMARY:</h3>
        <p>
          Initial testing of custom compound {slug} indicates potential latency on Edge runtime execution without R2-cached object buffers. Optimization protocols have been loaded.
        </p>

        <h3 className="font-bold text-[#00cece]">2. RESEARCH_METHODOLOGY:</h3>
        <p>
          Subject fonts were decompressed and tested across a range of layout densities. Intersections between high font weights and tight tracking showed elevated levels of design fatigue. Recommended prescription is to inject a 4px tracking offset.
        </p>
      </article>
    </div>
  );
}
