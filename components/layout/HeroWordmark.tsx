"use client";

import React, { useId, useMemo } from "react";
import { ResolvedBrandFont } from "@/types";

// ============================================================================
// CONFIGURAZIONE TWEAKS
// ============================================================================
/**
 * POSIZIONE TEMPORALE DELLO STEP INTERMEDIO (da 0.1 a 0.9):
 * Definisce in quale punto della durata del flip avviene la massima inclinazione.
 * - Valori più bassi (es. 0.25 - 0.35): Rendo lo scatto iniziale immediato e l'allineamento fluido.
 * - 0.5 (default precedente): Spezza lo scatto esattamente a metà creando il "secondo step" visibile.
 */
const SNAP_MID_RATIO = 0.5;

/**
 * QUOTA Y DELLO STEP INTERMEDIO (da 0.1 a 0.9):
 * Definisce a che percentuale della distanza totale si trova la lettera quando si piega.
 * - 0.5 = Metà strada tra la posizione corrente e quella successiva.
 */
const SNAP_MID_Y_RATIO = 0.2;

/** Inclinazione prospettiva in gradi durante lo scatto */
const REEL_TILT_DEG = 25;

/** Spostamento VERTICALE della "T" (nella ruota, font scaricati) rispetto a "YPAMINE". */
const T_OFFSET_TOP_EM = -0.15;

/** Spaziatura orizzontale tra la "T" (nella ruota, font scaricati) e "YPAMINE". */
const T_OFFSET_RIGHT_EM = -0.95;

/** Altezza di ogni pala/tassello lungo la ruota (in `em`). */
const SLOT_HEIGHT_EM = 1.9;

/** Altezza della finestra/inquadratura (in `em`). */
const VIEWPORT_HEIGHT_EM = 1.9;

/** Prospettiva della camera (in px) */
const REEL_PERSPECTIVE_PX = 200;

/** Durata del crossfade tra "T naturale" e ruota, come frazione del flip. */
const CROSSFADE_RATIO = 0.6;

const DEFAULT_SQUARE_LIGHT_COLOR = "#4FE8E8";
const DEFAULT_SQUARE_DARK_COLOR = "#FF3132";

export interface HeroWordmarkFontFrame {
  font: ResolvedBrandFont;
  fontSizePercent?: number;
}

interface HeroWordmarkProps {
  text?: string;
  fonts: HeroWordmarkFontFrame[];
  intervalMs?: number;
  flipDurationMs?: number;
  loop?: boolean;
  loopSpeed?: number;
  className?: string;
  squareColorClasses?: string;
  logoLightModeColor?: string;
  logoDarkModeColor?: string;
  /** Spostamento verticale della T nella ruota, in em (sovrascrive il default se fornito). */
  tOffsetTopEm?: number;
  /** Spaziatura orizzontale della T nella ruota, in em (sovrascrive il default se fornito). */
  tOffsetRightEm?: number;
  /** Mostra una guida visiva in sovrapposizione per verificare l'allineamento. */
  debugOverlay?: boolean;
}

function parseLoopSpeedToMultiplier(speed: number = 0): number {
  const clamped = Math.min(5, Math.max(-5, speed));
  if (clamped >= 0) {
    return 1 + clamped * 0.8;
  } else {
    return 1 / (1 + Math.abs(clamped) * 0.8);
  }
}

