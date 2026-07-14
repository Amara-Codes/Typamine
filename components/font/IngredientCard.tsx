import React from "react";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { Ingredient } from "@/types";
import { getDeterministicFormula } from "@/lib/utils";

interface FontCardProps {
    font: Ingredient;
    idx: number;
}

// Funzioni di supporto per identificare vocali e consonanti
const isVowel = (char: string) => /[aeiouAEIOU]/.test(char);
const isConsonant = (char: string) => /[a-zA-Z]/.test(char) && !isVowel(char);

// Estrae la prima vocale o la prima consonante trovata in una stringa
const getFirstCharOfType = (str: string, type: 'vowel' | 'consonant'): string | null => {
    for (const char of str) {
        if (type === 'vowel' && isVowel(char)) return char;
        if (type === 'consonant' && isConsonant(char)) return char;
    }
    return null;
};

// Logica per ottenere la seconda lettera della "formula" in modo deterministico
const getSecondLetter = (str: string, seed: number): string => {
    if (!str) return 'x'; // Fallback di sicurezza

    const pickVowel = seed % 2 === 0;
    let char = getFirstCharOfType(str, pickVowel ? 'vowel' : 'consonant');
    
    // Fallback: se avevamo scelto vocale ma non ce ne sono, prendiamo una consonante (e viceversa)
    if (!char) {
        char = getFirstCharOfType(str, pickVowel ? 'consonant' : 'vowel');
    }
    
    return char || 'x'; // Ultimo fallback se la stringa contiene solo numeri/simboli
};

export const GetSymbol = ({ fontName }: { fontName: string }): string => {
    if (!fontName) return "Zx";

    // Dividiamo per spazi multipli per evitare problemi con doppi spazi accidentali
    const words = fontName.trim().split(/\s+/); 
    
    const firstLetter = words[0].charAt(0);
    // Creiamo un "seed" deterministico basato sulla stringa stessa (es. lunghezza + codice del primo carattere)
    const seed = fontName.length + fontName.charCodeAt(0);
    let secondLetter = 'x';

    if (words.length === 1) {
        // CASO 1: Singola parola
        // Cerchiamo nel resto della parola (escludendo la prima lettera)
        const remainingStr = words[0].slice(1);
        secondLetter = getSecondLetter(remainingStr, seed);
    } else {
        // CASO 2: Più parole
        // Prendiamo la seconda parola, e la terza se esiste
        const targetWords = words.slice(1, 3); 
        
        // Scegliamo in base al seed invece che Math.random() per mantenere la consistenza in SSR
        const chosenWordIndex = (targetWords.length > 1 && seed % 2 === 0) ? 1 : 0;
        const chosenWord = targetWords[chosenWordIndex];
        
        secondLetter = getSecondLetter(chosenWord, seed);
    }

    // Formattazione stile Tavola Periodica: Prima Maiuscola, seconda minuscola
    const rawSymbol = firstLetter + secondLetter;
    return rawSymbol.charAt(0).toUpperCase() + rawSymbol.charAt(1).toLowerCase();
};

export const IngredientCard: React.FC<FontCardProps> = ({ font, idx }) => {
    return (
        <Link
            href={"/ingredients/" + font.slug}
            className="border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 rounded-lg p-2 transition-all flex flex-col justify-between group relative overflow-hidden"
        >
            {/* Corner tag index */}
            <div className="absolute top-2 right-2 font-haas text-[9px] text-zinc-400 dark:text-zinc-600">
                REF-0{idx + 1}
            </div>

            {/* Chemical Element layout */}
            <div className="space-y-4 mt-4">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 ml-2 border border-[#00cece]/30 rounded bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center font-haas font-bold text-lg text-[#00cece] group-hover:border-[#00cece] group-hover:glow-cyan transition-all">
                        {GetSymbol({ fontName: font.name })}
                    </div>
                    <div className="text-right font-haas">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block">{font.category}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold block">
                            {font.formula || getDeterministicFormula(font.name)}
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="ps-2 font-haas font-bold text-sm text-foreground">{font.name}</h3>
                    {font.creator && (
                        <p className="ps-2 font-haas text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">CREATOR: {font.creator}</p>
                    )}
                </div>
            </div>

            {/* Live Preview Sample */}
            <div className={`my-4 py-2 border-y border-zinc-100 dark:border-zinc-900 text-center truncate`} style={{ fontSize: "18px", fontFamily: font.variants?.[0]?.fontFamilyName }}>
                AaBbCcDdEeFf 123
            </div>

            <div className="pt-2 pe-2 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-900">
                <span className="font-haas text-[10px] text-zinc-500 dark:text-zinc-400">OUR SCORE: <span className="text-[#00cece] font-bold">{font.rating}</span></span>
                <span className="flex flex-row items-center gap-2 font-haas text-[10px] text-red hover:underline transition-colors">
                    TEST_NOW
                    <MoveRight size={12} className="icon-altalenante" />
                </span>
            </div>
        </Link>
    );
};
