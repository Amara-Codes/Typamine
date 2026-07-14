"use client";

import React, { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";
import Image from "next/image";

export const Logo: React.FC = () => {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return skeleton shell during SSR hydration
    return <div className="w-40 h-11 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />;
  }

  // Choose the correct logo version:
  // logo-dark.png has white text for dark mode; logo.png has black text for light mode
  const logoSrc = theme === "dark" ? "/logo-dark.png" : "/logo.png";
  
  return (
    <Image
      src={logoSrc}
      alt="Typamine Logo"
      width={160}
      height={44}
      priority
      className="object-contain h-11 w-auto select-none"
    />
  );
};
export default Logo;
