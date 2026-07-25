"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { cn } from "@/lib/utils";

interface HexColorPickerPopoverProps {
  color: string;
  onChange: (hex: string) => void;
  className?: string;
  /** Trigger element — defaults to a small round color swatch. */
  children?: React.ReactNode;
  title?: string;
}

// Sostituisce l'<input type="color"> nativo (picker del sistema operativo,
// stile e posizionamento fuori dal nostro controllo) con react-colorful in un
// popover — stesso pattern portal+fixed-position già usato in Select.tsx per
// sfuggire agli stacking context locali delle card del form.
export default function HexColorPickerPopover({ color, onChange, className, children, title }: HexColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIsMounted(true), []);

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelWidth = 216;
    // Il trigger "Via" nel tab gradiente vive spesso in fondo a un BaseModal
    // alto — se sotto non c'è spazio per il pannello, lo apriamo sopra il
    // trigger invece che farlo finire fuori viewport (irraggiungibile).
    const panelHeightEstimate = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < panelHeightEstimate + 8 && rect.top > panelHeightEstimate + 8;
    setPosition({
      top: openAbove ? Math.max(8, rect.top - panelHeightEstimate - 8) : rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - panelWidth - 8),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        (!panelRef.current || !panelRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      ref={triggerRef}
      className={cn("inline-flex cursor-pointer", className)}
      onClick={() => setIsOpen((v) => !v)}
      title={title}
    >
      {children ?? (
        <span
          className="w-8 h-8 rounded-full border-2 border-black/10 dark:border-white/10 shadow-sm"
          style={{ backgroundColor: color }}
        />
      )}

      {isOpen && isMounted && createPortal(
        <div
          ref={panelRef}
          // Il pannello è in un portal ma per il bubbling degli eventi React
          // resta comunque figlio del trigger (che ha il proprio onClick per
          // aprire/chiudere) — senza stopPropagation, ogni click qui dentro
          // (es. sulla label "Hex" o sull'input, che non fanno stopPropagation
          // come i drag interni di react-colorful) richiude il popover.
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: position.top, left: position.left }}
          className="z-[9999] p-3 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-100"
        >
          <HexColorPicker color={color} onChange={onChange} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-wider shrink-0">Hex</span>
            <HexColorInput
              color={color}
              onChange={onChange}
              prefixed
              placeholder="#000000"
              className="w-full min-w-0 px-2 py-1.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-black dark:text-white text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
