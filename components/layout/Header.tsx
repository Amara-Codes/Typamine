"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SeventiesThemeToggle } from "@/components/common/SeventiesThemeToggle";
import { DynamicLogo } from "@/components/layout/DynamicLogo";

export const Header: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Threshold to trigger hide/show behavior (e.g. after scrolling 40px)
      if (currentScrollY > 40) {
        if (currentScrollY > lastScrollY) {
          // Scrolling down -> hide header
          setIsVisible(false);
        } else {
          // Scrolling up -> show header
          setIsVisible(true);
        }
      } else {
        // Close to the top -> always show header
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full border-b border-zinc-200/20 dark:border-zinc-800/20 bg-transparent backdrop-blur-md transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 text-foreground hover:opacity-90 transition-opacity">
              <DynamicLogo height={64}  squareGlow />
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex space-x-1 font-haas text-xs">
            <Link 
              id="nav-link-ingredients"
              href="/ingredients" 
              className="px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-blue dark:hover:text-red hover:bg-zinc-100 dark:hover:bg-zinc-900/50 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all"
            >
              [01] INGREDIENTS
            </Link>
            <Link 
              id="nav-link-formulas"
              href="/formulas" 
              className="px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-blue dark:hover:text-red hover:bg-zinc-100 dark:hover:bg-zinc-900/50 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all"
            >
              [02] FORMULAS
            </Link>
            <Link 
              id="nav-link-labs"
              href="/labs" 
              className="px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-blue dark:hover:text-red hover:bg-zinc-100 dark:hover:bg-zinc-900/50 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all"
            >
              [03] LABS
            </Link>

            <Link 
              id="nav-link-prescriptions"
              href="/prescriptions" 
              className="px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-blue dark:hover:text-red hover:bg-zinc-100 dark:hover:bg-zinc-900/50 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all"
            >
              [04] PRESCRIPTIONS
            </Link>
                        <Link 
              id="nav-link-pills"
              href="/pills" 
              className="px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-blue dark:hover:text-red hover:bg-zinc-100 dark:hover:bg-zinc-900/50 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all"
            >
              [04] PILLS
            </Link>
          </nav>

          {/* Theme Toggle & Indicators */}
          <div className="flex items-center space-x-4">
            <SeventiesThemeToggle variant="mini" size={40} />
          </div>

        </div>
      </div>
    </header>
  );
};
export default Header;
