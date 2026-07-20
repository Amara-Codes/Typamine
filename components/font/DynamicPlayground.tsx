import React, { useState } from "react";
import LivePreview from "@/components/common/LivePreview";
import { PlaygroundFont } from "@/types";
import { cn } from "@/lib/utils";

interface DynamicPlaygroundProps {
  font?: PlaygroundFont;
  hideFontSelector?: boolean;
}

export const DynamicPlayground: React.FC<DynamicPlaygroundProps> = ({
  font,
  hideFontSelector = false
}) => {
  const [activeFont, setActiveFont] = useState<PlaygroundFont>(
    font || { name: "Alte Haas Grotesk", fontFamily: "var(--font-haas)" }
  );

  return (
    <section className="border border-zinc-200 dark:border-zinc-800 bg-ocragray-100 dark:bg-ocragray-900 rounded-lg overflow-hidden transition-colors duration-300">

      {/* Header of the Sandbox Panel */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <h2 className="font-haas text-xs font-bold tracking-widest text-blue uppercase">
            Live Experiment
          </h2>


        {/* Active Preset Display */}
        <div className="font-haas text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center space-x-4">
          <div>COMPOUND: <span className="text-foreground font-bold">
            {activeFont.name}
          </span></div>
          <div>STATUS: <span className="text-blue">STABLE</span></div>
        </div>
      </div>

      {/* Content Layout */}
      <div className={cn("grid grid-cols-1", !hideFontSelector && "lg:grid-cols-4")}>

        {/* Font Family Selector */}
        {!hideFontSelector && (
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 space-y-2 font-haas text-xs text-zinc-500 dark:text-zinc-400">
            <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Font Compound</label>
            <div className="grid grid-cols-1 gap-1 bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded border border-zinc-200 dark:border-zinc-800">
              <button
                id="btn-font-alte"
                onClick={() => setActiveFont({ name: "Alte Haas Grotesk", fontFamily: "var(--font-haas)" })}
                className={`py-1.5 rounded text-[10px] font-bold transition-all ${activeFont.name === "Alte Haas Grotesk" ? "bg-white dark:bg-zinc-800 text-red border border-zinc-200 dark:border-zinc-700" : "hover:text-foreground"}`}
              >
                ALTE HAAS
              </button>
              <button
                id="btn-font-jakarta"
                onClick={() => setActiveFont({ name: "Plus Jakarta Sans", fontFamily: "var(--font-jakarta)" })}
                className={`py-1.5 rounded text-[10px] font-bold transition-all ${activeFont.name === "Plus Jakarta Sans" ? "bg-white dark:bg-zinc-800 text-red border border-zinc-200 dark:border-zinc-700" : "hover:text-foreground"}`}
              >
                JAKARTA
              </button>
              <button
                id="btn-font-star"
                onClick={() => setActiveFont({ name: "Star Avenue", fontFamily: "var(--font-star)" })}
                className={`py-1.5 rounded text-[10px] font-bold transition-all ${activeFont.name === "Star Avenue" ? "bg-white dark:bg-zinc-800 text-red border border-zinc-200 dark:border-zinc-700" : "hover:text-foreground"}`}
              >
                STAR AVE
              </button>
            </div>
          </div>
        )}

        {/* Interactive Live Preview */}
        <div className={cn(!hideFontSelector && "lg:col-span-3", "p-6")}>
          <LivePreview
            fontName={activeFont.name}
            fontFamilyCss={activeFont.fontFamily}
            fontUrl={activeFont.fontUrl}
            initialSize={48}
            minSize={16}
            maxSize={120}
            isVariable
            showTextColorControl
            showBgColorControl
            showLineHeightControl
            showLetterSpacingControl
          />
        </div>
      </div>
    </section>
  );
};
