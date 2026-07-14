"use client";

import React, { useState } from "react";
import { PageHeading } from "@/components/common/PageHeading";
import { useThemeStore } from "@/store/themeStore";

export default function LabsPage() {
  const { theme } = useThemeStore();
  const [fontFamily, setFontFamily] = useState("Geist-Mono");
  const [format, setFormat] = useState("woff2");

  const fontFaceCode = `@font-face {
  font-family: '${fontFamily}';
  src: url('/fonts/${fontFamily.toLowerCase()}.${format}') format('${format}');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}`;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      {/* Route Header */}
      <PageHeading 
        title="LABS_BENCH // Tools designed for Creatives and Developers"
        subtitle="Technical utilities to process, package, and optimize font assets for integration into modern web apps."
        useGrainient
        grainientOptions={{
          color1: theme === "light" ? "#fdfdfd" : "#09090b",
          color2: theme === "light" ? "#c0d3ed" : "#570d22",
          color3: theme === "light" ? "#e5e7eb" : "#27272a",
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tool 1: @font-face generator */}
        <div className="border border-zinc-800 bg-zinc-950/60 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#ff3131] glow-red" />
            <h2 className="font-haas text-sm font-bold text-zinc-200">@font-face Generator</h2>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">
            Generate clean CSS declarations for your assets hosted on Cloudflare R2 object storage.
          </p>

          <div className="space-y-3 font-haas text-xs">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[9px] uppercase">Font Family Name</span>
              <input
                id="labs-input-font-name"
                type="text"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 outline-none focus:border-[#00cece] text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 text-[9px] uppercase">Asset Format</span>
              <div className="flex space-x-2">
                {["woff2", "ttf", "woff"].map((fmt) => (
                  <button
                    id={`labs-btn-format-${fmt}`}
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-3 py-1 border border-zinc-800 rounded text-[10px] transition-colors ${format === fmt ? "bg-zinc-800 text-[#00cece]" : "hover:bg-zinc-900 text-zinc-400"}`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <span className="font-haas text-[9px] text-zinc-500 uppercase block mb-1">Generated Output</span>
            <pre className="bg-zinc-900/80 border border-zinc-800 rounded p-4 font-haas text-[10px] text-emerald-400 overflow-x-auto select-all">
              {fontFaceCode}
            </pre>
          </div>
        </div>

        {/* Tool 2: Synthesizer Conversion Logs */}
        <div className="border border-zinc-800 bg-zinc-950/60 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00cece] glow-cyan" />
            <h2 className="font-haas text-sm font-bold text-zinc-200">Asset File Synthesizer (TTF to WOFF2)</h2>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">
            Drag and drop custom font files to compress them directly in-browser using WebAssembly compressors.
          </p>

          <div className="border-2 border-dashed border-zinc-800 rounded-lg py-12 text-center bg-zinc-900/20 hover:border-zinc-700 transition-colors cursor-pointer">
            <span className="font-haas text-xs text-zinc-500">
              DRAG_FONT_ASSET_HERE.ttf // MAX_SIZE: 5MB
            </span>
          </div>

          <div className="text-[10px] font-haas text-zinc-500 flex justify-between">
            <span>COMPRESSOR: BROTLI_v1.1</span>
            <span>STATUS: IDLE</span>
          </div>
        </div>
      </div>
      <p className="font-star text-4xl">Strumenti: genera la font face, converti i font formato, da ttf a tutto il resto con fallback su fontface, generatore di palette basato su colore preferito, test contrasto colore.  cta importanza contrasto articolo blog</p>
    </div>
  );
}
