"use client";

import React, { useState, useRef, useEffect } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className={`flex items-center justify-between w-full bg-zinc-900/40 dark:bg-zinc-900/60 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 transition-colors cursor-pointer ${isOpen ? "border-blue dark:border-red" : ""}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full bg-transparent text-zinc-800 dark:text-zinc-200 font-bold hover:text-blue dark:hover:text-red transition-colors outline-none cursor-pointer text-xs"
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <svg 
            className={`w-3 h-3 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue dark:text-red" : "text-zinc-500"}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <ul className="absolute z-50 top-full right-0 mt-2 min-w-[180px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`w-full text-left px-4 py-2.5 text-xs font-haas transition-colors flex items-center justify-between ${
                  value === option.value
                    ? "bg-blue/10 dark:bg-red/10 text-blue dark:text-red font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
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
        </ul>
      )}
    </div>
  );
};
