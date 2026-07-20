"use client";

import React from "react";
import DynamicLogo from "@/components/layout/DynamicLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-[#09090b]/40 py-6 font-haas text-[10px] text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
      <DynamicLogo  height={640} className="mx-auto" squareGlow/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-4">
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
