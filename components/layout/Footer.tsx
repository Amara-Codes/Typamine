"use client";

import React from "react";
import GlyphTypeface from "@/components/layout/GlyphTypeface";

export const Footer: React.FC = () => {
  return (
    <footer className="relative min-h-[100dvh] w-full flex flex-col border-t border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-[#09090b]/40 font-haas text-[10px] text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div className="relative inline-block pr-[0.5em] pb-[0.55em] text-[clamp(3rem,14vw,14rem)] text-blue dark:text-red">
          <GlyphTypeface
            text="TYPAMINE"
            className="font-star text-black dark:text-white"
          />

          {/* Quadrato "chimico" caratteristico del logo (vedi DynamicLogo,
              dove sta un po' più in basso rispetto al testo — pb maggiore
              qui riproduce lo stesso distacco). Rotazione sempre "attaccata"
              ma in pausa (animation-play-state): all'hover riparte da dove
              si era fermata invece di scattare da 0deg, e quando il mouse
              esce si blocca ferma nella posizione corrente invece di
              resettarsi — play-state pausa/riprende, niente JS. */}
          <div className="absolute bottom-0 right-0 w-[0.57em] h-[0.57em] bg-blue dark:bg-red shadow-[0_0_15px_currentColor] blur-[1px] brightness-110 rounded-xs cursor-pointer [animation:spin_4s_linear_infinite] [animation-play-state:paused] hover:[animation-play-state:running]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full flex flex-col md:flex-row items-center gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>© {new Date().getFullYear()} TYPAMINE STUDIO - ALL RIGHTS RESERVED.</span>
          <span className="text-zinc-500 dark:text-zinc-400">|</span>
          <span className="hover:text-blue transition-colors cursor-pointer">TERMS_OF_SERVICE</span>
          <span className="text-zinc-500 dark:text-zinc-400">|</span>
          <span className="hover:text-blue transition-colors cursor-pointer">PRIVACY_POLICY</span>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
