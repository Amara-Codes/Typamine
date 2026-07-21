"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, Type as TypeIcon } from "lucide-react";
import BaseModal from "@/components/common/BaseModal";

export interface FontPickerFont {
  id: string;
  name: string;
  category?: string;
  creator?: string | null;
  variants?: { woff2Url?: string | null }[];
}

interface FontPickerProps {
  label?: string;
  fonts: FontPickerFont[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

// Con centinaia di font in libreria una <select> piatta è inutilizzabile
// (nessun modo di cercare, nessuna anteprima): questo picker apre un modale
// con ricerca live e ogni riga renderizzata nel proprio font reale, ma
// inietta le regole @font-face solo per i risultati effettivamente visibili
// per non dover caricare/renderizzare centinaia di web font in un colpo solo.
const PREVIEW_LIMIT = 60;

export default function FontPicker({
  label,
  fonts,
  value,
  onChange,
  placeholder = "Select a font...",
}: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = fonts.find((f) => f.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fonts;
    return fonts.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.category || "").toLowerCase().includes(q) ||
        (f.creator || "").toLowerCase().includes(q)
    );
  }, [fonts, query]);

  const visible = filtered.slice(0, PREVIEW_LIMIT);
  const hiddenCount = filtered.length - visible.length;

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const fontFaceCss = useMemo(() => {
    return visible
      .map((f) => {
        const woff2 = f.variants?.[0]?.woff2Url;
        if (!woff2) return "";
        return `@font-face { font-family: 'FontPicker_${f.id}'; src: url('${woff2}') format('woff2'); font-display: swap; }`;
      })
      .join("\n");
  }, [visible]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full bg-zinc-900/40 dark:bg-zinc-900/60 border border-bluegray-300 dark:border-redgray-700 hover:border-bluegray-400 dark:hover:border-redgray-600 rounded-lg px-3 py-2 transition-all text-left"
      >
        <span className="min-w-0 truncate">
          {selected ? (
            <>
              <span className="block text-sm font-bold text-black dark:text-white truncate">{selected.name}</span>
              {selected.category && (
                <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">{selected.category}</span>
              )}
            </>
          ) : (
            <span className="text-sm text-zinc-500">{placeholder}</span>
          )}
        </span>
        <TypeIcon className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <BaseModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <BaseModal.Header onClose={() => setIsOpen(false)}>
            <h3 className="text-lg font-star font-bold text-black dark:text-white">
              {label || "Select a font"}
            </h3>
          </BaseModal.Header>
          <BaseModal.Body>
            {fontFaceCss && <style>{fontFaceCss}</style>}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${fonts.length} fonts by name, category or creator...`}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="max-h-96 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                {visible.map((f) => {
                  const isSelected = f.id === value;
                  const hasWoff2 = Boolean(f.variants?.[0]?.woff2Url);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        onChange(f.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                        isSelected ? "bg-blue/10 dark:bg-red/10" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="min-w-0">
                        <span
                          className="block text-base text-black dark:text-white truncate"
                          style={hasWoff2 ? { fontFamily: `"FontPicker_${f.id}", sans-serif` } : undefined}
                        >
                          {f.name}
                        </span>
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                          {f.category}
                          {f.creator ? ` · ${f.creator}` : ""}
                        </span>
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-blue dark:text-red shrink-0" />}
                    </button>
                  );
                })}

                {visible.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-zinc-400">
                    No fonts match &quot;{query}&quot;.
                  </div>
                )}
              </div>

              {hiddenCount > 0 && (
                <p className="text-[10px] text-zinc-400 text-center">
                  {hiddenCount} more font(s) hidden &mdash; refine your search to narrow the list.
                </p>
              )}
            </div>
          </BaseModal.Body>
        </BaseModal>
      )}
    </div>
  );
}
