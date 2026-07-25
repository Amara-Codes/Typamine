"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, Tag as TagIcon, X } from "lucide-react";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/common/Button";

export interface TagPickerTag {
  id: string;
  name: string;
}

interface TagPickerProps {
  label?: string;
  tags: TagPickerTag[];
  value: string[];
  onChange: (ids: string[]) => void;
  emptyLabel?: string;
}

// Stessa strategia del FontPicker: con centinaia di tag una lista piatta di
// pulsanti diventa immediatamente ingestibile (niente ricerca, tutto sempre
// visibile). Qui il modale ha ricerca live + multi-selezione (i tag scelti
// restano visibili come chip rimovibili anche a modale chiuso).
const PREVIEW_LIMIT = 80;

export default function TagPicker({ label, tags, value, onChange, emptyLabel = "No tags available." }: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTags = tags.filter((t) => value.includes(t.id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, query]);

  const visible = filtered.slice(0, PREVIEW_LIMIT);
  const hiddenCount = filtered.length - visible.length;

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const toggleTag = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const removeTag = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-wider text-black dark:text-white mb-1.5 flex items-center gap-1.5">
          <TagIcon className="w-3.5 h-3.5" />
          {label}
        </label>
      )}

      <div className="p-3 border border-black/10 dark:border-white/10 rounded-lg bg-white/50 dark:bg-zinc-900/50 space-y-3">
        <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
          {selectedTags.length === 0 && (
            <span className="text-xs text-zinc-400 italic">No tags selected yet.</span>
          )}
          {selectedTags.map((t) => (
            <span
              key={t.id}
              className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-black text-white dark:bg-white dark:text-black"
            >
              {t.name}
              <button type="button" onClick={() => removeTag(t.id)} className="hover:opacity-70" title={`Remove ${t.name}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={tags.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-black/20 dark:border-white/20 text-zinc-500 dark:text-zinc-400 hover:border-black/40 dark:hover:border-white/40 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TagIcon className="w-3.5 h-3.5" />
          {tags.length === 0 ? emptyLabel : "Add tags..."}
        </button>
      </div>

      {isOpen && (
        <BaseModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <BaseModal.Header onClose={() => setIsOpen(false)}>
            <h3 className="text-lg font-star font-bold text-black dark:text-white">
              {label || "Select tags"}
            </h3>
          </BaseModal.Header>
          <BaseModal.Body>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${tags.length} tags by name...`}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="max-h-96 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                {visible.map((t) => {
                  const isSelected = value.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`w-full flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                        isSelected ? "bg-blue/10 dark:bg-red/10" : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="text-sm text-black dark:text-white truncate">{t.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-blue dark:text-red shrink-0" />}
                    </button>
                  );
                })}

                {visible.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-zinc-400">
                    No tags match &quot;{query}&quot;.
                  </div>
                )}
              </div>

              {hiddenCount > 0 && (
                <p className="text-[10px] text-zinc-400 text-center">
                  {hiddenCount} more tag(s) hidden &mdash; refine your search to narrow the list.
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
