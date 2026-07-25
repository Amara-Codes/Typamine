"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, Type as TypeIcon, X } from "lucide-react";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/common/Button";

export interface FontMultiPickerFont {
  id: string;
  name: string;
  category?: string;
  variants?: { woff2Url?: string | null }[];
}

interface FontMultiPickerProps {
  label?: string;
  fonts: FontMultiPickerFont[];
  value: string[];
  onChange: (ids: string[]) => void;
  emptyLabel?: string;
}

// Combina la ricerca live + preview reale del FontPicker (single-select) con
// il multi-select a chip del TagPicker: qui serve entrambe le cose perché
// ArchivePost.fonts è una relazione many-to-many, non un singolo font.
const PREVIEW_LIMIT = 60;

export default function FontMultiPicker({
  label,
  fonts,
  value,
  onChange,
  emptyLabel = "No fonts available.",
}: FontMultiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedFonts = fonts.filter((f) => value.includes(f.id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fonts;
    return fonts.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.category || "").toLowerCase().includes(q)
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
        return `@font-face { font-family: 'FontMultiPicker_${f.id}'; src: url('${woff2}') format('woff2'); font-display: swap; }`;
      })
      .join("\n");
  }, [visible]);

  const toggleFont = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const removeFont = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
          {label}
        </label>
      )}

      <div className="p-3 border border-black/10 dark:border-white/10 rounded-lg bg-white/50 dark:bg-zinc-900/50 space-y-3">
        <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
          {selectedFonts.length === 0 && (
            <span className="text-xs text-zinc-400 italic">No fonts selected yet.</span>
          )}
          {selectedFonts.map((f) => (
            <span
              key={f.id}
              className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-black text-white dark:bg-white dark:text-black"
            >
              {f.name}
              <button type="button" onClick={() => removeFont(f.id)} className="hover:opacity-70" title={`Remove ${f.name}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={fonts.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-black/20 dark:border-white/20 text-zinc-500 dark:text-zinc-400 hover:border-black/40 dark:hover:border-white/40 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TypeIcon className="w-3.5 h-3.5" />
          {fonts.length === 0 ? emptyLabel : "Add fonts..."}
        </button>
      </div>

      {isOpen && (
        <BaseModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <BaseModal.Header onClose={() => setIsOpen(false)}>
            <h3 className="text-lg font-star font-bold text-black dark:text-white">
              {label || "Select fonts"}
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
                  placeholder={`Search ${fonts.length} fonts by name or category...`}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="max-h-96 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                {visible.map((f) => {
                  const isSelected = value.includes(f.id);
                  const hasWoff2 = Boolean(f.variants?.[0]?.woff2Url);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFont(f.id)}
                      className={`w-full flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                        isSelected ? "bg-blue/10 dark:bg-red/10" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="min-w-0">
                        <span
                          className="block text-base text-black dark:text-white truncate"
                          style={hasWoff2 ? { fontFamily: `"FontMultiPicker_${f.id}", sans-serif` } : undefined}
                        >
                          {f.name}
                        </span>
                        {f.category && (
                          <span className="block text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{f.category}</span>
                        )}
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
          <BaseModal.Footer>
            <Button
              type="button"
              variant="primary"
              size="md"
              roundness="md"
              onClick={() => setIsOpen(false)}
              fullWidth
              className="flex items-center justify-center gap-2 font-bold"
            >
              <Check className="h-4 w-4" />
              Done ({value.length} selected)
            </Button>
          </BaseModal.Footer>
        </BaseModal>
      )}
    </div>
  );
}
