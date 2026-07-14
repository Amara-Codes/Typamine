"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { Formula } from "@/types";

interface FormulaCardProps {
  formula: Formula;
}

// Funzione helper per generare il codice estetico
const getAestheticCode = (): string => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const getRandomLetter = () => letters.charAt(Math.floor(Math.random() * letters.length));
  
  const part1 = getRandomLetter();
  const part2 = getRandomLetter() + getRandomLetter();
  // Genera un numero da 0 a 99 e aggiunge uno zero iniziale se necessario (es. "04")
  const part3 = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  
  return `${part1}-${part2}-${part3}`;
};

export const FormulaCard: React.FC<FormulaCardProps> = ({ formula }) => {
  // Inizializziamo con il codice fornito, oppure con una stringa vuota/placeholder
  const [displayCode, setDisplayCode] = useState<string>(formula.code || "---");

  useEffect(() => {
    // Generiamo il codice estetico solo lato client per evitare errori di idratazione in Next.js
    if (!formula.code) {
      setDisplayCode(getAestheticCode());
    }
  }, [formula.code]);

  return (
    <Link 
      href={formula.href}
      className="border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950 p-4 rounded-lg flex flex-col sm:flex-row sm:items-stretch justify-between gap-4 transition-all group hover:border-zinc-400 dark:hover:border-zinc-700 cursor-pointer"
    >
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-haas text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded">
            {displayCode}
          </span>
          <h3 className="font-haas text-lg font-bold text-foreground">{formula.name}</h3>
        </div>
        <p className="">{formula.description}</p>
        <p className="font-haas text-sm text-zinc-500 dark:text-zinc-400 mt-2">INGREDIENTS: {formula.fonts.slice(0, 2).map(f => f.name).join(" + ") + "..."} </p>
      </div>

      <div className="text-right font-haas text-[10px] flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-zinc-100 dark:border-zinc-900 pt-2 sm:pt-0.5 sm:pb-1">
        <div className="flex align-bottom">
          <span className="text-zinc-500 dark:text-zinc-300 font-bold">FORMULATED: </span>
          <span className="ps-2 text-zinc-500">{formula.createdAt}</span></div>
        <div className="flex flex-row items-center gap-2 font-haas text-[10px] text-red transition-colors">
            READ_FULL
            <MoveRight size={12} className="icon-altalenante" />
        </div>
      </div>
    </Link>
  );
};