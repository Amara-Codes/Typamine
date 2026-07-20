"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter as FilterIcon, Check } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import BaseModal from "@/components/common/BaseModal";

export interface SearchSortFilterOption {
  label: string;
  value: string;
}

export interface SearchSortFilterTag {
  id: string;
  name: string;
}

export interface SearchSortFilterProps {
  searchPlaceholder?: string;
  searchParamKey?: string;
  sortOptions?: SearchSortFilterOption[];
  sortParamKey?: string;
  categoryOptions?: SearchSortFilterOption[];
  categoryParamKey?: string;
  ratingOptions?: SearchSortFilterOption[];
  ratingParamKey?: string;
  /** Tag disponibili per il filtro multiplo — selezione a "OR": più tag scelti, più risultati (unione, non intersezione). */
  tags?: SearchSortFilterTag[];
  tagsParamKey?: string;
  filtersModalTitle?: string;
  className?: string;
}

// Componente riutilizzabile per ricerca + ordinamento + filtri, pensato per
// liste sia pubbliche (fonts, pairing) che admin. Legge/scrive tutto sui
// search params dell'URL, quindi la pagina che lo usa deve solo leggerli
// lato server per interrogare il DB.
export function SearchSortFilter({
  searchPlaceholder = "Search...",
  searchParamKey = "search",
  sortOptions = [],
  sortParamKey = "sort",
  categoryOptions = [],
  categoryParamKey = "category",
  ratingOptions = [],
  ratingParamKey = "rating",
  tags = [],
  tagsParamKey = "tags",
  filtersModalTitle = "Filters",
  className = "",
}: SearchSortFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get(searchParamKey) || "";
  const currentSort = searchParams.get(sortParamKey) || sortOptions[0]?.value || "";
  const currentCategory = searchParams.get(categoryParamKey) || categoryOptions[0]?.value || "ALL";
  const currentRating = searchParams.get(ratingParamKey) || ratingOptions[0]?.value || "ALL";
  const currentTagIds = (searchParams.get(tagsParamKey) || "").split(",").filter(Boolean);

  const hasFilterModal = categoryOptions.length > 0 || ratingOptions.length > 0 || tags.length > 0;

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Stato locale per la ricerca + debounce: senza buffering locale, ogni
  // tasto premuto farebbe subito router.push, con l'input che aspetta un
  // giro di navigazione prima che il carattere successivo "si registri".
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(currentSearch);

  if (currentSearch !== prevUrlSearch) {
    setPrevUrlSearch(currentSearch);
    setSearchValue(currentSearch);
  }

  useEffect(() => {
    if (searchValue === currentSearch) return;
    const timeout = setTimeout(() => {
      updateParams({ [searchParamKey]: searchValue || null });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Modale filtri: stato bozza, applicato tutto insieme con un solo push
  // invece di una navigazione per ogni checkbox/select toccato.
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState(currentCategory);
  const [draftRating, setDraftRating] = useState(currentRating);
  const [draftTagIds, setDraftTagIds] = useState<string[]>(currentTagIds);

  const openFilterModal = () => {
    setDraftCategory(currentCategory);
    setDraftRating(currentRating);
    setDraftTagIds(currentTagIds);
    setIsFilterModalOpen(true);
  };

  const toggleDraftTag = (tagId: string) => {
    setDraftTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const applyFilters = () => {
    updateParams({
      [categoryParamKey]: categoryOptions.length > 0 ? draftCategory : null,
      [ratingParamKey]: ratingOptions.length > 0 ? draftRating : null,
      [tagsParamKey]: draftTagIds.length > 0 ? draftTagIds.join(",") : null,
    });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setDraftCategory(categoryOptions[0]?.value || "ALL");
    setDraftRating(ratingOptions[0]?.value || "ALL");
    setDraftTagIds([]);
    updateParams({
      [categoryParamKey]: null,
      [ratingParamKey]: null,
      [tagsParamKey]: null,
    });
    setIsFilterModalOpen(false);
  };

  const activeFilterCount =
    (categoryOptions.length > 0 && currentCategory !== (categoryOptions[0]?.value || "ALL") ? 1 : 0) +
    (ratingOptions.length > 0 && currentRating !== (ratingOptions[0]?.value || "ALL") ? 1 : 0) +
    currentTagIds.length;

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}>
      <div className="flex-1 min-w-0">
        <Input
          id="search-sort-filter-search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={setSearchValue}
        />
      </div>

      {sortOptions.length > 0 && (
        <div className="w-full sm:w-auto sm:min-w-[170px] shrink-0">
          <Select
            options={sortOptions}
            value={currentSort}
            onChange={(val) => updateParams({ [sortParamKey]: val })}
          />
        </div>
      )}

      {hasFilterModal && (
        <Button
          variant="outline"
          size="md"
          roundness="md"
          onClick={openFilterModal}
          className="flex items-center gap-2 shrink-0"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          {filtersModalTitle}
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue dark:bg-red text-black text-[10px] font-black">
              {activeFilterCount}
            </span>
          )}
        </Button>
      )}

      {hasFilterModal && (
        <BaseModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} size="md">
          <BaseModal.Header onClose={() => setIsFilterModalOpen(false)}>
            {filtersModalTitle}
          </BaseModal.Header>
          <BaseModal.Body>
            <div className="space-y-6">
              {categoryOptions.length > 0 && (
                <div>
                  <label className="text-[10px] text-bluegray-800 dark:text-redgray-200 uppercase tracking-wider block mb-2 font-bold">
                    Category
                  </label>
                  <Select options={categoryOptions} value={draftCategory} onChange={setDraftCategory} />
                </div>
              )}

              {ratingOptions.length > 0 && (
                <div>
                  <label className="text-[10px] text-bluegray-800 dark:text-redgray-200 uppercase tracking-wider block mb-2 font-bold">
                    Minimum Rating
                  </label>
                  <Select options={ratingOptions} value={draftRating} onChange={setDraftRating} />
                </div>
              )}

              {tags.length > 0 && (
                <div>
                  <label className="text-[10px] text-bluegray-800 dark:text-redgray-200 uppercase tracking-wider block mb-2 font-bold">
                    Tags — select multiple, results include any match
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border border-black/10 dark:border-white/10 rounded-lg bg-white/50 dark:bg-zinc-900/50 max-h-48 overflow-y-auto">
                    {tags.map((t) => {
                      const isSelected = draftTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleDraftTag(t.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                              : "bg-transparent text-zinc-600 dark:text-zinc-400 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </BaseModal.Body>
          <BaseModal.Footer>
            <div className="flex items-center justify-between gap-3 w-full">
              <Button variant="ghost" size="md" roundness="md" onClick={clearFilters}>
                Clear All
              </Button>
              <Button variant="primary" size="md" roundness="md" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </BaseModal.Footer>
        </BaseModal>
      )}
    </div>
  );
}

export default SearchSortFilter;
