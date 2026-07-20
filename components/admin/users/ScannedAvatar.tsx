"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import LedBar from "@/components/cherry/LedBar"; // Assicurati che il percorso sia corretto
import { useThemeStore } from "@/store/themeStore"; // <-- AGGIORNA CON IL PERCORSO REALE DEL TUO STORE

interface ScannedAvatarProps {
  avatarSrc: string | null;
  userName: string;
}

export default function ScannedAvatar({ avatarSrc, userName }: ScannedAvatarProps) {
  const [mounted, setMounted] = useState(false);
  
  // Leggi il tema corrente dallo store Zustand
  const theme = useThemeStore((state) => state.theme);

  // Evita problemi di idratazione (SSR vs Client) aspettando il primo montaggio
  useEffect(() => {
    setMounted(true);
  }, []);

  // Definisci i due colori (modificali a tuo piacimento)
  const darkColor = "#936A65"; // Arancione stile K.I.T.T.
  const lightColor = "#CFD3CB"; // Ciano hi-tech per il light mode
  
  // Seleziona il colore dinamico
  const activeLedColor = theme === "dark" ? darkColor : lightColor;

  return (
    <div
      className="w-full mt-12 py-4 bg-zinc-100 dark:bg-zinc-900/40 text-black dark:text-white rounded-lg flex items-center justify-between px-4 relative transition-colors duration-300 overflow-hidden isolate"
    >
      
      {/* Background a linee orizzontali in z-[-1] */}
      <div 
        className="absolute inset-0 pointer-events-none z-[-1] opacity-[0.04] dark:opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
          backgroundAttachment: 'fixed'
        }}
      />

      {/* Immagine a Sinistra */}
      <div className="h-48 w-48 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-[3px] border-white dark:border-zinc-800/50 shadow-lg overflow-hidden flex items-center justify-center shrink-0 relative z-10">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={userName}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 bg-white dark:bg-zinc-900"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-cyan-500/20 via-zinc-200 dark:via-zinc-800 to-red-500/10 flex items-center justify-center">
            <User className="h-10 w-10 opacity-30" />
          </div>
        )}
      </div>

      {/* Singola LedBar a Destra */}
      <div className="relative z-10 shadow-lg">
        <LedBar
          orientation="vertical"
          direction="normal"
          height="180px"
          width="8px"
          ledCount={16}
          trailSize="12%"
          speed={4000}
          // Passiamo il colore dinamico solo dopo il mount (fallback al darkColor lato server)
          color={mounted ? activeLedColor : darkColor} 
          isHovered={false}
          hoverMode="frenzy" 
          pausedByDefault={true}
        />
      </div>

    </div>
  );
}