// Genera i Keyframes della ruota (font scaricati SOLTANTO — l'indice 0 e' un
// segnaposto "vuoto", nascosto via opacity, che tiene solo il tempo del
// primo hold cosi' la cadenza resta quella configurata da admin includendo
// la T naturale). Un secondo canale "opacity" e' incluso nello stesso
// @keyframes: 0 mentre e' mostrato il segnaposto (la T naturale e' visibile
// al suo posto), 1 non appena la ruota mostra un font scaricato vero.
function buildReelKeyframes(
  name: string,
  logicalCount: number,
  intervalMs: number,
  flipDurationMs: number,
  loop: boolean,
  slotHeightEm: number
) {
  const totalMs = intervalMs * logicalCount;
  const pct = (ms: number) => Math.min(100, Math.max(0, (ms / totalMs) * 100));
  const stops: string[] = [];

  const lastIndex = loop ? logicalCount : logicalCount - 1;
  const crossfadeMs = flipDurationMs * CROSSFADE_RATIO;

  const opacityAt = (index: number) => (index === 0 ? 0 : 1);

  for (let i = 0; i < logicalCount; i++) {
    const segStart = i * intervalMs;
    const holdEnd = segStart + Math.max(intervalMs - flipDurationMs, 0);
    const snapEnd = segStart + intervalMs;

    const currentY = -(i - 1) * slotHeightEm;
    const nextY = -i * slotHeightEm;
    const currentOpacity = opacityAt(i);
    const nextOpacity = opacityAt(i + 1 >= logicalCount ? (loop ? 0 : i) : i + 1);

    // 1. Fermo in posizione
    stops.push(`${pct(segStart)}% { transform: translateY(${currentY}em) rotateX(0deg); opacity: ${currentOpacity}; }`);
    stops.push(`${pct(holdEnd)}% { transform: translateY(${currentY}em) rotateX(0deg); opacity: ${currentOpacity}; }`);

    // 2. Scatto
    if (i < lastIndex) {
      const midMs = holdEnd + flipDurationMs * SNAP_MID_RATIO;
      const midY = currentY + (nextY - currentY) * SNAP_MID_Y_RATIO;
      const fadeMs = Math.min(holdEnd + crossfadeMs, snapEnd);

      stops.push(`${pct(fadeMs)}% { opacity: ${nextOpacity}; }`);
      stops.push(
        `${pct(midMs)}% { transform: translateY(${midY}em) rotateX(-${REEL_TILT_DEG}deg); opacity: ${nextOpacity}; }`
      );
      stops.push(
        `${pct(snapEnd)}% { transform: translateY(${nextY}em) rotateX(0deg); opacity: ${nextOpacity}; }`
      );
    }
  }

  if (loop) {
    stops.push(`100% { transform: translateY(${slotHeightEm}em) rotateX(0deg); opacity: ${opacityAt(0)}; }`);
  } else {
    stops.push(`100% { transform: translateY(${-(logicalCount - 1) * slotHeightEm}em) rotateX(0deg); opacity: ${opacityAt(logicalCount - 1)}; }`);
  }

  return {
    css: `@keyframes ${name} { ${stops.join("\n")} }`,
    totalMs,
  };
}

