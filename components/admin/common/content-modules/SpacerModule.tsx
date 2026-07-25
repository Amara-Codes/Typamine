"use client";

import { useRef } from "react";
import { Label } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import {
  GranularBGColorPickerButton,
  Module
} from "./shared";

interface SpacerModuleProps {
  module: Module;
  onChange: (newProps: Record<string, any>) => void;
}

// Line Width Selector: 10% → 100%, step 10 — stessa UI di OpacitySelector
function LineWidthSelector({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const parseWidth = (v: string): number => {
    const n = parseFloat(v);
    return isNaN(n) ? 100 : Math.min(Math.max(n, 10), 100);
  };

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const stepped = Math.round(pct * 9) * 10 + 10; // 10..100 step 10
    onChange(`${stepped}%`);
  };

  const current = parseWidth(value ?? "100%");
  const progress = (current - 10) / 90; // normalised 0..1

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="mb-0 text-black/80! dark:text-white/80!">{label}</Label>
        <div className="text-[10px] font-black text-black dark:text-white bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full border border-black/5 shadow-inner min-w-[45px] text-center transition-all duration-200">
          {current}%
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-3 w-full bg-black/10 dark:bg-white/5 rounded-full cursor-pointer group touch-none"
        onPointerDown={(e) => {
          handleMove(e.clientX);
          const handlePointerMove = (moveEvent: PointerEvent) => handleMove(moveEvent.clientX);
          const handlePointerUp = () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
          };
          window.addEventListener("pointermove", handlePointerMove);
          window.addEventListener("pointerup", handlePointerUp);
        }}
      >
        <div
          className="absolute inset-0 rounded-full blur-[2px] opacity-20 bg-black dark:bg-white transition-all duration-150"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-linear-to-r from-black to-black/80 dark:from-white dark:to-white/80 rounded-full z-10 transition-all duration-150"
          style={{ width: `${progress * 100}%`, opacity: 0.4 + progress * 0.6 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-7 w-7 bg-white dark:bg-black border-[5px] border-black dark:border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] cursor-grab active:cursor-grabbing z-20 hover:scale-110 transition-all duration-150"
          style={{ left: `calc(${progress * 100}% - 14px)` }}
        >
          <div className="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function SpacerModule({ module, onChange }: SpacerModuleProps) {
  const { props } = module;

  const handleChange = (key: string, value: any) => {
    onChange({ ...props, [key]: value });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* Block 1: Height + Type */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Height / Size</Label>
            <Select
              options={[
                { label: "Extra Small (16px)", value: "xs" },
                { label: "Small (32px)", value: "sm" },
                { label: "Medium (64px)", value: "md" },
                { label: "Large (96px)", value: "lg" },
                { label: "Extra Large (128px)", value: "xl" },
                { label: "Huge (192px)", value: "2xl" },
                { label: "10vh", value: "10vh" },
                { label: "20vh", value: "20vh" },
              ]}
              value={props.height}
              onChange={(v) => handleChange("height", v)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              options={[
                { label: "Empty Space", value: "spacer" },
                { label: "Horizontal Line", value: "divider" },
              ]}
              value={props.type}
              onChange={(v) => handleChange("type", v)}
            />
          </div>
        </div>
      </div>

      {/* Block 2: Divider options (conditional) */}
      {props.type === "divider" && (
        <>
          {/* Line Color light + dark */}
          <div className="space-y-4 mb-16">
            <div className="grid grid-cols-2 gap-4">
              <GranularBGColorPickerButton
                label="Line Color - Light Mode"
                value={props.lineColorClassName}
                onChange={(v: string) => handleChange("lineColorClassName", v)}
                themeMode="light"
              />
              <GranularBGColorPickerButton
                label="Line Color - Dark Mode"
                value={props.lineColorClassName}
                onChange={(v: string) => handleChange("lineColorClassName", v)}
                themeMode="dark"
              />
            </div>
          </div>

          {/* Thickness */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Line Thickness</Label>
              <Select
                options={[
                  { label: "1 (Hairline)", value: "1" },
                  { label: "2 (Thin)", value: "2" },
                  { label: "4 (Standard)", value: "4" },
                  { label: "8 (Thick)", value: "8" },
                  { label: "16 (Heavy)", value: "16" },
                  { label: "24 (Extra Heavy)", value: "24" },
                  { label: "32 (Extreme)", value: "32" },
                ]}
                value={props.lineHeight}
                onChange={(v) => handleChange("lineHeight", v)}
              />
            </div>
          </div>

          {/* Width — l'opacità è già scelta dentro il color picker del colore linea, niente slider duplicato qui */}
          <div className="space-y-4">
              <LineWidthSelector
                label="Line Width"
                value={props.lineWidth ?? "100%"}
                onChange={(v) => handleChange("lineWidth", v)}
              />
            </div>
        </>
      )}

    </div>
  );
}
