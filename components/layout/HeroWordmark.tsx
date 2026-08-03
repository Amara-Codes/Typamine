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

/** Spostamento VERTICALE della "T" rispetto a "YPAMINE". */
const T_OFFSET_TOP_EM = 0.15;

/** Spaziatura orizzontale tra la "T" e "YPAMINE". */
const T_OFFSET_RIGHT_EM = -0.65;

/** Altezza di ogni pala/tassello lungo la ruota (in `em`). */
const SLOT_HEIGHT_EM = 1.9;

/** Altezza della finestra/inquadratura (in `em`). */
const VIEWPORT_HEIGHT_EM = 1.65;

/** Prospettiva della camera (in px) */
const REEL_PERSPECTIVE_PX = 200;

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
}

function parseLoopSpeedToMultiplier(speed: number = 0): number {
  const clamped = Math.min(5, Math.max(-5, speed));
  if (clamped >= 0) {
    return 1 + clamped * 0.8;
  } else {
    return 1 / (1 + Math.abs(clamped) * 0.8);
  }
}

// Genera i Keyframes della "T" regolando il delta dello scatto intermedio
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

  for (let i = 0; i < logicalCount; i++) {
    const segStart = i * intervalMs;
    const holdEnd = segStart + Math.max(intervalMs - flipDurationMs, 0);
    const snapEnd = segStart + intervalMs;

    const currentY = -i * slotHeightEm;
    const nextY = -(i + 1) * slotHeightEm;

    // 1. Fermo in posizione
    stops.push(`${pct(segStart)}% { transform: translateY(${currentY}em) rotateX(0deg); }`);
    stops.push(`${pct(holdEnd)}% { transform: translateY(${currentY}em) rotateX(0deg); }`);

    // 2. Scatto regolabile tramite SNAP_MID_RATIO e SNAP_MID_Y_RATIO
    if (i < lastIndex) {
      const midMs = holdEnd + flipDurationMs * SNAP_MID_RATIO;
      const midY = currentY + (nextY - currentY) * SNAP_MID_Y_RATIO;

      stops.push(
        `${pct(midMs)}% { transform: translateY(${midY}em) rotateX(-${REEL_TILT_DEG}deg); }`
      );
      stops.push(
        `${pct(snapEnd)}% { transform: translateY(${nextY}em) rotateX(0deg); }`
      );
    }
  }

  if (loop) {
    stops.push(`100% { transform: translateY(${-logicalCount * slotHeightEm}em) rotateX(0deg); }`);
  } else {
    stops.push(`100% { transform: translateY(${-(logicalCount - 1) * slotHeightEm}em) rotateX(0deg); }`);
  }

  return {
    css: `@keyframes ${name} { ${stops.join("\n")} }`,
    totalMs,
  };
}

// Genera i Keyframes del Quadratino (scatti di 90° sincroni con la "T")
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
}: HeroWordmarkProps) {
  const frames = useMemo(() => fonts.filter((f) => !!f.font?.woff2Url), [fonts]);
  const animates = frames.length >= 2;

  const speedMultiplier = parseLoopSpeedToMultiplier(loopSpeed);
  const effectiveIntervalMs = intervalMs / speedMultiplier;
  const effectiveFlipDurationMs = flipDurationMs / speedMultiplier;

  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const animName = `heroReelSpaced_${rawId}`;
  const squareAnimName = `heroSquareSnap_${rawId}`;

  const displayFrames = useMemo(() => {
    return animates && loop ? [...frames, frames[0]] : frames;
  }, [frames, animates, loop]);

  const fontFamilyOf = (f: HeroWordmarkFontFrame) => `HeroWordmarkT_${f.font.id}`;

  const { css: reelCss, totalMs } = useMemo(() => {
    if (!animates) return { css: "", totalMs: 0 };
    return buildReelKeyframes(
      animName,
      frames.length,
      effectiveIntervalMs,
      effectiveFlipDurationMs,
      loop,
      SLOT_HEIGHT_EM
    );
  }, [animName, frames.length, effectiveIntervalMs, effectiveFlipDurationMs, loop, animates]);

  const squareCss = useMemo(() => {
    if (!animates) return "";
    return buildSquareKeyframes(
      squareAnimName,
      frames.length,
      effectiveIntervalMs,
      effectiveFlipDurationMs,
      loop
    );
  }, [squareAnimName, frames.length, effectiveIntervalMs, effectiveFlipDurationMs, loop, animates]);

  const squareDynStyle = {
    "--dyn-bg-light": logoLightModeColor || DEFAULT_SQUARE_LIGHT_COLOR,
    "--dyn-bg-dark": logoDarkModeColor || DEFAULT_SQUARE_DARK_COLOR,
    "--dyn-text-light": logoLightModeColor || DEFAULT_SQUARE_LIGHT_COLOR,
    "--dyn-text-dark": logoDarkModeColor || DEFAULT_SQUARE_DARK_COLOR,
  } as React.CSSProperties;

  return (
    <div className={`relative inline-block pr-[0.5em] pb-[0.55em] leading-none select-none ${className}`}>
      {frames.map((f) => (
        <style key={f.font.id}>{`
          @font-face {
            font-family: '${fontFamilyOf(f)}';
            src: url('${f.font.woff2Url}') format('woff2');
            font-display: swap;
          }
        `}</style>
      ))}

      {animates && <style>{`${reelCss}\n${squareCss}`}</style>}

      <span className="inline-flex items-baseline">
        {animates ? (
          /* VIEWPORT / INQUADRATURA */
          <span
            className="relative inline-block"
            style={{
              height: `${VIEWPORT_HEIGHT_EM}em`,
              marginRight: `${T_OFFSET_RIGHT_EM}em`,
              transform: `translateY(${T_OFFSET_TOP_EM}em)`,
              overflow: "hidden",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
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
              {displayFrames.map((f, i) => {
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
        ) : (
          <span
            style={
              frames[0]
                ? {
                    fontFamily: `'${fontFamilyOf(frames[0])}', sans-serif`,
                    fontSize: `${frames[0].fontSizePercent ?? 100}%`,
                  }
                : undefined
            }
          >
            {text[0]}
          </span>
        )}

        {/* Resto della parola ("YPAMINE") */}
        {text.slice(1)}
      </span>

      {/* Quadratino "chimico" animato in perfetto sincro a scatti di 90° */}
      <span
        className={`absolute bottom-0 right-0 w-[0.4em] h-[0.4em] dyn-bg dyn-text shadow-[0_0_15px_currentColor] blur-[1px] brightness-110 rounded-xs inline-block ${squareColorClasses}`}
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