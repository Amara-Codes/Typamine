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
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-transparent backdrop-blur-sm transition-transform duration-300 ease-in-out ${
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
          <nav className="hidden md:flex relative space-x-5 font-positivesys text-lg rounded-sm transition-colors duration-300">
            {/* Sfondo del track "tagliato" 3px sopra e sotto: non un box-shadow
                disegnato sopra lo sfondo, ma uno strato retrostante rientrato
                che lascia una fascia trasparente reale — si vede cosa c'è
                dietro l'header invece di un bordo/riga colorata finta. */}
            <div className="absolute inset-x-0 top-[3px] bottom-[3px] -z-10 rounded-sm bg-blue-600/80 dark:bg-red-800/80" />
            <Link
              id="nav-link-ingredients"
              href="/ingredients"
              className="px-3 py-2
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-colors duration-300
              text-black dark:text-white
              hover:text-blue-600 dark:hover:text-red-100
              hover:bg-white dark:hover:bg-red-800
              hover:border-blue-600 dark:hover:border-red-100 "
            >
              Ingredients
            </Link>
            <Link
              id="nav-link-formulas"
              href="/formulas"
              className="px-3 py-2
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-colors duration-300
              text-black dark:text-white
              hover:text-blue-600 dark:hover:text-red-100
              hover:bg-white dark:hover:bg-red-800
              hover:border-blue-600 dark:hover:border-red-100"
            >
              Formulas
            </Link>
            <Link
              id="nav-link-labs"
              href="/labs"
              className="px-3 py-2
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-colors duration-300
              text-black dark:text-white
              hover:text-blue-600 dark:hover:text-red-100
              hover:bg-white dark:hover:bg-red-800
              hover:border-blue-600 dark:hover:border-red-100"
            >
              Labs
            </Link>

            <div id="nav-cell-prescriptions" className="relative group">
              <Link
                id="nav-link-prescriptions"
                href="/prescriptions"
                className="block px-3 py-2
                bg-blue-300 dark:bg-red-500 rounded-t border border-transparent transition-colors duration-300
                text-black dark:text-white
                hover:text-blue-600 dark:hover:text-red-100
                hover:bg-white dark:hover:bg-red-800
                hover:border-blue-600 dark:hover:border-red-100"
              >
                Prescriptions
              </Link>
              {/* Cresce in altezza sotto la cella all'hover, rivelando /archive:
                  overlay assoluto invece di un vero figlio flex, così non
                  spinge/allinea in altezza anche le celle sorelle nella nav. */}
              <div
                className="absolute left-0 top-full w-full z-10 overflow-hidden max-h-0 opacity-0
                group-hover:max-h-12 group-hover:opacity-100
                transition-all duration-300
                rounded-b border border-t-0 border-blue-600 dark:border-red-100
                bg-white dark:bg-red-800"
              >
                <Link
                  id="nav-link-archive"
                  href="/archive"
                  className="block px-3 py-2 text-center whitespace-nowrap
                  text-blue-600 dark:text-red-100
                  hover:bg-blue-50 dark:hover:bg-red-900
                  transition-colors duration-300"
                >
                  Archive
                </Link>
              </div>
            </div>
                        <Link
              id="nav-link-pills"
              href="/pills"
              className="px-3 py-2
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-colors duration-300
              text-black dark:text-white
              hover:text-blue-600 dark:hover:text-red-100
              hover:bg-white dark:hover:bg-red-800
              hover:border-blue-600 dark:hover:border-red-100"
            >
              Pills
            </Link>
          </nav>

          {/* Theme Toggle & Indicators */}
          <div className="flex items-center space-x-4 w-fit">
            <SeventiesThemeToggle variant="mini" size={40} />
          </div>

        </div>
      </div>
    </header>
  );
};
export default Header;
