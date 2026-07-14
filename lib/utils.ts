import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import CHEMICAL_COMPOUNDS from "./chemical-compounds.json";

export const getDeterministicFormula = (seedStr: string): string => {
    if (!seedStr) return "C6H12O6";
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed += seedStr.charCodeAt(i);
    }
    const index = seed % CHEMICAL_COMPOUNDS.length;
    return CHEMICAL_COMPOUNDS[index];
};
