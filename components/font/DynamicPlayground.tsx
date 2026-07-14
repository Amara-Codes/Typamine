import React, { useState } from "react";
import { Input } from "@/components/common/Input";
import { PlaygroundFont } from "@/types";

interface DynamicPlaygroundProps {
  font?: PlaygroundFont;
  hideFontSelector?: boolean;
}

export const DynamicPlayground: React.FC<DynamicPlaygroundProps> = ({ 
  font,
  hideFontSelector = false
}) => {
  // Playground state
  const [testText, setTestText] = useState("");
  const [fontSize, setFontSize] = useState(32);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [fontWeight, setFontWeight] = useState("400");
  const [activeFont, setActiveFont] = useState<PlaygroundFont>(
    font || { name: "Alte Haas Grotesk", fontFamily: "var(--font-haas)" }
  );
  const [activeColor, setActiveColor] = useState("red"); // default to Red (#ff3131)

  return (
    <section className="border border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/60 rounded-lg overflow-hidden transition-colors duration-300">
      
      {/* Header of the Sandbox Panel */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-[#09090b]/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#00cece] glow-cyan" />
          <h2 className="font-haas text-xs font-bold tracking-widest text-[#00cece] uppercase">
            LIVE_SYNTHESIS
          </h2>
        </div>
        
        {/* Active Preset Display */}
        <div className="font-haas text-[10px] text-zinc-500 flex items-center space-x-4">
          <div>COMPOUND: <span className="text-foreground font-bold">
            {activeFont.name}
          </span></div>
          <div>STATUS: <span className="text-blue">STABLE</span></div>
        </div>
      </div>

      {/* Controls Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 border-b border-zinc-200 dark:border-zinc-800">
        
        {/* Parameter Sliders */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 space-y-5 font-haas text-xs text-zinc-500 dark:text-zinc-400">
          
          {/* Font Family Selector */}
          {!hideFontSelector && (
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">01. Font Compound</label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded border border-zinc-200 dark:border-zinc-800">
                <button 
                  id="btn-font-alte"
                  onClick={() => setActiveFont({ name: "Alte Haas Grotesk", fontFamily: "var(--font-haas)" })} 
                  className={`py-1.5 rounded text-[9px] font-bold transition-all ${activeFont.fontFamily === "var(--font-haas)" ? "bg-white dark:bg-zinc-800 text-[#ff3131] border border-zinc-200 dark:border-zinc-700" : "hover:text-foreground"}`}
                >
                  ALTE HAAS
                </button>
                <button 
                  id="btn-font-jakarta"
                  onClick={() => setActiveFont({ name: "Plus Jakarta Sans", fontFamily: "var(--font-jakarta)" })} 
                  className={`py-1.5 rounded text-[9px] font-bold transition-all ${activeFont.fontFamily === "var(--font-jakarta)" ? "bg-white dark:bg-zinc-800 text-[#ff3131] border border-zinc-200 dark:border-zinc-700" : "hover:text-foreground"}`}
                >
                  JAKARTA
                </button>
                <button 
                  id="btn-font-star"
                  onClick={() => setActiveFont({ name: "Star Avenue", fontFamily: "var(--font-star)" })} 
                  className={`py-1.5 rounded text-[9px] font-bold transition-all ${activeFont.fontFamily === "var(--font-star)" ? "bg-white dark:bg-zinc-800 text-[#ff3131] border border-zinc-200 dark:border-zinc-700" : "hover:text-foreground"}`}
                >
                  STAR AVE
                </button>
              </div>
            </div>
          )}

          {/* Slider: Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400 dark:text-zinc-500 uppercase">02. Font Size</span>
              <span className="text-blue font-bold">{fontSize}px</span>
            </div>
            <input 
              id="slider-font-size"
              type="range" 
              min="16" 
              max="80" 
              value={fontSize} 
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Slider: Letter Spacing */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400 dark:text-zinc-500 uppercase">03. Tracking</span>
              <span className="text-blue font-bold">{letterSpacing}px</span>
            </div>
            <input 
              id="slider-tracking"
              type="range" 
              min="-4" 
              max="12" 
              value={letterSpacing} 
              onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Selector: Weight */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">04. Font Weight</label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded border border-zinc-200 dark:border-zinc-800">
              {["300", "400", "700"].map((w) => (
                <button
                  id={`btn-weight-${w}`}
                  key={w}
                  onClick={() => setFontWeight(w)}
                  className={`py-1 rounded text-[10px] transition-colors ${fontWeight === w ? "bg-white dark:bg-zinc-800 text-blue" : "hover:text-foreground"}`}
                >
                  {w === "300" ? "LIGHT" : w === "400" ? "REG" : "BOLD"}
                </button>
              ))}
            </div>
          </div>

          {/* Laser Color Filter */}
          <div className="space-y-2 mt-4">
            <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">05. Color</label>
            <div className="flex space-x-2">
              <button
                id="btn-color-cyan"
                onClick={() => setActiveColor("cyan")}
                className={`w-5 h-5 rounded-full bg-blue border-2 transition-transform ${activeColor === "cyan" ? "border-white dark:border-zinc-900 scale-110 glow-cyan" : "border-transparent"}`}
              />
              <button
                id="btn-color-red"
                onClick={() => setActiveColor("red")}
                className={`w-5 h-5 rounded-full bg-[#ff3131] border-2 transition-transform ${activeColor === "red" ? "border-white dark:border-zinc-900 scale-110 glow-red" : "border-transparent"}`}
              />
            </div>
          </div>

        </div>

        {/* Interactive Live Screen */}
        <div className="lg:col-span-3 p-6 flex flex-col justify-between bg-zinc-50/50 dark:bg-zinc-950/20 relative min-h-[260px] transition-colors duration-300">
          {/* Scientific details */}
          <div className="absolute top-2 right-6 text-[9px] font-haas text-zinc-400 dark:text-zinc-600 select-none">
            MONITORING ENGINES: ACTIVE // SYSTEM: STABLE // SCALE: 1.0X
          </div>

          {/* Custom Input for live playground */}
          <div className="w-full">
            <Input
              id="sandbox-input-text"
              label="Interactive Formula"
              codePrefix="🧪"
              value={testText}
              onChange={setTestText}
              placeholder="Type dynamic string here..."
            />
          </div>

          {/* Main Interactive Output Display */}
          <div
            className="w-full py-8 text-center break-words select-all transition-all"
            style={{
              fontSize: `${fontSize}px`,
              letterSpacing: `${letterSpacing}px`,
              fontWeight: fontWeight,
              fontFamily: activeFont.fontFamily,
              color: activeColor === "cyan" ? "#00cece" : "#ff3131",
              textShadow: activeColor === "cyan" ? "0 0 10px rgba(0, 206, 206, 0.2)" : "0 0 10px rgba(255, 49, 49, 0.2)",
            }}
          >
            {testText || "EMPTY_CELL_INPUT"}
          </div>

          {/* Footer metrics bar inside output panel */}
          <div className="border-t border-zinc-200 dark:border-zinc-900 pt-4 flex flex-wrap justify-end items-center text-[9px] font-haas text-zinc-500 gap-2">
            <div className="text-zinc-400 truncate max-w-md">RAW_STYLE: <span>font-family: {activeFont.fontFamily}; font-size: {fontSize}px; letter-spacing: {letterSpacing}px;</span></div>
          </div>

        </div>
      </div>
    </section>
  );
};