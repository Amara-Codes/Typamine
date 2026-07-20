"use client";

import React, { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";
// IMPORTA IL FILE CSS LOCALE QUI SOTTO
import "./SeventiesThemeToggle.css";

export interface SeventiesThemeToggleProps {
  size?: number | string;
  variant?: 'full' | 'mini';
}

export const SeventiesThemeToggle: React.FC<SeventiesThemeToggleProps> = ({ size = 78, variant = 'full' }) => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Sync with theme state and localStorage on mount to prevent hydration flickers
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("typamine-theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to dark as requested
      setTheme("dark");
    }

    // Ascolta le modifiche al localStorage provenienti da altre tab
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "typamine-theme" && (e.newValue === "dark" || e.newValue === "light")) {
        setTheme(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [setTheme]);

  const isDark = theme === "dark";
  const isMini = variant === 'mini';

  // Calculate padding based on size (roughly 12% of the container)
  const rawPadding = typeof size === 'number' ? size * 0.08 : null;
  const paddingStyle = rawPadding !== null ? `${rawPadding}px` : '8%';

  if (!mounted) {
    return (
      <div className="flex items-center p-2 gap-3 border border-black/5 dark:border-white/5 rounded-md bg-bluegray-200 dark:bg-redgray-800">
        <div 
          style={{ 
            width: typeof size === 'number' ? `${size}px` : size, 
            height: typeof size === 'number' ? `${size}px` : size 
          }}
          className="bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse shrink-0" 
        />
        {variant === 'full' && (
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 1. VARIANT FULL (Expanded Sidebar) */}
      <div 
        className="w-full flex items-center p-2 gap-3 border border-black/5 dark:border-white/5 rounded-md bg-bluegray-200 dark:bg-redgray-800"
        style={{
          opacity: isMini ? 0 : 1,
          transform: isMini ? "translateY(15px) scale(0.95)" : "translateY(0) scale(1)",
          pointerEvents: isMini ? "none" : "auto",
          transition: isMini
            ? "opacity 0s, transform 0s"
            : "opacity 0.4s ease-in-out 0.15s, transform 0.4s ease-in-out 0.15s",
        }}
      >
        <button
          onClick={toggleTheme}
          style={{ 
            width: typeof size === 'number' ? `${size}px` : size, 
            height: typeof size === 'number' ? `${size}px` : size, 
            padding: paddingStyle 
          }}
          className="shrink-0 bg-[#222] border-2 border-[#151515] rounded-sm flex items-center justify-center select-none cursor-pointer active:scale-95 transition-transform duration-100 shadow-[inset_0_4px_4px_rgba(0,0,0,0.6),0_8px_16px_-4px_rgba(0,0,0,0.7)]"
          title="Toggle Lab State"
        >
          {/* CORPO DELLA GEMMA PRISMATICA ANNI '70 */}
          <div 
            className={`w-full h-full rounded-md relative overflow-hidden transition-all duration-300 flex items-center justify-center border border-[#111]
              ${!isDark 
                ? "bg-gradient-to-br from-[#ffaa33] via-[#ff6600] to-[#993300] gem-glow-amber-vintage" 
                : "bg-gradient-to-br from-[#4a2300] via-[#2d1600] to-[#150b00] gem-dark-unlit-vintage"
              }`}
          >
            {/* Pattern Catadiottro (Griglia a micro-quadrati) */}
            <div className="absolute inset-0 vintage-prismatic-lens-pattern mix-blend-overlay opacity-80" />
            
            {/* Riflesso bombato superiore della plastica */}
            <div className="absolute top-[5%] left-[8%] right-[8%] h-[15%] bg-gradient-to-b from-white/40 to-transparent rounded-full filter blur-[0.5px]" />
            
            {/* Lampadina interna / Filamento neon */}
            <div className={`w-[20%] h-[30%] rounded-full bg-white transition-all duration-300 filter blur-[1.5px]
              ${!isDark ? "opacity-90 scale-100" : "opacity-0 scale-50"}`} 
            />
          </div>
        </button>
        
        {/* ETICHETTA DI TESTO IN STILE APPARECCHIATURA TECNICA */}
        <div className="flex-1 flex flex-col justify-center text-left font-haas select-none">
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-900 dark:text-red-200 leading-tight mb-0.5 whitespace-nowrap">
            Typamine&reg;
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 text-bluegray-800 dark:text-redgray-200 group-hover:text-zinc-800 dark:group-hover:text-zinc-300 whitespace-nowrap">
            {isDark ? "Dark mode" : "Light mode"}
          </span>
        </div>
      </div>

      {/* 2. VARIANT MINI (Collapsed Sidebar) */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: isMini ? 1 : 0,
          transform: isMini ? "scale(1) translateY(0)" : "scale(0.8) translateY(15px)",
          pointerEvents: isMini ? "auto" : "none",
          transition: isMini
            ? "opacity 0.4s ease-in-out 0.15s, transform 0.4s ease-in-out 0.15s"
            : "opacity 0s, transform 0s",
        }}
      >
        <button
          onClick={toggleTheme}
          style={{ 
            width: "28px", 
            height: "28px", 
            padding: "0px" 
          }}
          className="shrink-0 flex items-center justify-center select-none cursor-pointer active:scale-95 transition-transform duration-100 bg-transparent border-0 shadow-none"
          title="Toggle Lab State"
        >
          <div 
            className={`w-full h-full rounded-sm relative overflow-hidden transition-all duration-500 flex items-center justify-center border-0
              ${!isDark 
                ? "bg-gradient-to-br from-[#ffaa33] via-[#ff6600] to-[#993300] gem-glow-amber-vintage" 
                : "bg-gradient-to-br from-[#4a2300] via-[#2d1600] to-[#150b00] gem-dark-unlit-vintage"
              }`}
          >
            {/* Pattern Catadiottro (Griglia a micro-quadrati) */}
            <div className="absolute inset-0 vintage-prismatic-lens-pattern mix-blend-overlay opacity-80" />
            
            {/* Riflesso bombato superiore della plastica */}
            <div className="absolute top-[5%] left-[8%] right-[8%] h-[15%] bg-gradient-to-b from-white/40 to-transparent rounded-full filter blur-[0.5px]" />
            
            {/* Lampadina interna / Filamento neon */}
            <div className={`w-[20%] h-[30%] rounded-full bg-white transition-all duration-300 filter blur-[1.5px]
              ${!isDark ? "opacity-90 scale-100" : "opacity-0 scale-50"}`} 
            />
          </div>
        </button>
      </div>
    </div>
  );
};