// Keyframes della T "naturale" (font-rezland, testo vero in flusso normale):
// opacity esattamente inversa a quella della ruota sopra — visibile mentre
// la ruota mostra il segnaposto (indice 0), invisibile mentre mostra un
// font scaricato vero.
function buildNaturalOpacityKeyframes(
  name: string,
  logicalCount: number,
  intervalMs: number,
  flipDurationMs: number,
  loop: boolean,
  slotHeightEm: number
) {
  const totalMs = intervalMs * logicalCount;
  const pct = (ms: number) => Math.min(100, Math.max(0, (ms / totalMs) * 100));
  const stops: string[] = [];
  const lastIndex = loop ? logicalCount : logicalCount - 1;
  const crossfadeMs = flipDurationMs * CROSSFADE_RATIO;

  const opacityAt = (index: number) => (index === 0 ? 1 : 0);

  for (let i = 0; i < logicalCount; i++) {
    const segStart = i * intervalMs;
    const holdEnd = segStart + Math.max(intervalMs - flipDurationMs, 0);
    const snapEnd = segStart + intervalMs;
    const currentOpacity = opacityAt(i);
    const nextOpacity = opacityAt(i + 1 >= logicalCount ? (loop ? 0 : i) : i + 1);

    if (i === 0) {
      // Hold della T naturale: visibile e centrata
      stops.push(`${pct(segStart)}% { transform: translateY(0em); opacity: 1; }`);
      stops.push(`${pct(holdEnd)}% { transform: translateY(0em); opacity: 1; }`);

      if (i < lastIndex) {
        // Scatto verso i=1: sale e sfuma
        const midMs = holdEnd + flipDurationMs * SNAP_MID_RATIO;
        const midY = -slotHeightEm * SNAP_MID_Y_RATIO;
        const fadeMs = Math.min(holdEnd + crossfadeMs, snapEnd);

        stops.push(`${pct(fadeMs)}% { opacity: 0; }`);
        stops.push(`${pct(midMs)}% { transform: translateY(${midY}em); }`);
        stops.push(`${pct(snapEnd)}% { transform: translateY(${-slotHeightEm}em); opacity: 0; }`);
      }
    } else if (i === logicalCount - 1 && loop) {
      // Hold dell'ultimo font scaricato: la T naturale si prepara sotto
      stops.push(`${pct(segStart)}% { transform: translateY(${slotHeightEm}em); opacity: 0; }`);
      stops.push(`${pct(holdEnd)}% { transform: translateY(${slotHeightEm}em); opacity: 0; }`);

      // Scatto di ritorno a i=0: sale da sotto e appare
      const midMs = holdEnd + flipDurationMs * SNAP_MID_RATIO;
      const midY = slotHeightEm - slotHeightEm * SNAP_MID_Y_RATIO;
      const fadeMs = Math.min(holdEnd + crossfadeMs, snapEnd);

      stops.push(`${pct(fadeMs)}% { opacity: 1; }`);
      stops.push(`${pct(midMs)}% { transform: translateY(${midY}em); }`);
      stops.push(`${pct(snapEnd)}% { transform: translateY(0em); opacity: 1; }`);
    } else {
      // Altri frame: invisibile e fuori
      stops.push(`${pct(segStart)}% { transform: translateY(${-slotHeightEm}em); opacity: 0; }`);
      stops.push(`${pct(holdEnd)}% { transform: translateY(${-slotHeightEm}em); opacity: 0; }`);

      if (i < lastIndex) {
        stops.push(`${pct(snapEnd)}% { transform: translateY(${-slotHeightEm}em); opacity: 0; }`);
      }
    }
  }

  stops.push(`100% { transform: translateY(0em); opacity: 1; }`);

  return `@keyframes ${name} { ${stops.join("\n")} }`;
}

// Genera i Keyframes del Quadratino (scatti di 90° sincroni con la "T"),
// invariato — continua a scattare anche durante la fase "T naturale", e'
// puramente decorativo.
function buildSquareKeyframes(
  name: string,
  logicalCount: number,
  intervalMs: number,
  flipDurationMs: number,
  loop: boolean
) {
  const totalMs = intervalMs * logicalCount;
  const pct = (ms: number) => Math.min(100, Math.max(0, (ms / totalMs) * 100));
  const stops: string[] = [];

  const lastIndex = loop ? logicalCount : logicalCount - 1;

  for (let i = 0; i < logicalCount; i++) {
    const segStart = i * intervalMs;
    const holdEnd = segStart + Math.max(intervalMs - flipDurationMs, 0);
    const snapEnd = segStart + intervalMs;

    const currentRot = i * 90;
    const nextRot = (i + 1) * 90;

    stops.push(`${pct(segStart)}% { transform: rotate(${currentRot}deg); }`);
    stops.push(`${pct(holdEnd)}% { transform: rotate(${currentRot}deg); }`);

    if (i < lastIndex) {
      stops.push(`${pct(snapEnd)}% { transform: rotate(${nextRot}deg); }`);
    }
  }

  const finalRot = loop ? logicalCount * 90 : (logicalCount - 1) * 90;
  stops.push(`100% { transform: rotate(${finalRot}deg); }`);

  return `@keyframes ${name} { ${stops.join("\n")} }`;
}

