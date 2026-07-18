"use client";

import React, { useState, useId } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Iniettore di font sicuro: usa i children per evitare XSS.
 * React esegue automaticamente l'escaping dei contenuti inseriti tra i tag <style>.
 */
const FontFaceInjector = React.memo(({ fontFamily, url }: { fontFamily: string; url: string }) => {
  if (!url) return null;
  // Aggiungiamo un ID al tag style basato sull'URL per evitare duplicazioni
  const styleId = `font-${btoa(url).slice(0, 16)}`;
  
  return (
    <style id={styleId}>
      {`
        @font-face {
          font-family: '${fontFamily}';
          src: url('${url}') format('woff2');
          font-display: swap;
        }
      `}
    </style>
  );
});

export interface LivePreviewProps {
  fontName?: string;
  fontUrl?: string;
  isVariable?: boolean;
  initialText?: string;
  initialSize?: number;
  initialWeight?: number;
  showToolbar?: boolean;
  showControls?: boolean;
  showBackgroundGlow?: boolean;
  editable?: boolean;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

export default function LivePreview({
  fontName = "Live Preview",
  fontUrl,
  isVariable = false,
  initialText = "Sphinx of black quartz, judge my vow.",
  initialSize = 48,
  initialWeight = 400,
  showToolbar = true,
  showControls = true,
  showBackgroundGlow = true,
  editable = true,
  minSize = 12,
  maxSize = 140,
  className,
}: LivePreviewProps) {
  const [text, setText] = useState(initialText);
  const [size, setSize] = useState(initialSize);
  const [weight, setWeight] = useState(initialWeight);

  // Genera un ID univoco per questo componente (fondamentale per evitare conflitti CSS)
  const uniqueId = useId().replace(/:/g, "");
  const dynamicFontFamily = `Preview_${uniqueId}`;
console.log(fontUrl, '-----', dynamicFontFamily, '----------')
  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 shadow-2xl transition-all duration-700 group",
      className
    )}>

      
      {/* Iniezione locale: attiva solo se abbiamo un URL */}
      {fontUrl && <FontFaceInjector fontFamily={dynamicFontFamily} url={fontUrl} />}

      {showBackgroundGlow && (
        <div className="absolute -inset-32 bg-gradient-to-tr from-blue/10 via-transparent to-blue/5 dark:from-red/10 dark:to-red/5 blur-3xl opacity-50 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>
      )}

      {showToolbar && (
        <div className="relative z-10 p-5 border-b border-zinc-200 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/80 dark:bg-zinc-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-inner">
              <Type className="w-4 h-4 text-blue dark:text-red" />
            </div>
            <div>
              <h4 className="text-zinc-900 dark:text-white text-[10px] font-bold uppercase tracking-widest leading-none truncate max-w-[200px]">
                {fontName}
              </h4>
              <p className="text-zinc-500 text-[9px] uppercase tracking-wider mt-1 font-semibold">Live Preview</p>
            </div>
          </div>

          {showControls && (
            <div className="flex items-center gap-4 bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-sm">
              <div className={cn("flex items-center gap-2 px-2", isVariable && "border-r border-zinc-200 dark:border-zinc-800")}>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Size</span>
                <input
                  type="range"
                  min={minSize}
                  max={maxSize}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                />
                <span className="text-[10px] text-zinc-900 dark:text-zinc-300 font-bold w-7 text-right">{size}</span>
              </div>
              
              {isVariable && (
                <div className="flex items-center gap-2 pl-1 pr-2">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Weight</span>
                  <input
                    type="range"
                    min="100"
                    max="900"
                    step="100"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                  />
                  <span className="text-[10px] text-zinc-900 dark:text-zinc-300 font-bold w-7 text-right">{weight}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

 <div className="relative z-10 p-8 h-[260px] flex items-center justify-center bg-white dark:bg-black overflow-hidden">
  {/* Effetto Scanlines (Vecchie righette televisore) */}
  <div 
    className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] dark:opacity-[0.04]"
    style={{
         backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
          backgroundAttachment: 'fixed'
    }}
  />

  <textarea
    value={text}
    onChange={(e) => setText(e.target.value)}
    readOnly={!editable}
    className={cn(
      "relative z-10 w-full h-full bg-transparent border-none text-black dark:text-white text-center resize-none focus:outline-none focus:ring-0 leading-tight placeholder-zinc-300 dark:placeholder-zinc-800 overflow-hidden",
      !editable && "cursor-default"
    )}
    style={{
      fontFamily: fontUrl ? `'${dynamicFontFamily}', sans-serif` : `'${fontName}', sans-serif`,
      fontSize: `${size}px`,
      fontWeight: isVariable ? weight : initialWeight || 400,
      fontVariationSettings: isVariable ? `'wght' ${weight}` : 'normal',
    }}
    spellCheck="false"
  />
</div>
    </div>
  );
}