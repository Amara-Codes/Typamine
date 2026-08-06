"use client";

import React, { useEffect, useState } from "react";

interface GlyphBox {
  // Percentuali: distanza dai bordi della cella (spazio occupato dal
  // carattere, font ascent+descent x advance width) ai bordi reali
  // dell'inchiostro del glifo — non del box/whitespace.
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface GlyphTypefaceProps {
  text: string;
  /** Classi Tailwind per font/size/colore testo (es. font-rezland text-[clamp(...)]). */
  className?: string;
  /** Classi Tailwind per il bordo che incornicia l'inchiostro del glifo. */
  borderClassName?: string;
  /** Font-family CSS reale usata per misurare via canvas (deve combaciare con quella di `className`). */
  fontFamilyCss?: string;
  /** Override completo di `className` per il solo text[0] (es. brand identity — vedi /admin/settings). Omesso = comportamento identico a prima. */
  firstLetterClassName?: string;
  /** Style aggiuntivo per il solo text[0] (font-family custom, --dyn-text-light/dark, ecc). */
  firstLetterStyle?: React.CSSProperties;
  /** Font-family CSS usata per misurare l'ink box del solo text[0], se diversa da `fontFamilyCss`. */
  firstLetterFontFamilyCss?: string;
}

const REF_FONT_SIZE = 500; // px — arbitraria: i rapporti ink/cella sono invarianti alla dimensione.
const MAX_INSET_PCT = 48; // evita bordi invertiti su glifi degeneri (es. punteggiatura sottile).

function clampPct(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(MAX_INSET_PCT, Math.max(0, v));
}

async function measureGlyphBoxes(chars: string[], fontFamilyCss: string): Promise<Record<string, GlyphBox>> {
  const boxes: Record<string, GlyphBox> = {};

  try {
    await document.fonts.load(`${REF_FONT_SIZE}px ${fontFamilyCss}`);
  } catch {
    // Font non caricabile/non trovato: procediamo comunque, il canvas userà
    // il fallback e le misure saranno solo approssimate.
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return boxes;

  ctx.font = `${REF_FONT_SIZE}px ${fontFamilyCss}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  for (const ch of chars) {
    if (boxes[ch] || ch === " " || ch === "\n") continue;

    const m = ctx.measureText(ch);
    const cellWidth = m.width;
    const cellHeight = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
    if (cellWidth <= 0 || cellHeight <= 0) continue;

    // Origine (x=0) = bordo sinistro della cella (textAlign "left"). Le
    // actualBoundingBox* del Canvas 2D restituiscono l'estensione REALE
    // dell'inchiostro renderizzato rispetto a quell'origine e alla baseline —
    // esattamente il bordo fisico del carattere, non l'advance width/em-box.
    const inkLeft = -m.actualBoundingBoxLeft;
    const inkRight = m.actualBoundingBoxRight;
    const inkTop = m.fontBoundingBoxAscent - m.actualBoundingBoxAscent;
    const inkBottom = m.fontBoundingBoxAscent + m.actualBoundingBoxDescent;

    boxes[ch] = {
      left: clampPct((inkLeft / cellWidth) * 100),
      right: clampPct(((cellWidth - inkRight) / cellWidth) * 100),
      top: clampPct((inkTop / cellHeight) * 100),
      bottom: clampPct(((cellHeight - inkBottom) / cellHeight) * 100),
    };
  }

  return boxes;
}

// Ogni carattere è un div a sé, largo quanto il suo advance width naturale
// (layout inline normale del browser, non calcolato a mano — così lettere
// strette come "I" e larghe come "M" restano proporzionate come nel type
// setting reale). Dentro, un secondo div assoluto con bordi posizionati in
// percentuale sui 4 lati: percentuale = invariante rispetto alla dimensione
// del font, quindi lo stesso box "abbraccia" il glifo identico a qualunque
// breakpoint/clamp responsive.
export default function GlyphTypeface({
  text,
  className = "",
  borderClassName = "border-[1.5px] border-black dark:border-white",
  fontFamilyCss = "'Star Avenue'",
  firstLetterClassName,
  firstLetterStyle,
  firstLetterFontFamilyCss,
}: GlyphTypefaceProps) {
  const [boxes, setBoxes] = useState<Record<string, GlyphBox> | null>(null);
  // Box del solo text[0], misurato separatamente SOLO quando ha un font
  // diverso dal resto — se text[0] ricompare più avanti nella stringa con lo
  // stesso font di default, la key-per-carattere in `boxes` resterebbe
  // altrimenti ambigua tra le due occorrenze.
  const [firstBox, setFirstBox] = useState<GlyphBox | null>(null);

  useEffect(() => {
    let cancelled = false;
    const uniqueChars = Array.from(new Set(text.split("")));
    const firstChar = text[0];
    const hasFirstLetterOverride = Boolean(firstLetterFontFamilyCss) && firstLetterFontFamilyCss !== fontFamilyCss;

    Promise.all([
      measureGlyphBoxes(uniqueChars, fontFamilyCss),
      hasFirstLetterOverride && firstChar && firstChar !== " "
        ? measureGlyphBoxes([firstChar], firstLetterFontFamilyCss!)
        : Promise.resolve<Record<string, GlyphBox>>({}),
    ]).then(([restBoxes, firstBoxes]) => {
      if (cancelled) return;
      setBoxes(restBoxes);
      setFirstBox(hasFirstLetterOverride ? firstBoxes[firstChar] ?? null : null);
    });

    return () => {
      cancelled = true;
    };
  }, [text, fontFamilyCss, firstLetterFontFamilyCss]);

  return (
    <div className="text-center leading-none select-none" style={{ wordBreak: "keep-all" }}>
      {text.split("").map((char, idx) => {
        if (char === " ") {
          return (
            <span key={idx} className={`inline-block ${className}`} aria-hidden style={{ width: "0.35em" }} />
          );
        }

        const isFirst = idx === 0;
        const charClassName = isFirst && firstLetterClassName !== undefined ? firstLetterClassName : className;
        const charStyle = isFirst ? firstLetterStyle : undefined;
        const box = isFirst && firstBox ? firstBox : boxes?.[char];

        return (
          <span key={idx} className={`group relative inline-block align-top ${charClassName}`} style={charStyle}>
            {char}
            {box && (
              <span
                className={`absolute pointer-events-none opacity-40 transition-opacity duration-300 ease-out group-hover:opacity-100 ${borderClassName}`}
                style={{
                  top: `${box.top}%`,
                  left: `${box.left}%`,
                  right: `${box.right}%`,
                  bottom: `${box.bottom}%`,
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
