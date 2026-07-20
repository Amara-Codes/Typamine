"use client";

import React, { useState, useId } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";

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
FontFaceInjector.displayName = "FontFaceInjector";

export interface LivePreviewProps {
  fontName?: string;
  /**
   * Raw CSS `font-family` value to actually render with, when it differs from the
   * display name in `fontName` (e.g. a `var(--font-x)` reference, or a family name
   * that needs its own quoting). Falls back to `fontName` when omitted.
   */
  fontFamilyCss?: string;
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
  /** Reduces chrome (rounding, shadow, padding, height) for tight layouts like grid cards. */
  compact?: boolean;
  /** Opt-in extra controls, off by default so existing usages render unchanged. */
  showTextColorControl?: boolean;
  showBgColorControl?: boolean;
  showLineHeightControl?: boolean;
  showLetterSpacingControl?: boolean;
  initialTextColor?: string;
  initialBgColor?: string;
  initialLineHeight?: number;
  initialLetterSpacing?: number;
}

export default function LivePreview({  
  fontName = "Live Preview",
  fontFamilyCss,
  fontUrl,
  isVariable = false,
  initialText = "AaBbCcDdEeFf 123",
  initialSize = 48,
  initialWeight = 400,
  showToolbar = true,
  showControls = true,
  showBackgroundGlow = true,
  editable = true,
  minSize = 12,
  maxSize = 140,
  className,
  compact = false,
  showTextColorControl = false,
  showBgColorControl = false,
  showLineHeightControl = false,
  showLetterSpacingControl = false,
  initialTextColor,
  initialBgColor,
  initialLineHeight = 1.2,
  initialLetterSpacing = 0,
}: LivePreviewProps) {
  const { theme } = useThemeStore();
  const defaultTextColor = theme === "dark" ? "#F5F6F9" : "#0C0B0A";
  const defaultBgColor = theme === "dark" ? "#0C0B0A" : "#F5F6F9";

  const [text, setText] = useState(initialText);
  const [prevInitialText, setPrevInitialText] = useState(initialText);
  const [size, setSize] = useState(initialSize);
  const [weight, setWeight] = useState(initialWeight);
  const [textColor, setTextColor] = useState(initialTextColor ?? defaultTextColor);
  const [bgColor, setBgColor] = useState(initialBgColor ?? defaultBgColor);

  React.useEffect(() => {
    if (initialTextColor === undefined) {
      setTextColor(theme === "dark" ? "#F5F6F9" : "#0C0B0A");
    }
    if (initialBgColor === undefined) {
      setBgColor(theme === "dark" ? "#0C0B0A" : "#F5F6F9");
    }
  }, [theme, initialTextColor, initialBgColor]);
  const [lineHeight, setLineHeight] = useState(initialLineHeight);
  const [letterSpacing, setLetterSpacing] = useState(initialLetterSpacing);

  // Ordine fisso dei gruppi di controlli, per decidere quale mostra il divisore a destra
  const hasWeightGroup = isVariable;
  const hasTrackingGroup = showLetterSpacingControl;
  const hasLeadingGroup = showLineHeightControl;
  const hasTextColorGroup = showTextColorControl;
  const hasBgColorGroup = showBgColorControl;

  // Tiene il testo allineato se il chiamante aggiorna initialText dopo il primo render
  // (es. più card montate che condividono lo stesso testo di anteprima da un filtro esterno).
  // Aggiornamento durante il render (pattern React consigliato) invece che in un effect,
  // per evitare un render "a cascata" in più.
  if (initialText !== prevInitialText) {
    setPrevInitialText(initialText);
    setText(initialText);
  }

  // Genera un ID univoco per questo componente (fondamentale per evitare conflitti CSS)
  const uniqueId = useId().replace(/:/g, "");
  const dynamicFontFamily = `Preview_${uniqueId}`;



  return (
    <div
      className={cn(
        "relative overflow-hidden border border-zinc-200 dark:border-zinc-900 transition-all duration-700 group",
        !hasBgColorGroup && "bg-white dark:bg-black",
        compact ? "rounded-xl shadow-sm" : "rounded-md shadow-2xl",
        className
      )}
      style={hasBgColorGroup ? { backgroundColor: bgColor } : undefined}
    >

      
      {/* Iniezione locale: attiva solo se abbiamo un URL */}
      {fontUrl && <FontFaceInjector fontFamily={dynamicFontFamily} url={fontUrl} />}

      {showBackgroundGlow && (
        <div className="absolute -inset-32 bg-gradient-to-tr from-blue/10 via-transparent to-blue/5 dark:from-red/10 dark:to-red/5 blur-3xl opacity-50 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>
      )}

      {showToolbar && (
        <div className="relative z-10 p-5 border-b rounded-t-md border-zinc-200 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/80 dark:bg-zinc-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-inner">
              <Type className="w-4 h-4 text-blue dark:text-red" />
            </div>
            <div>
              <h4 className="text-black dark:text-white text-[10px] font-bold uppercase tracking-widest leading-none truncate max-w-[200px]">
                {fontName}
              </h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-wider mt-1 font-semibold">Live Preview</p>
            </div>
          </div>

          {showControls && (
            <div className="flex items-center flex-wrap gap-x-1 gap-y-2 bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-sm">
              <div className={cn("flex items-center gap-2 px-2", (hasWeightGroup || hasTrackingGroup || hasLeadingGroup || hasTextColorGroup || hasBgColorGroup) && "border-r border-zinc-200 dark:border-zinc-800")}>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Size</span>
                <input
                  type="range"
                  min={minSize}
                  max={maxSize}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                />
                <span className="text-[10px] text-black dark:text-white font-bold w-7 text-right">{size}</span>
              </div>

              {hasWeightGroup && (
                <div className={cn("flex items-center gap-2 px-2", (hasTrackingGroup || hasLeadingGroup || hasTextColorGroup || hasBgColorGroup) && "border-r border-zinc-200 dark:border-zinc-800")}>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Weight</span>
                  <input
                    type="range"
                    min="100"
                    max="900"
                    step="100"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                  />
                  <span className="text-[10px] text-black dark:text-white font-bold w-7 text-right">{weight}</span>
                </div>
              )}

              {hasTrackingGroup && (
                <div className={cn("flex items-center gap-2 px-2", (hasLeadingGroup || hasTextColorGroup || hasBgColorGroup) && "border-r border-zinc-200 dark:border-zinc-800")}>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Tracking</span>
                  <input
                    type="range"
                    min={-4}
                    max={12}
                    value={letterSpacing}
                    onChange={(e) => setLetterSpacing(Number(e.target.value))}
                    className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                  />
                  <span className="text-[10px] text-black dark:text-white font-bold w-7 text-right">{letterSpacing}</span>
                </div>
              )}

              {hasLeadingGroup && (
                <div className={cn("flex items-center gap-2 px-2", (hasTextColorGroup || hasBgColorGroup) && "border-r border-zinc-200 dark:border-zinc-800")}>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Leading</span>
                  <input
                    type="range"
                    min={0.8}
                    max={2.2}
                    step={0.05}
                    value={lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                  />
                  <span className="text-[10px] text-black dark:text-white font-bold w-8 text-right">{lineHeight.toFixed(2)}</span>
                </div>
              )}

              {hasTextColorGroup && (
                <div className={cn("flex items-center gap-2 px-2", hasBgColorGroup && "border-r border-zinc-200 dark:border-zinc-800")}>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Text</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    title="Text color"
                    className="h-5 w-5 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent p-0"
                  />
                </div>
              )}

              {hasBgColorGroup && (
                <div className="flex items-center gap-2 px-2">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">BG</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    title="Background color"
                    className="h-5 w-5 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent p-0"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

 <div
   className={cn(
     "relative z-10 flex items-center justify-center overflow-hidden",
     !hasBgColorGroup && "bg-white dark:bg-black",
     compact ? "p-3 h-[110px]" : "p-8 h-[260px]"
   )}
   style={hasBgColorGroup ? { backgroundColor: bgColor } : undefined}
 >
  {/* Effetto Scanlines (Vecchie righette televisore) */}
  {!compact && (
  <div
    className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] dark:opacity-[0.04]"
    style={{
         backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
          backgroundAttachment: 'fixed'
    }}
  />
  )}

  {(() => {
    const previewStyle: React.CSSProperties = {
      fontFamily: fontUrl
        ? `'${dynamicFontFamily}', sans-serif`
        : fontFamilyCss
          ? `${fontFamilyCss}, sans-serif`
          : `'${fontName}', sans-serif`,
      fontSize: `${size}px`,
      fontWeight: isVariable ? weight : initialWeight || 400,
      fontVariationSettings: isVariable ? `'wght' ${weight}` : 'normal',
      lineHeight: hasLeadingGroup ? lineHeight : undefined,
      letterSpacing: hasTrackingGroup ? `${letterSpacing}px` : undefined,
      color: hasTextColorGroup ? textColor : undefined,
    };
    const previewClassName = cn(
      "relative z-10 w-full h-full bg-transparent border-none text-center overflow-hidden",
      !hasLeadingGroup && "leading-tight",
      !hasTextColorGroup && "text-black dark:text-white"
    );

    // Non-editable previews render as plain static text rather than a form
    // control, since LivePreview can end up nested inside a <Link> (e.g. card
    // grids) where an interactive <textarea> would be invalid HTML nesting.
    return editable ? (
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={cn(previewClassName, "resize-none focus:outline-none focus:ring-0")}
        style={previewStyle}
        spellCheck="false"
      />
    ) : (
      <p className={cn(previewClassName, "cursor-default whitespace-pre-wrap")} style={previewStyle}>
        {text}
      </p>
    );
  })()}
</div>
    </div>
  );
}