export default function HeroWordmark({
  text = "TYPAMINE",
  fonts,
  intervalMs = 2600,
  flipDurationMs = 650,
  loop = true,
  loopSpeed = 0,
  className = "",
  squareColorClasses = "",
  logoLightModeColor,
  logoDarkModeColor,
  tOffsetTopEm = T_OFFSET_TOP_EM,
  tOffsetRightEm = T_OFFSET_RIGHT_EM,
  debugOverlay = false,
}: HeroWordmarkProps) {
  // Solo font DAVVERO scaricabili finiscono nella ruota — mai la T
  // "naturale" (font-rezland, gia' attivo via className, zero fetch, zero
  // layout shift al primo paint). La T naturale vive in un layer SEPARATO,
  // sempre in flusso normale: e' lei a determinare lo spazio verso
  // "YPAMINE" (mai la ruota, che e' assoluta/solo visiva), quindi
  // "YPAMINE" non si sposta MAI, qualunque font stia mostrando la ruota.
  const reelFrames = useMemo(() => fonts.filter((f) => !!f.font?.woff2Url), [fonts]);
  const animates = reelFrames.length >= 1;

  // Slot 0 = segnaposto "T naturale" (mai renderizzato nella ruota, serve
  // solo a scandire il tempo), slot 1..N = font scaricati veri.
  const logicalCount = reelFrames.length + 1;

  const speedMultiplier = parseLoopSpeedToMultiplier(loopSpeed);
  const effectiveIntervalMs = intervalMs / speedMultiplier;
  const effectiveFlipDurationMs = flipDurationMs / speedMultiplier;

  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const animName = `heroReelSpaced_${rawId}`;
  const naturalAnimName = `heroNaturalFade_${rawId}`;
  const squareAnimName = `heroSquareSnap_${rawId}`;

  // Contenuto della ruota: SOLO font scaricati, ripetuto in coda per il
  // loop (stessa tecnica di prima).
  const displayReelFrames = useMemo(() => {
    return animates && loop ? [...reelFrames, reelFrames[0]] : reelFrames;
  }, [reelFrames, animates, loop]);

  const fontFamilyOf = (f: HeroWordmarkFontFrame) => `HeroWordmarkT_${f.font.id}`;

  const { css: reelCss, totalMs } = useMemo(() => {
    if (!animates) return { css: "", totalMs: 0 };
    return buildReelKeyframes(animName, logicalCount, effectiveIntervalMs, effectiveFlipDurationMs, loop, SLOT_HEIGHT_EM);
  }, [animName, logicalCount, effectiveIntervalMs, effectiveFlipDurationMs, loop, animates]);

  const naturalCss = useMemo(() => {
    if (!animates) return "";
    return buildNaturalOpacityKeyframes(naturalAnimName, logicalCount, effectiveIntervalMs, effectiveFlipDurationMs, loop, SLOT_HEIGHT_EM);
  }, [naturalAnimName, logicalCount, effectiveIntervalMs, effectiveFlipDurationMs, loop, animates]);

  const squareCss = useMemo(() => {
    if (!animates) return "";
    return buildSquareKeyframes(squareAnimName, logicalCount, effectiveIntervalMs, effectiveFlipDurationMs, loop);
  }, [squareAnimName, logicalCount, effectiveIntervalMs, effectiveFlipDurationMs, loop, animates]);

  const squareDynStyle = {
    "--dyn-bg-light": logoLightModeColor || DEFAULT_SQUARE_LIGHT_COLOR,
    "--dyn-bg-dark": logoDarkModeColor || DEFAULT_SQUARE_DARK_COLOR,
    "--dyn-text-light": logoLightModeColor || DEFAULT_SQUARE_LIGHT_COLOR,
    "--dyn-text-dark": logoDarkModeColor || DEFAULT_SQUARE_DARK_COLOR,
  } as React.CSSProperties;

  return (
    <div className={`relative inline-block leading-none select-none ${className}`}>
      {reelFrames.map((f) => (
        <style key={f.font.id}>{`
          @font-face {
            font-family: '${fontFamilyOf(f)}';
            src: url('${f.font.woff2Url}') format('woff2');
            font-display: swap;
          }
        `}</style>
      ))}

      {animates && <style>{`${reelCss}\n${naturalCss}\n${squareCss}`}</style>}

      <span className="inline-flex items-baseline">
        {/* Contenitore ancora: la T NATURALE (sotto, in flusso normale) e'
            l'unica a determinare lo spazio verso "YPAMINE" — la ruota (sopra,
            assoluta) e' puramente visiva e non sposta mai nulla. */}
        <span className="relative inline-block">
          {/* SPAZIATORE E ANCORA BASELINE DUMMY (in flusso, invisibile) */}
          <span style={{ visibility: "hidden" }}>{text[0]}</span>

          {/* VIEWPORT DELLA T NATURALE (Stessa altezza, maschera, clip e centratura della ruota) */}
          <span
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden pointer-events-none"
            style={{
              height: `${VIEWPORT_HEIGHT_EM}em`,
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            }}
          >
            <span
              className="flex flex-col items-center justify-center p-0"
              style={{
                height: `${SLOT_HEIGHT_EM}em`,
                lineHeight: 1,
                opacity: animates ? undefined : 1,
                animationName: animates ? naturalAnimName : undefined,
                animationDuration: animates ? `${totalMs}ms` : undefined,
                animationTimingFunction: animates ? "cubic-bezier(0.45, 0, 0.55, 1)" : undefined,
                animationIterationCount: animates ? (loop ? "infinite" : 1) : undefined,
                animationFillMode: animates ? (loop ? "none" : "forwards") : undefined,
              }}
            >
              <span style={{ lineHeight: 1, display: "inline-block" }}>
                {text[0]}
              </span>
            </span>
          </span>

          {animates && (
            /* RUOTA — assoluta, sovrapposta esattamente alla T naturale:
               puramente visiva, non consuma spazio nel flusso, quindi
               "YPAMINE" non si muove mai qualunque font stia mostrando. */
            <span
              className="absolute left-0 top-1/2 pointer-events-none"
              style={{
                height: `${VIEWPORT_HEIGHT_EM}em`,
                width: "max-content",
                transform: `translateY(-50%) translateY(${tOffsetTopEm}em) translateX(${tOffsetRightEm}em)`,
                overflow: "hidden",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
              }}
            >
              {/* STRIP ROTANTE */}
              <span
                className="block"
                style={{
                  perspective: `${REEL_PERSPECTIVE_PX}px`,
                  perspectiveOrigin: "50% 50%",
                  animationName: animName,
                  animationDuration: `${totalMs}ms`,
                  animationTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
                  animationIterationCount: loop ? "infinite" : 1,
                  animationFillMode: loop ? "none" : "forwards",
                }}
              >
                {displayReelFrames.map((f, i) => {
                  const scale = (f.fontSizePercent ?? 100) / 100;

                  return (
                    <span
                      key={`${f.font.id}-${i}`}
                      className="flex flex-col items-center justify-center p-0"
                      style={{
                        height: `${SLOT_HEIGHT_EM}em`,
                        lineHeight: 1,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: `'${fontFamilyOf(f)}', sans-serif`,
                          transform: `scale(${scale})`,
                          transformOrigin: "center center",
                          lineHeight: 1,
                          display: "inline-block",
                          willChange: "transform",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {text[0]}
                      </span>
                    </span>
                  );
                })}
              </span>
            </span>
          )}

          {debugOverlay && (
            <span className="absolute left-0 top-0 pointer-events-none opacity-50 text-emerald-500 font-bold z-50">
              {text[0]}
            </span>
          )}
        </span>

        {/* Resto della parola ("YPAMINE") — sempre in flusso normale,
            posizione mai influenzata dalla ruota. */}
        {text.slice(1)}
      </span>

      {/* Quadratino "chimico" animato in perfetto sincro a scatti di 90° */}
      <span
        className={`absolute bottom-[0.15em] right-[-0.5em] w-[0.4em] h-[0.4em] dyn-bg dyn-text shadow-[0_0_15px_currentColor] blur-[1px] brightness-110 rounded-xs inline-block ${squareColorClasses}`}
        style={{
          ...squareDynStyle,
          ...(animates
            ? {
                animationName: squareAnimName,
                animationDuration: `${totalMs}ms`,
                animationTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
                animationIterationCount: loop ? "infinite" : 1,
                animationFillMode: loop ? "none" : "forwards",
              }
            : {}),
        }}
      />
    </div>
  );
}
