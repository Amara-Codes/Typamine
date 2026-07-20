"use client"
import React, { useState, useEffect } from "react";
import LivePreview from "@/components/common/LivePreview";
import { PlaygroundFont } from "@/types";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
import LedBar from "@/components/cherry/LedBar";
interface DynamicPlaygroundProps {
  font?: PlaygroundFont;
  hideFontSelector?: boolean;
}

export const DynamicPlayground: React.FC<DynamicPlaygroundProps> = ({
  font,
  hideFontSelector = false
}) => {
  const [activeFont, setActiveFont] = useState<PlaygroundFont>(
    font || { name: "Alte Haas Grotesk", fontFamily: "var(--font-haas)" }
  );
  const [isContainerHovered, setIsContainerHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  useEffect(() => {
    setMounted(true);
  }, []);
  // Definisci i due colori (modificali a tuo piacimento)
  const darkColor = "#936A65"; // Arancione stile K.I.T.T.
  const lightColor = "#CFD3CB"; // Ciano hi-tech per il light mode

  // Seleziona il colore dinamico
  const activeLedColor = theme === "dark" ? darkColor : lightColor;

  return (
    <section 
      className="group border border-zinc-200 dark:border-zinc-800 bg-ocragray-100 dark:bg-ocragray-900 rounded-lg overflow-hidden transition-colors duration-300"
      onMouseEnter={() => setIsContainerHovered(true)}
      onMouseLeave={() => setIsContainerHovered(false)}
    >

      {/* Header of the Sandbox Panel */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <h2 className="font-haas text-xs font-bold tracking-widest text-blue uppercase">
          Live Test
        </h2>

        <LedBar
          orientation="horizontal"
          direction="normal"
          height="10px"
          width="300px"
          ledCount={16}
          trailSize="5%"
          speed={4000}
          // Passiamo il colore dinamico solo dopo il mount (fallback al darkColor lato server)
          color={mounted ? activeLedColor : darkColor}
          isHovered={isContainerHovered}
          hoverMode="frenzy"
          pausedByDefault={false}
        />

      </div>

      {/* Content Layout */}
      <div className={cn("grid grid-cols-1", !hideFontSelector && "lg:grid-cols-4")}>


        {/* Interactive Live Preview */}
        <div className={cn(!hideFontSelector && "lg:col-span-3", "p-6")}>
          <LivePreview
            fontName={activeFont.name}
            fontFamilyCss={activeFont.fontFamily}
            fontUrl={activeFont.fontUrl}
            initialSize={48}
            minSize={16}
            maxSize={120}
            isVariable
            showTextColorControl
            showBgColorControl
            showLineHeightControl
            showLetterSpacingControl
          />
        </div>
      </div>
    </section>
  );
};
