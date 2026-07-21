"use client"

import { DoubleHero } from "@/components/common/DoubleHero";
import { useThemeStore } from "@/store/themeStore";
export default function ArchivePage() {
      const { theme } = useThemeStore();
  const dynamicArchiveBgImageUrl = theme === "dark" ? "/images/archive/double-hero/hero-bg-dark.png" : "/images/archive/double-hero/hero-bg-light.png";
  return (
    <div className="flex flex-col">

      <DoubleHero
        title={
          <>
          
            <span className="text-blue-800 dark:text-red-400 font-positivesys">The Typography's Wayback Machine</span>
           
          </>
        }
        layout="contentCenter"
        description="Browse a vast catalog of fonts, find expert pairings, generate custom assets on the fly, and read our latest typographic prescriptions. Built for modern creators and developers."
        bgImage={dynamicArchiveBgImageUrl}
        fullWidth
      ></DoubleHero>
    </div>
  );
}
