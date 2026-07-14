"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PrescriptionDetailPage() {
  const params = useParams();
  const slug = params?.slug as string || "unknown";

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      <div>
        <Link 
          href="/prescriptions" 
          className="font-haas text-xs text-zinc-500 hover:text-[#00cece] transition-colors"
        >
          &lt;&lt; BACK_TO_PRESCRIPTIONS.cfg
        </Link>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg space-y-4">
        <span className="font-haas text-[9px] bg-[#ff3131]/10 text-[#ff3131] border border-[#ff3131]/20 px-2 py-0.5 rounded">
          PAIRING_PRESCRIPTION
        </span>
        <h1 className="font-haas text-2xl font-bold uppercase text-zinc-100 mt-2">
          DOSE: {slug}
        </h1>
        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
          Visual test for pairing dose {slug}. Synthesized using high-contrast spacing metrics.
        </p>
      </div>

      {/* Showcase area */}
      <div className="border border-zinc-800 bg-zinc-950/60 rounded-lg p-8 text-center space-y-6">
        <h2 className="text-4xl font-bold font-jakarta text-zinc-100 leading-tight">
          Headings Should Command Attention
        </h2>
        <p className="max-w-md mx-auto text-sm text-zinc-400 leading-relaxed font-haas">
          Monospaced subtext should sit underneath with rigorous spacing, supporting metadata, and technical markers.
        </p>
      </div>
    </div>
  );
}
