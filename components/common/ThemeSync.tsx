"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export function ThemeSync() {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    // Sincronizza il tema in base allo storage su tutte le tab
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "typamine-theme" && (e.newValue === "dark" || e.newValue === "light")) {
        setTheme(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [setTheme]);

  return null;
}
