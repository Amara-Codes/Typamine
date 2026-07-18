"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/common/Card";
import {
  MoveLeft,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderDown,
  X
} from "lucide-react";
import { Button } from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import MinimalLink from "@/components/common/MinimalLink";
import  BaseModal  from "@/components/common/BaseModal";
import { ProviderFontItem } from "@/types";
import { fetchFontshareFonts, FontshareCategory, FontsharePersonality } from "@/lib/fontshare";

const CATEGORY_OPTIONS = [
  { label: "ALL CATEGORIES", value: "ALL" },
  { label: "SANS-SERIF", value: "Sans-Serif" },
  { label: "SERIF", value: "Serif" },
  { label: "MONOSPACE", value: "Monospace" },
  { label: "DISPLAY", value: "Display" },
  { label: "HANDWRITING", value: "Handwriting" }
];

const SORT_OPTIONS = [
  { label: "POPULARITY", value: "popularity" },
  { label: "TRENDING", value: "trending" },
  { label: "ALPHABETICAL", value: "alpha" },
  { label: "NUMBER OF STYLES", value: "style" },
  { label: "DATE ADDED", value: "date" }
];

const SOURCE_OPTIONS = [
  { label: "GOOGLE FONTS", value: "google" },
  { label: "FONTSHARE", value: "fontshare" }
];

const FONTSHARE_CATEGORY_OPTIONS = [
  { label: "ALL CATEGORIES", value: "ALL" },
  ...Object.values(FontshareCategory).map(c => ({ label: c.toUpperCase(), value: c }))
];

const FONTSHARE_PERSONALITY_OPTIONS = [
  { label: "ANY PERSONALITY", value: "ALL" },
  ...Object.values(FontsharePersonality).map(p => ({ label: p.toUpperCase(), value: p }))
];

const FONTSHARE_SORT_OPTIONS = [
  { label: "POPULARITY", value: "popularity" },
  { label: "NAME", value: "name" },
  { label: "HOT", value: "hot" }
];

