"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Check, Type as TypeIcon, Loader2, Plus } from "lucide-react";
import BaseModal from "@/components/common/BaseModal";
import InViewTrigger from "@/components/common/InViewTrigger";
import { getFontsPage } from "@/lib/actions/font";

interface MultiFontPickerProps {
  label?: string;
  /** Font id selezionati, in ordine di ciclo — l'ordine con cui sono stati aggiunti. */
  values: string[];
  onChange: (ids: string[]) => void;
  max: number;
  placeholder?: string;
}

const PAGE_SIZE = 30;

// Stessa modalità self-fetching di FontPicker (scroll infinito a pagine da
// 30), ma multi-selezione con limite massimo invece di singola scelta — il
// picker resta aperto tra un toggle e l'altro, così si possono selezionare
// più font in fila prima di chiuderlo ("quit selection modality").
export default function MultiFontPicker({
  label,
  values,
  onChange,
  max,
  placeholder = "Add a font...",
}: MultiFontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setDebouncedQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["multi-font-picker", debouncedQuery],
    queryFn: ({ pageParam }) => getFontsPage({ search: debouncedQuery, cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: isOpen,
  });

  const fetchedItems = useMemo(() => infiniteQuery.data?.pages.flatMap((p) => p.items) ?? [], [infiniteQuery.data]);
  const lastPageSize = infiniteQuery.data?.pages[infiniteQuery.data.pages.length - 1]?.items.length ?? 0;
  const triggerIndex = Math.max(0, fetchedItems.length - Math.ceil(lastPageSize / 2));

  const fontFaceCss = useMemo(() => {
    return fetchedItems
      .map((f) => {
        const woff2 = f.variants?.[0]?.woff2Url;
        if (!woff2) return "";
        return `@font-face { font-family: 'MultiFontPicker_${f.id}'; src: url('${woff2}') format('woff2'); font-display: swap; }`;
      })
      .join("\n");
  }, [fetchedItems]);

  const atMax = values.length >= max;

  const toggle = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else if (!atMax) {
      onChange([...values, id]);
    }
  };

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
        <span className="min-w-0 truncate text-sm text-zinc-500">
          {values.length > 0 ? `${values.length} / ${max} fonts selected` : placeholder}
        </span>
        <span className="flex items-center gap-1 text-zinc-400 shrink-0 ml-2">
          <Plus className="h-4 w-4" />
        </span>
      </button>

      {isOpen && (
        <BaseModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <BaseModal.Header onClose={() => setIsOpen(false)}>
            <div>
              <h3 className="text-lg font-rezland font-bold text-black dark:text-white">{label || "Select fonts"}</h3>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">
                {values.length} / {max} selected
              </p>
            </div>
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
                  placeholder="Search fonts by name..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="max-h-96 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                {fetchedItems.map((f, idx) => {
                  const isSelected = values.includes(f.id);
                  const disabled = !isSelected && atMax;
                  const hasWoff2 = Boolean(f.variants?.[0]?.woff2Url);

                  const row = (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(f.id)}
                      className={`w-full flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${isSelected
                          ? "bg-blue/10 dark:bg-red/10"
                          : disabled
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                    >
                      <span className="min-w-0">
                        <span
                          className="block text-base text-black dark:text-white truncate"
                          style={hasWoff2 ? { fontFamily: `"MultiFontPicker_${f.id}", sans-serif` } : undefined}
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

                  if (idx === triggerIndex && infiniteQuery.hasNextPage) {
                    return (
                      <InViewTrigger
                        key={f.id}
                        onVisible={() => {
                          if (!infiniteQuery.isFetchingNextPage) infiniteQuery.fetchNextPage();
                        }}
                      >
                        {row}
                      </InViewTrigger>
                    );
                  }

                  return <div key={f.id}>{row}</div>;
                })}

                {(infiniteQuery.isLoading || infiniteQuery.isFetchingNextPage) && (
                  <div className="px-4 py-3 flex items-center justify-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading fonts...
                  </div>
                )}

                {fetchedItems.length === 0 && !infiniteQuery.isLoading && (
                  <div className="px-4 py-8 text-center text-xs text-zinc-400">
                    No fonts match &quot;{query}&quot;.
                  </div>
                )}
              </div>

              {atMax && <p className="text-[10px] text-zinc-500 text-center">Maximum of {max} fonts reached.</p>}
            </div>
          </BaseModal.Body>
          <BaseModal.Footer>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-wider rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
            >
              Done <TypeIcon className="h-3.5 w-3.5" />
            </button>
          </BaseModal.Footer>
        </BaseModal>
      )}
    </div>
  );
}
