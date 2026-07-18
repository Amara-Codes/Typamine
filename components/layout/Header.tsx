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
      className={`fixed top-0 left-0 right-0 z-50 w-full  bg-transparent backdrop-blur-sm transition-transform duration-300 ease-in-out ${
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
          <nav className="hidden md:flex space-x-5 font-positivesys text-lg bg-blue-600/80 dark:bg-red-800/80 rounded-sm shadow-[inset_0_3px_0_0_#f9f9fb,_inset_0_-3px_0_0_#f9f9fb] dark:shadow-[inset_0_3px_0_0_#030303,_inset_0_-3px_0_0_#030303] transition-colors duration-500">
            <Link 
              id="nav-link-ingredients"
              href="/ingredients" 
              className="px-3 py-2 
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-all
              text-black dark:text-black 
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
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-all
              text-black dark:text-black 
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
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-all
              text-black dark:text-black 
              hover:text-blue-600 dark:hover:text-red-100 
              hover:bg-white dark:hover:bg-red-800   
              hover:border-blue-600 dark:hover:border-red-100"
            >
              Labs
            </Link>

            <Link 
              id="nav-link-prescriptions"
              href="/prescriptions" 
              className="px-3 py-2 
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-all
              text-black dark:text-black 
              hover:text-blue-600 dark:hover:text-red-100 
              hover:bg-white dark:hover:bg-red-800   
              hover:border-blue-600 dark:hover:border-red-100"
            >
              Prescriptions
            </Link>
                        <Link 
              id="nav-link-pills"
              href="/pills" 
              className="px-3 py-2 
              bg-blue-300 dark:bg-red-500 rounded border border-transparent transition-all
              text-black dark:text-black 
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
