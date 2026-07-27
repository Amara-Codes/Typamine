"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Label } from "@/components/common/Input";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string; // Nuova prop aggiunta
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 180 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Il menu opzioni va renderizzato in un portal su document.body: da dentro
  // le card/colonne del form (ognuna con il proprio "relative z-N" per gestire
  // ombre/overlap tra loro) l'elenco assoluto restava confinato allo stacking
  // context del genitore, finendo dietro le card con z-index maggiore anche
  // se il suo z-index locale era più alto. Il portal + posizionamento fixed
  // calcolato dal bounding rect del trigger risolve il problema ovunque.
  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, 180);
    setPosition({ top: rect.bottom + 8, left: rect.right - width, width });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close dropdown on outside click (trigger e lista portalata sono in due
  // sottoalberi DOM separati, vanno esclusi entrambi)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        (!listRef.current || !listRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`space-y-1.5 w-full ${className}`}>

      {label && (
        <div className="flex justify-between items-center select-none mb-0">
          <Label className="mb-0 select-none">{label}</Label>
        </div>
      )}

      <div className="relative" ref={triggerRef}>
        <div
className={`
    flex items-center justify-between w-full
    bg-bluegray-100 dark:bg-redgray-900/50
    border rounded-md px-3 py-2 transition-all duration-200
    cursor-pointer
    /* Gestione dinamica dei bordi */
    ${isOpen
      ? "border-blue dark:border-red"
      : "border-bluegray-200 dark:border-redgray-800 hover:border-bluegray-400 dark:hover:border-redgray-600"
    }
  `}
          onClick={() => setIsOpen(!isOpen)}
        >
          <button
            type="button"
            className="flex items-center justify-between w-full bg-transparent text-bluegray-900 dark:text-redgray-200 outline-none cursor-pointer"
          >
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            <svg
              className={`w-3 h-3 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue dark:text-red" : "text-bluegray-900 dark:text-redgray-200"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && isMounted && createPortal(
        <ul
          ref={listRef}
          style={{ position: "fixed", top: position.top, left: position.left, width: position.width }}
          className="z-[9999] bg-bluegray-100 dark:bg-redgray-900 border border-bluegray-200 dark:border-redgray-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`w-full text-left px-4 py-2.5 text-xs font-haas transition-colors flex items-center justify-between ${
                  value === option.value
                    ? "bg-blue/20 dark:bg-red/10 text-black dark:text-red font-bold"
                    : "text-bluegray-800 dark:text-redgray-200 hover:bg-blue/10 dark:hover:bg-red/5 hover:text-black dark:hover:text-white"
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
                {value === option.value && (
                  <span className="text-blue dark:text-red text-[10px] tracking-widest">[✓]</span>
                )}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
};