export default function BulkUploadPage() {
  const router = useRouter();

  // Search & Filters state
  const [source, setSource] = useState<"google" | "fontshare">("google");
  const [personality, setPersonality] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("popularity");
  const [vfOnly, setVfOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Update selection if source changes
  useEffect(() => {
    setCategory("ALL");
    setSortBy("popularity");
    setPersonality("ALL");
  }, [source]);

  // Font data state
  const [fonts, setFonts] = useState<ProviderFontItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Selection state
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(new Set());

  // Preview text state
  const [previewText, setPreviewText] = useState("One day I will find the right words, and they will be simple.");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  // Import operation state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importTotal, setImportTotal] = useState<number>(0);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<{ imported: string[]; skipped: string[]; failed: Array<{ family: string; error: string }> } | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [importLogs]);

  // Fetch fonts listing from API
  const fetchFonts = async () => {
    setIsLoading(true);
    setError(null);
    setIsFilterModalOpen(false); // auto-close modal on search
    try {
      let fetchedFonts: ProviderFontItem[] = [];

      if (source === "google") {
        const mapCat: Record<string, string> = {
          "Sans-Serif": "sans-serif",
          "Serif": "serif",
          "Monospace": "monospace",
          "Display": "display",
          "Handwriting": "handwriting"
        };
        const mappedCategory = mapCat[category] || "ALL";
        const params = new URLSearchParams({
          sort: sortBy,
          category: mappedCategory
        });
        const res = await fetch(`/api/admin/fonts/google-list?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to load fonts list: status ${res.status}`);
        const data = await res.json();
        fetchedFonts = data.items || [];
      } else {
        fetchedFonts = await fetchFontshareFonts({
          limit: 100,
          categories: category !== "ALL" ? [category as FontshareCategory] : [],
          personalities: personality !== "ALL" ? [personality as FontsharePersonality] : [],
          orderBy: sortBy as any
        });
      }

      // Client-side filtering for Variable Fonts (VF)
      if (vfOnly) {
        fetchedFonts = fetchedFonts.filter(font => font.axes && font.axes.length > 0);
      }

      setFonts(fetchedFonts);
      setCurrentPage(0); // Reset page on query
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while fetching fonts.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run search on mount
  useEffect(() => {
    fetchFonts();
  }, []);

  // Filter fonts by search query
  const filteredFonts = useMemo(() => {
    if (!searchQuery.trim()) return fonts;
    const query = searchQuery.toLowerCase();
    return fonts.filter(font => font.family.toLowerCase().includes(query));
  }, [fonts, searchQuery]);

  // Paginated visible fonts
  const visibleFonts = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredFonts.slice(start, start + itemsPerPage);
  }, [filteredFonts, currentPage]);

  const totalPages = Math.ceil(filteredFonts.length / itemsPerPage);

  // Dynamically load stylesheets / font-faces for active page items
  useEffect(() => {
    if (visibleFonts.length === 0) return;

    // Remove old styles
    const oldLink = document.getElementById("dynamic-google-previews");
    if (oldLink) oldLink.remove();
    const oldStyle = document.getElementById("dynamic-fontshare-previews");
    if (oldStyle) oldStyle.remove();

    // 1. Google Fonts
    const googleFonts = visibleFonts.filter(f => f.provider === "google");
    let googleLink: HTMLLinkElement | null = null;
    if (googleFonts.length > 0) {
      const familiesQuery = googleFonts
        .map(font => `family=${font.family.replace(/\s+/g, "+")}`)
        .join("&");
      const url = `https://fonts.googleapis.com/css2?${familiesQuery}&display=swap`;

      googleLink = document.createElement("link");
      googleLink.rel = "stylesheet";
      googleLink.href = url;
      googleLink.id = "dynamic-google-previews";
      document.head.appendChild(googleLink);
    }

    // 2. Fontshare Fonts (inject @font-face rules directly)
    const fontshareFonts = visibleFonts.filter(f => f.provider === "fontshare");
    let fontshareStyle: HTMLStyleElement | null = null;
    if (fontshareFonts.length > 0) {
      fontshareStyle = document.createElement("style");
      fontshareStyle.id = "dynamic-fontshare-previews";

      const cssRules = fontshareFonts.map(font => {
        const fileUrl = font.files["regular"] || Object.values(font.files)[0];
        if (!fileUrl) return "";
        return `
          @font-face {
            font-family: '${font.family}';
            src: url('${fileUrl}');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `;
      }).join("\n");

      fontshareStyle.innerHTML = cssRules;
      document.head.appendChild(fontshareStyle);
    }

    return () => {
      if (googleLink) googleLink.remove();
      if (fontshareStyle) fontshareStyle.remove();
    };
  }, [visibleFonts]);

  // Toggle selection helper
  const toggleSelection = (family: string) => {
    const next = new Set(selectedFamilies);
    if (next.has(family)) {
      next.delete(family);
    } else {
      next.add(family);
    }
    setSelectedFamilies(next);
  };

  // Toggle all selection on the active page
  const togglePageSelection = () => {
    const allSelected = visibleFonts.every(font => selectedFamilies.has(font.family));
    const next = new Set(selectedFamilies);

    visibleFonts.forEach(font => {
      if (allSelected) {
        next.delete(font.family);
      } else {
        next.add(font.family);
      }
    });

    setSelectedFamilies(next);
  };

  // Perform bulk import POST call
  const handleImport = async () => {
    if (selectedFamilies.size === 0) return;

    setIsImporting(true);
    setImportTotal(selectedFamilies.size);
    setImportProgress(0);
    setImportLogs(["Initializing bulk import session..."]);
    setImportResults(null);

    const selectedFontsData = fonts.filter(font => selectedFamilies.has(font.family));

    try {
      setImportLogs(prev => [...prev, `Found ${selectedFontsData.length} selected fonts to import.`, "Batch processing started..."]);

      let totalImported = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      const importedNames: string[] = [];
      const skippedNames: string[] = [];
      const failedData: Array<{ family: string; error: string }> = [];

      for (let i = 0; i < selectedFontsData.length; i++) {
        const fontToImport = selectedFontsData[i];
        try {
          setImportLogs(prev => {
            const next = [...prev, `[${i + 1}/${selectedFontsData.length}] Downloading and processing ${fontToImport.family}...`];
            return next.slice(-40);
          });

          const res = await fetch("/api/admin/fonts/bulk-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fonts: [fontToImport] })
          });

          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }

          const data = await res.json();
          if (data.imported && data.imported.length > 0) {
            totalImported += data.imported.length;
            importedNames.push(...data.imported);
            setImportLogs(prev => [...prev, `✓ Success: ${fontToImport.family} added to database.`].slice(-40));
          }
          if (data.failed && data.failed.length > 0) {
            const errorMsg = data.failed[0].error;
            if (errorMsg.includes("already exists")) {
              totalSkipped += data.failed.length;
              skippedNames.push(fontToImport.family);
              setImportLogs(prev => [...prev, `⏭️ Skipped: ${fontToImport.family} is already in the database.`].slice(-40));
            } else {
              totalFailed += data.failed.length;
              failedData.push(...data.failed);
              setImportLogs(prev => [...prev, `✗ Failed: ${fontToImport.family} - ${errorMsg}`].slice(-40));
            }
          }
        } catch (err: any) {
          totalFailed += 1;
          failedData.push({ family: fontToImport.family, error: err.message });
          setImportLogs(prev => [...prev, `✗ Critical Error for ${fontToImport.family}: ${err.message}`].slice(-40));
        }

        setImportProgress(i + 1);
      }

      setImportResults({
        imported: importedNames,
        skipped: skippedNames,
        failed: failedData
      });

      setImportLogs(prev => [
        `-------------------------`,
        `Batch Completed: Imported ${totalImported}, Skipped ${totalSkipped}, Failed ${totalFailed}.`
      ].slice(-40));
    } catch (err: any) {
      console.error(err);
      setImportLogs(prev => [...prev, `[CRITICAL ERROR] Batch import failed catastrophically: ${err.message}`]);
    }
  };

  const handleCloseImportModal = () => {
    setIsImporting(false);
    setImportResults(null);
    if (importResults && importResults.imported.length > 0) {
      router.push("/admin/fonts");
    }
  };

  return (
    <div className="flex flex-col justify-between h-full">
      
      {/* Container superiore (Top Bar + Griglia Contenuti) */}
      <div className="w-full h-full grow flex flex-col">
        
        {/* ─── Top Controls Bar (No Sticky, No Fixed) ─── */}
        <div className="flex items-center justify-between py-4 gap-4">
          
          {/* Left: Filter Trigger & Status Counter */}
          <div className="flex">
            <Button
              variant="outline"
              size="md"
              roundness="md"
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter &amp; Search
            </Button>
            

          </div>

          {/* Right: Selection Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              roundness="md"
              disabled={filteredFonts.length === 0}
              onClick={togglePageSelection}
              className="font-bold text-[11px]"
            >
              {filteredFonts.length === 0
                ? "Select entire page"
                : visibleFonts.every(font => selectedFamilies.has(font.family))
                  ? "Deselect page"
                  : "Select entire page"
              }
            </Button>
            
            <Button
              variant="primary"
              size="md"
              roundness="md"
              disabled={selectedFamilies.size === 0}
              onClick={handleImport}
              className="flex items-center gap-1.5 whitespace-nowrap text-[11px]"
            >
              <FolderDown className="h-3.5 w-3.5" />
              Import{selectedFamilies.size > 0 ? ` (${selectedFamilies.size})` : ""}
            </Button>
          </div>
        </div>

        {/* ─── Error Banner ─── */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 px-5 py-4">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">API Error</p>
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* ─── Central Dynamic Content Area ─── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20">
            <div className="h-10 w-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-cyan-500 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Fetching Font Data</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Please wait...</p>
            </div>
          </div>
        ) : (
          <div className="grow pb-4">
            {/* List Header Results Meta */}
            {filteredFonts.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Showing <span className="text-zinc-900 dark:text-zinc-100 font-black">
                    {currentPage * itemsPerPage + 1}&ndash;{Math.min((currentPage + 1) * itemsPerPage, filteredFonts.length)}
                  </span>
                  {" "}of {filteredFonts.length.toLocaleString()} families
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  <span className={selectedFamilies.size > 0 ? "text-cyan-600 dark:text-cyan-400 font-black" : ""}>
                    {selectedFamilies.size} selected
                  </span>
                </p>
              </div>
            )}

            {/* Font cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {visibleFonts.map((font) => {
                const isSelected = selectedFamilies.has(font.family);
                const isVar = font.axes && font.axes.length > 0;

                return (
                  <Card
                    key={font.family}
                    roundness="lg"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSelection(font.family)}
                    onKeyDown={(e: React.KeyboardEvent) => (e.key === " " || e.key === "Enter") && toggleSelection(font.family)}
                    className={`cursor-pointer select-none transition-all duration-200 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-blue/50 dark:focus-visible:ring-red/50 ${isSelected
                      ? "border-blue/50 bg-blue/20 dark:border-red/30 dark:!bg-red/5"
                      : "hover:!border-zinc-300 dark:hover:!border-zinc-700"
                      }`}
                  >
                    <div className="h-full py-4 px-3 flex flex-col justify-between">
                      {/* Card header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                            ? "border-blue bg-blue/50 dark:border-red dark:bg-red/50"
                            : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                            }`}>
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-sm font-bold leading-tight truncate transition-colors ${isSelected ? "text-black dark:text-white" : "text-zinc-800 dark:text-zinc-200"}`}>
                              {font.family}
                            </h4>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <span className={`inline-flex items-center text-[8px] font-black uppercase tracking-wider ${isVar ? 'text-cyan-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {isVar ? "Variable" : "Static"}
                          </span>
                        </div>
                      </div>

                      {/* Font preview rendering box */}
                      <div className={`rounded-sm px-4 py-3 border transition-colors ${isSelected
                        ? "bg-cyan-50/50 dark:bg-cyan-500/5 border-cyan-100 dark:border-cyan-500/10"
                        : "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-100 dark:border-zinc-800"
                        }`}>
                        <p
                          style={{ fontFamily: `"${font.family}", sans-serif` }}
                          className="text-lg leading-snug text-zinc-900 dark:text-zinc-100 overflow-hidden text-ellipsis whitespace-nowrap"
                          title={previewText}
                        >
                          {previewText || font.family}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Empty views layout structure */}
            {filteredFonts.length === 0 && fonts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                <div className="h-11 w-11 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No results yet</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 font-semibold uppercase tracking-wider">Open filters and trigger your search setup</p>
                </div>
              </div>
            )}

            {filteredFonts.length === 0 && fonts.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                <AlertCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No matches</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 font-semibold uppercase tracking-wider">Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Bottom Pagination Area (Spinta in basso grazie a justify-between) ─── */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between w-full pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Page {currentPage + 1}{" "}
            <span className="text-zinc-300 dark:text-zinc-600">/</span>{" "}
            {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              roundness="lg"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              className="flex items-center gap-1.5 font-bold"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>

            {/* Pagination sequence items */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page = i;
                if (totalPages > 5) {
                  const halfWindow = 2;
                  const start = Math.max(0, Math.min(currentPage - halfWindow, totalPages - 5));
                  page = start + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-7 min-w-7 px-2 rounded-lg text-[10px] font-black transition-all ${page === currentPage
                      ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/30"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                  >
                    {page + 1}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              roundness="lg"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              className="flex items-center gap-1.5 font-bold"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Search & Filter Modal Panel ─── */}
      {isFilterModalOpen && (
        <BaseModal 
          isOpen={isFilterModalOpen} 
          size="4xl"
          onClose={() => setIsFilterModalOpen(false)}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-cyan-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                  Search &amp; Filter Options
                </h3>
              </div>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 font-black">
                  Font Infrastructure / Source
                </label>
                <Select options={SOURCE_OPTIONS} value={source} onChange={(v) => setSource(v as any)} />
              </div>
              
              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 font-black">
                  Family Name Lookup
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                  <Input
                    id="modal-search"
                    name="search"
                    placeholder="Search by names (e.g. Inter, Space...)"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    autoComplete="off"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 font-black">
                  Category Architecture
                </label>
                <Select options={source === "google" ? CATEGORY_OPTIONS : FONTSHARE_CATEGORY_OPTIONS} value={category} onChange={setCategory} />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 font-black">
                  Sorting Criterion
                </label>
                <Select options={source === "google" ? SORT_OPTIONS : FONTSHARE_SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {source === "fontshare" ? (
                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 font-black">
                    Design Personality
                  </label>
                  <Select options={FONTSHARE_PERSONALITY_OPTIONS} value={personality} onChange={setPersonality} />
                </div>
              ) : (
                <div className="hidden md:block" />
              )}

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 font-black">
                  Technology Specification
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={vfOnly}
                  onClick={() => setVfOnly(v => !v)}
                  className={`flex items-center gap-3 w-full h-[42px] rounded-xl border px-4 transition-all text-left ${vfOnly
                    ? "border-cyan-500/60 bg-cyan-50 dark:bg-cyan-500/10"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60"
                    }`}
                >
                  <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors ${vfOnly ? "border-cyan-500 bg-cyan-500" : "border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800"}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform mt-px ${vfOnly ? "translate-x-3.5" : "translate-x-px"}`} />
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${vfOnly ? "text-cyan-700 dark:text-cyan-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {vfOnly ? "Variable Layouts Only" : "All Typography Types"}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block font-black">
                Interactive Preview Content
              </label>
              <Input
                id="modal-preview"
                name="preview"
                placeholder="Type sample text to preview rendering structures..."
                value={previewText}
                onChange={setPreviewText}
                autoComplete="off"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="secondary"
                size="md"
                roundness="md"
                onClick={() => setIsFilterModalOpen(false)}
                className="font-bold text-[11px]"
              >
                Cancel
              </Button>
              
              <Button
                variant="primary"
                size="md"
                roundness="md"
                onClick={fetchFonts}
                disabled={isLoading}
                className="flex items-center gap-2 font-bold text-[11px]"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {isLoading ? "Querying..." : "Apply & Fetch Fonts"}
              </Button>
            </div>
          </div>
        </BaseModal>
      )}

      {/* ─── Batch Import Terminal Modal ─── */}
      {isImporting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500" />

            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <FolderDown className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-star text-zinc-900 dark:text-white leading-tight">Batch Import</h3>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Downloading &middot; Converting &middot; Saving
                    </p>
                  </div>
                </div>
                {!importResults && (
                  <div className="h-8 w-8 rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-cyan-500 animate-spin shrink-0" />
                )}
                {importResults && (
                  <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  <span>Progress</span>
                  <span className="tabular-nums">{importProgress} / {importTotal}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-500"
                    style={{ width: importTotal > 0 ? `${(importProgress / importTotal) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  <span className="text-[9px] font-bold text-zinc-500 ml-2 uppercase tracking-widest">Import Log</span>
                </div>
                <div ref={terminalRef} className="p-4 h-36 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-1.5 font-mono text-[10px]">
                  {importLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-cyan-500 shrink-0 mt-px">{">"}</span>
                      <span className="text-zinc-300">{log}</span>
                    </div>
                  ))}
                </div>
              </div>

              {importResults && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4 text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block mb-1">Imported</span>
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{importResults.imported.length}</span>
                    </div>
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 block mb-1">Skipped</span>
                      <span className="text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">{importResults.skipped.length}</span>
                    </div>
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-700 dark:text-red-400 block mb-1">Failed</span>
                      <span className="text-3xl font-black text-red-600 dark:text-red-400 leading-none">{importResults.failed.length}</span>
                    </div>
                  </div>

                  {importResults.failed.length > 0 && (
                    <div className="max-h-28 overflow-y-auto rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-3 space-y-1">
                      {importResults.failed.map((fail, index) => (
                        <div key={index} className="flex items-start gap-2 text-[9px] text-red-700 dark:text-red-400 font-bold">
                          <AlertCircle className="h-3 w-3 shrink-0 mt-px" />
                          <span><span className="opacity-70">{fail.family}:</span> {fail.error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant={importResults ? "primary" : "secondary"}
                size="md"
                roundness="md"
                disabled={!importResults}
                onClick={handleCloseImportModal}
                className="w-full flex items-center justify-center gap-2 font-bold"
              >
                {importResults ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Done &middot; View All Fonts
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}