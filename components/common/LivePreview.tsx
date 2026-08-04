"use client";

import React, { useState, useId } from "react";
import { Type, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
import HexColorPickerPopover from "@/components/common/HexColorPickerPopover";
import BaseModal from "@/components/common/BaseModal";

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
  /** Su mobile mostra un pulsante "Customize" che apre i controlli in una modale, invece del toolbar inline. Su desktop il comportamento resta invariato. */
  mobileControlsInModal?: boolean;
  rounded?: boolean;
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
  mobileControlsInModal = false,
  rounded = true,
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
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);

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
        "relative lg:mx-1 overflow-hidden border border-zinc-200 dark:border-zinc-900 transition-all duration-700 group",
        !hasBgColorGroup && "bg-white dark:bg-black",
        compact ? "shadow-sm" : "shadow-2xl",
        rounded ? "rounded-md" : "",
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
        <div className={cn(
          "relative z-10 p-5 border-b border-zinc-200 dark:border-zinc-900 flex flex-wrap items-center justify-center gap-4 bg-zinc-50/80 dark:bg-zinc-950/50 backdrop-blur-md",
          rounded ? " rounded-t-md" : ""
        )}>
          {showControls && (() => {
            const mobileControlsGroups = (
              <div className="flex flex-col gap-3.5 w-full">
                {/* Size */}
                <div className="flex flex-col gap-2 w-full p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Size</span>
                    <span className="text-xs text-black dark:text-white font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-700 min-w-[36px] text-center shadow-xs">{size}px</span>
                  </div>
                  <input
                    type="range"
                    min={minSize}
                    max={maxSize}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red touch-pan-x"
                  />
                </div>

                {/* Weight */}
                {hasWeightGroup && (
                  <div className="flex flex-col gap-2 w-full p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Weight</span>
                      <span className="text-xs text-black dark:text-white font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-700 min-w-[36px] text-center shadow-xs">{weight}</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="900"
                      step="100"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red touch-pan-x"
                    />
                  </div>
                )}

                {/* Tracking */}
                {hasTrackingGroup && (
                  <div className="flex flex-col gap-2 w-full p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Tracking</span>
                      <span className="text-xs text-black dark:text-white font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-700 min-w-[36px] text-center shadow-xs">{letterSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min={-4}
                      max={12}
                      value={letterSpacing}
                      onChange={(e) => setLetterSpacing(Number(e.target.value))}
                      className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red touch-pan-x"
                    />
                  </div>
                )}

                {/* Leading */}
                {hasLeadingGroup && (
                  <div className="flex flex-col gap-2 w-full p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Leading</span>
                      <span className="text-xs text-black dark:text-white font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-700 min-w-[36px] text-center shadow-xs">{lineHeight.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.8}
                      max={2.2}
                      step={0.05}
                      value={lineHeight}
                      onChange={(e) => setLineHeight(Number(e.target.value))}
                      className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red touch-pan-x"
                    />
                  </div>
                )}

                {/* Color pickers */}
                {(hasTextColorGroup || hasBgColorGroup) && (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {hasTextColorGroup && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800/80">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Text</span>
                        <HexColorPickerPopover color={textColor} onChange={setTextColor} title="Text color">
                          <span
                            className="h-7 w-7 block rounded-md border border-zinc-300 dark:border-zinc-700 cursor-pointer shadow-xs"
                            style={{ backgroundColor: textColor }}
                          />
                        </HexColorPickerPopover>
                      </div>
                    )}
                    {hasBgColorGroup && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800/80">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">BG</span>
                        <HexColorPickerPopover color={bgColor} onChange={setBgColor} title="Background color">
                          <span
                            className="h-7 w-7 block rounded-md border border-zinc-300 dark:border-zinc-700 cursor-pointer shadow-xs"
                            style={{ backgroundColor: bgColor }}
                          />
                        </HexColorPickerPopover>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );

            const desktopControlsGroups = (
              <>
                <div className={cn("flex items-center gap-2.5 px-3 py-1", (hasWeightGroup || hasTrackingGroup || hasLeadingGroup || hasTextColorGroup || hasBgColorGroup) && "border-r border-zinc-200 dark:border-zinc-800")}>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Size</span>
                  <input
                    type="range"
                    min={minSize}
                    max={maxSize}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-24 md:w-28 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                  />
                  <span className="text-[11px] text-black dark:text-white font-bold w-7 text-right">{size}</span>
                </div>

                {hasWeightGroup && (
                  <div className={cn("flex items-center gap-2.5 px-3 py-1", (hasTrackingGroup || hasLeadingGroup || hasTextColorGroup || hasBgColorGroup) && "border-r border-zinc-200 dark:border-zinc-800")}>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Weight</span>
                    <input
                      type="range"
                      min="100"
                      max="900"
                      step="100"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-24 md:w-28 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                    />
                    <span className="text-[11px] text-black dark:text-white font-bold w-7 text-right">{weight}</span>
                  </div>
                )}

                {hasTrackingGroup && (
                  <div className={cn("flex items-center gap-2.5 px-3 py-1", (hasLeadingGroup || hasTextColorGroup || hasBgColorGroup) && "border-r border-zinc-200 dark:border-zinc-800")}>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Tracking</span>
                    <input
                      type="range"
                      min={-4}
                      max={12}
                      value={letterSpacing}
                      onChange={(e) => setLetterSpacing(Number(e.target.value))}
                      className="w-24 md:w-28 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                    />
                    <span className="text-[11px] text-black dark:text-white font-bold w-7 text-right">{letterSpacing}</span>
                  </div>
                )}

                {hasLeadingGroup && (
                  <div className={cn("flex items-center gap-2.5 px-3 py-1", (hasTextColorGroup || hasBgColorGroup) && "border-r border-zinc-200 dark:border-zinc-800")}>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Leading</span>
                    <input
                      type="range"
                      min={0.8}
                      max={2.2}
                      step={0.05}
                      value={lineHeight}
                      onChange={(e) => setLineHeight(Number(e.target.value))}
                      className="w-24 md:w-28 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue dark:accent-red"
                    />
                    <span className="text-[11px] text-black dark:text-white font-bold w-8 text-right">{lineHeight.toFixed(2)}</span>
                  </div>
                )}

                {hasTextColorGroup && (
                  <div className={cn("flex items-center gap-2.5 px-3 py-1", hasBgColorGroup && "border-r border-zinc-200 dark:border-zinc-800")}>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">Text</span>
                    <HexColorPickerPopover color={textColor} onChange={setTextColor} title="Text color">
                      <span
                        className="h-6 w-6 block rounded-md border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-xs"
                        style={{ backgroundColor: textColor }}
                      />
                    </HexColorPickerPopover>
                  </div>
                )}

                {hasBgColorGroup && (
                  <div className="flex items-center gap-2.5 px-3 py-1">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">BG</span>
                    <HexColorPickerPopover color={bgColor} onChange={setBgColor} title="Background color">
                      <span
                        className="h-6 w-6 block rounded-md border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-xs"
                        style={{ backgroundColor: bgColor }}
                      />
                    </HexColorPickerPopover>
                  </div>
                )}
              </>
            );

            const desktopControlsPanelClassName = "justify-center items-center flex-wrap gap-x-2 gap-y-2 bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-sm";

            if (!mobileControlsInModal) {
              return (
                <div className="w-full">
                  <div className="block md:hidden w-full p-2 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-sm">
                    {mobileControlsGroups}
                  </div>
                  <div className={cn("hidden md:flex", desktopControlsPanelClassName)}>
                    {desktopControlsGroups}
                  </div>
                </div>
              );
            }

            return (
              <>
                <button
                  type="button"
                  onClick={() => setIsControlsModalOpen(true)}
                  className="md:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 text-xs font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 shadow-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4 text-blue dark:text-red" />
                  Tweak
                </button>
                <div className={cn("hidden md:flex", desktopControlsPanelClassName)}>{desktopControlsGroups}</div>
                <BaseModal isOpen={isControlsModalOpen} onClose={() => setIsControlsModalOpen(false)} size="md">
                  <BaseModal.Header onClose={() => setIsControlsModalOpen(false)}>
                    <h2 className="text-lg font-star text-black dark:text-white">Customize Preview</h2>
                  </BaseModal.Header>
                  <BaseModal.Body  className="!p-4 !sm:p-6">
                    {mobileControlsGroups}
                  </BaseModal.Body>
                </BaseModal>
              </>
            );
          })()}
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
      lineHeight: hasLeadingGroup ? lineHeight : compact ? 1.35 : undefined,
      letterSpacing: hasTrackingGroup ? `${letterSpacing}px` : undefined,
      color: hasTextColorGroup ? textColor : undefined,
    };
    const previewClassName = cn(
      "relative z-10 w-full bg-transparent border-none text-center overflow-visible",
      !hasLeadingGroup && (compact ? "leading-normal" : "leading-tight"),
      !hasTextColorGroup && "text-black dark:text-white"
    );

    // Non-editable previews render as plain static text rather than a form
    // control, since LivePreview can end up nested inside a <Link> (e.g. card
    // grids) where an interactive <textarea> would be invalid HTML nesting.
    return editable ? (
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={cn(previewClassName, "h-full resize-none focus:outline-none focus:ring-0 overflow-auto")}
        style={previewStyle}
        spellCheck="false"
      />
    ) : (
      <p className={cn(previewClassName, "h-full flex items-center justify-center cursor-default whitespace-pre-wrap")} style={previewStyle}>
        {text}
      </p>
    );
  })()}
</div>
    </div>
  );
}