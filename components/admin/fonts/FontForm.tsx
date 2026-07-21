"use client";

import React, { useActionState, useState, useEffect } from "react";
import { saveFont } from "@/lib/actions/font";
import { Plus, Trash2, Sliders, Type, AlertCircle, Loader2, Tag as TagIcon, Check } from "lucide-react";
import { Select } from "@/components/common/Select";
import { Input, Label } from "@/components/common/Input";
import FormActions from "@/components/admin/common/FormActions";
import LivePreview from "@/components/common/LivePreview";
import BaseModal from "../../common/BaseModal";
import { Button } from "@/components/common/Button";
import { CustomRange } from "@/components/common/CustomRange";
import SavingOverlay from "@/components/admin/common/SavingOverlay";

interface VariantItem {
  id: string;
  label: string;
  weight: number;
  style: string;
  woff2Url: string;
  isNew?: boolean;
}

const CATEGORY_OPTIONS = [
  { label: "ALL_COMPOUNDS", value: "ALL" },
  { label: "MONOSPACE", value: "Monospace" },
  { label: "SANS-SERIF", value: "Sans-Serif" },
  { label: "NEO-GROTESQUE", value: "Neo-Grotesque" },
  { label: "GEOMETRIC SANS", value: "Geometric Sans" },
  { label: "SERIF", value: "Serif" },
  { label: "DECORATIVE", value: "Decorative" },
];

export default function FontForm({ font, tags = [] }: { font?: any; tags?: any[] }) {
  const saveAction = (prevState: any, formData: FormData) => saveFont(prevState, formData, font?.id);
  const [errorMessage, dispatch] = useActionState(saveAction, undefined);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [name, setName] = useState(font?.name || "");
  const [slug, setSlug] = useState(font?.slug || "");
  const [category, setCategory] = useState(font?.category || "Sans-Serif");
  const [isVariable, setIsVariable] = useState<boolean>(font?.isVariable || false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    (font?.tags || []).map((t: any) => t.id)
  );

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionMessage, setConversionMessage] = useState<string>("");
  const [isDetectingCategory, setIsDetectingCategory] = useState<boolean>(false);
  const [categorySearchStatus, setCategorySearchStatus] = useState<"idle" | "searching" | "found" | "not_found">("idle");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, variantId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    setConversionMessage(`Converting ${file.name} to WOFF2...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/fonts/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to convert font");
      }

      const isVarHeader = response.headers.get("X-Is-Variable") || response.headers.get("x-is-variable");
      const isVar = isVarHeader === "true";
      const fontNameHeader = response.headers.get("X-Font-Name") || response.headers.get("x-font-name");
      const fontName = fontNameHeader ? decodeURIComponent(fontNameHeader) : "";

      console.log(`[Font Upload Client] isVar: ${isVar} (Header: ${isVarHeader}), Name: ${fontName}`);

      const blob = await response.blob();
      const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".woff2";
      const convertedFile = new File([blob], newFileName, { type: "font/woff2" });

      if (fontName) {
        setName(fontName);
        const generatedSlug = fontName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
        setSlug(generatedSlug);

        // Detect category from Google Fonts asynchronously
        (async () => {
          try {
            setIsDetectingCategory(true);
            setCategorySearchStatus("searching");
            const gfResponse = await fetch(`/api/admin/fonts/google-category?family=${encodeURIComponent(fontName)}`);
            if (gfResponse.ok) {
              const gfData = await gfResponse.json();
              if (gfData.category) {
                const mapping: Record<string, string> = {
                  "sans-serif": "Sans-Serif",
                  "serif": "Serif",
                  "monospace": "Monospace",
                  "display": "Decorative",
                  "handwriting": "Decorative"
                };
                const mapped = mapping[gfData.category.toLowerCase()];
                if (mapped) {
                  setCategory(mapped);
                  setCategorySearchStatus("found");
                } else {
                  setCategorySearchStatus("not_found");
                }
              } else {
                setCategorySearchStatus("not_found");
              }
            } else {
              setCategorySearchStatus("not_found");
            }
          } catch (gfError) {
            console.error("Failed to detect font category:", gfError);
            setCategorySearchStatus("not_found");
          } finally {
            setIsDetectingCategory(false);
          }
        })();
      }

      const dt = new DataTransfer();
      dt.items.add(convertedFile);
      const inputEl = document.getElementById(`fileInput-${variantId}`) as HTMLInputElement;
      if (inputEl) {
        inputEl.files = dt.files;
      }

      setVariants(prev =>
        prev.map(v => {
          if (v.id === variantId) {
            return { ...v, woff2Url: newFileName };
          }
          return v;
        })
      );

      if (isVar) {
        setIsVariable(true);
        setVariants([{
          id: variantId,
          label: "Variable",
          weight: 400,
          style: "normal",
          woff2Url: newFileName,
        }]);
      } else if (isVariable) {
        setIsVariable(false);
        setVariants([{
          id: variantId,
          label: "Regular",
          weight: 400,
          style: "normal",
          woff2Url: newFileName,
        }]);
      }

    } catch (err: any) {
      console.error(err);
      alert(`Error converting font: ${err.message || err}`);
      if (e.target) e.target.value = "";
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    if (!font?.id && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generated);
    }
  }, [name, font?.id]);

  useEffect(() => {
    if (errorMessage) {
      setShowErrorModal(true);
    }
  }, [errorMessage]);

  const [variants, setVariants] = useState<VariantItem[]>(
    font?.variants || [
      { id: "v-initial", label: "Regular", weight: 400, style: "normal", woff2Url: "", isNew: true }
    ]
  );

  const addVariant = () => {
    const newId = `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setVariants(prev => [
      ...prev,
      { id: newId, label: "Regular", weight: 400, style: "normal", woff2Url: "", isNew: true }
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariantField = (id: string, field: keyof VariantItem, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  return (
    <form action={dispatch} className="max-w-6xl ml-auto space-y-8 pb-20 transition-colors duration-300">
      <FormActions
        backLink="/admin/fonts"
        backLabel="Back to fonts list"
        buttonLabel={font ? "Update Font" : "Create Font"}
      />

      <div className="bg-zinc-100/40 dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl transition-all">
        <div className="flex flex-col justify-end mb-10 border-b border-black/5 dark:border-white/5 pb-6">
          <h3 className="text-4xl font-star text-black dark:text-white">Font Infos {font?.id && ' / '}<span className="text-blue dark:text-red">{font?.name}</span></h3>
          <p className="text-[10px] ps-2 uppercase tracking-widest font-bold text-bluegray-800 dark:text-redgray-200 mt-1">Configure all the font informations</p>
        </div>

        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main Area (left column, span 2) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Iniezione del Componente Isolato Live Preview */}
            {font?.id && (
              <LivePreview
                fontName={name || "Unnamed Font"}
                fontUrl={variants[0]?.woff2Url}
                isVariable={isVariable}
                initialWeight={variants[0]?.weight}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <Input
                id="name"
                name="name"
                label="Font Name"
                value={name}
                onChange={setName}
                placeholder="e.g. Alte Haas Grotesk"
                required
                autoComplete="off"
              />
              <Input
                id="slug"
                name="slug"
                label="Slug (URL Path)"
                value={slug}
                onChange={setSlug}
                placeholder="e.g. alte-haas-grotesk"
                required
                autoComplete="off"
              />
            </div>

            {/* LED Status Indicator for Variable Font */}
            <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/40 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-md transition-all duration-300">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVariable ? "bg-blue dark:bg-red" : "bg-zinc-400 dark:bg-zinc-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isVariable ? "bg-blue dark:bg-red" : "bg-zinc-500"}`}></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white leading-none">
                  Font Format: {isVariable ? "Variable Font Mode" : "Static Font Mode"}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1 font-bold">
                  {isVariable ? "Single file contains all font variations (auto-detected)" : "Multiple variant files required (auto-detected)"}
                </span>
              </div>
              <input type="hidden" name="isVariable" value={isVariable ? "true" : "false"} />
            </div>

            {/* Variants Configuration Matrix */}
            <div className="border-t border-black/5 dark:border-white/5 pt-8">
              {isVariable ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-bluegray-800 dark:text-redgray-200">Variable Font File</h3>
                  </div>

                  <div className="bg-white/30 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-6 transition-all hover:bg-white/60 dark:hover:bg-white/10 relative">
                    <input type="hidden" name="variantId" value={variants[0]?.id || "v-variable"} />
                    <input type="hidden" name="variantLabel" value="Variable" />
                    <input type="hidden" name="variantWeight" value="400" />
                    <input type="hidden" name="variantStyle" value="normal" />
                    <input type="hidden" name="variantWoff2Url" value={variants[0]?.woff2Url || ""} />

                    <div>
                      <Label>Font File</Label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <input
                          type="file"
                          name="variantFile"
                          accept=".ttf,.otf,.woff,.woff2"
                          className="hidden"
                          id={`fileInput-${variants[0]?.id || "v-variable"}`}
                          onChange={(e) => handleFileChange(e, variants[0]?.id || "v-variable")}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`fileInput-${variants[0]?.id || "v-variable"}`)?.click()}
                          className="px-5 py-2.5 bg-blue dark:bg-red text-white hover:opacity-90 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-blue/20 dark:shadow-red/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          Upload Font File
                        </button>
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                          {variants[0]?.woff2Url ? `Selected: ${variants[0]?.woff2Url}` : "No file uploaded (Supports TTF, OTF, WOFF, WOFF2)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-bluegray-800 dark:text-redgray-200">Variant Styles & Font Files</h3>
                    <Button
                      onClick={addVariant}
                      variant="outline"
                      size="sm"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        Add Variant
                      </div>

                    </Button>
                  </div>

                  <div className="space-y-6">
                    {variants.map((v, idx) => (
                      <div
                        key={v.id}
                        className="bg-white/30 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-6 transition-all hover:bg-white/60 dark:hover:bg-white/10 relative"
                      >
                        <input type="hidden" name="variantId" value={v.id} />

                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(v.id)}
                            className="absolute top-4 right-4 p-2 text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors"
                            title="Remove variant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                        <div className="space-y-6">
                          <div className="border-t border-black/5 dark:border-white/5 pt-4">
                            <Label>Font File</Label>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <input
                                type="file"
                                name="variantFile"
                                accept=".ttf,.otf,.woff,.woff2"
                                className="hidden"
                                id={`fileInput-${v.id}`}
                                onChange={(e) => handleFileChange(e, v.id)}
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById(`fileInput-${v.id}`)?.click()}
                                className="px-5 py-2.5 bg-blue dark:bg-red text-white hover:opacity-90 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-blue/20 dark:shadow-red/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                                Upload Font File
                              </button>
                              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                                {v.woff2Url ? `Selected: ${v.woff2Url}` : "No file uploaded (Supports TTF, OTF, WOFF, WOFF2)"}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            {/* Input Label */}
                            <Input
                              id={`variantLabel-${v.id}`}
                              name="variantLabel"
                              label="Variant Weight Label"
                              value={v.label}
                              onChange={(val) => updateVariantField(v.id, "label", val)}
                              placeholder="e.g. Regular, Bold, Italic"
                              required
                            />

                            {/* Select Style */}
                            <Select
                              label="Style"
                              options={[
                                { label: "Normal", value: "normal" },
                                { label: "Italic", value: "italic" }
                              ]}
                              value={v.style}
                              onChange={(val) => updateVariantField(v.id, "style", val)}
                              placeholder="Style"
                            />
                            <input type="hidden" name="variantStyle" value={v.style} />

                            {/* Custom Range */}
                            <CustomRange
                              label="Weight Value"
                              min={100}
                              max={900}
                              step={100}
                              value={v.weight}
                              onChange={(val) => updateVariantField(v.id, "weight", val)}
                              glow={true}
                              showMinMax={false}
                              thumbColor="bg-blue dark:bg-red"
                              textColor="text-blue dark:text-red"
                            />
                            <input type="hidden" name="variantWeight" value={v.weight} />
                          </div>
                        </div>

                        {/* Manual URL Input Override */}
                        <div className="mt-4">
                          <Input
                            id={`variantWoff2Url-${v.id}`}
                            name="variantWoff2Url"
                            label="Asset URL Override (Optional)"
                            value={v.woff2Url.startsWith("http") ? v.woff2Url : ""}
                            onChange={(val) => updateVariantField(v.id, "woff2Url", val)}
                            placeholder="e.g. https://cdn.typamine.com/fonts/my-font.woff2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area (right column, metadata card, span 1) */}
          <div className="lg:col-span-1">
            <div className="bg-white/20 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
              <div className="border-b border-black/5 dark:border-white/5 pb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-bluegray-800 dark:text-redgray-200">Metadata & Details</h3>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">Classification and additional details</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label>Category</Label>
                  <div className="relative">
                    <Select
                      options={CATEGORY_OPTIONS}
                      value={category}
                      onChange={setCategory}
                      placeholder="Select a category"
                    />
                    <input type="hidden" name="category" value={category} />

                    {isDetectingCategory && (
                      <div className="absolute inset-0 bg-blue/10 border border-blue/30 dark:bg-red/10 dark:border-red/30 rounded-xl backdrop-blur-xs transition-all duration-300 animate-in fade-in cursor-not-allowed z-10"></div>
                    )}
                  </div>

                  {categorySearchStatus === "searching" && (
                    <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400 mt-1.5 animate-pulse">
                      searching info on google fonts...
                    </p>
                  )}
                  {categorySearchStatus === "found" && (
                    <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500 mt-1.5 flex items-center gap-1">
                      <span className="h-1 w-1 bg-emerald-500 rounded-full"></span>
                      category found on google fonts
                    </p>
                  )}
                  {categorySearchStatus === "not_found" && (
                    <p className="text-[10px] uppercase tracking-widest font-black text-red-500 mt-1.5 flex items-center gap-1">
                      <span className="h-1 w-1 bg-red-500 rounded-full"></span>
                      category not found on google fonts
                    </p>
                  )}
                </div>

                <Input
                  id="creator"
                  name="creator"
                  label="Creator / Foundry"
                  defaultValue={font?.creator}
                  placeholder="e.g. Haas Type Foundry (leave empty for 'Typamine Import')"
                  autoComplete="off"
                />

                <Input
                  id="rating"
                  name="rating"
                  label="Typamine Rating"
                  defaultValue={font?.rating || "9.5"}
                  placeholder="e.g. 9.8"
                  required
                  autoComplete="off"
                />

                <div>
                  <Label icon={TagIcon}>Tags</Label>
                  <div className="flex flex-wrap gap-2 p-3 border border-black/10 dark:border-white/10 rounded-lg bg-white/50 dark:bg-zinc-900/50 max-h-36 overflow-y-auto">
                    {tags.map((t) => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleTagToggle(t.id)}
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
                    {tags.length === 0 && (
                      <span className="text-xs text-zinc-400 italic">
                        No tags available. You can create tags in /admin/tags.
                      </span>
                    )}
                  </div>
                  {selectedTagIds.map((tagId) => (
                    <input key={tagId} type="hidden" name="tagIds" value={tagId} />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <BaseModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} size="md">
        <BaseModal.Header onClose={() => setShowErrorModal(false)}>
          <div className="flex items-end gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-star text-black dark:text-white">Font Save Failed</h2>
          </div>
        </BaseModal.Header>
        <BaseModal.Body>
          <div className="space-y-4">
            <p className="text-zinc-500 dark:text-zinc-400 font-haas">
              We encountered an error while trying to save the font configuration:
            </p>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">
              {errorMessage}
            </div>
          </div>
        </BaseModal.Body>
        <BaseModal.Footer>
          <button
            type="button"
            onClick={() => setShowErrorModal(false)}
            className="w-full py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-tighter hover:bg-red-600 transition-all shadow-lg"
          >
            Review Settings
          </button>
        </BaseModal.Footer>
      </BaseModal>
      {isConverting && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="p-10 flex flex-col items-center justify-center gap-6 w-full mx-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue/20 dark:bg-red/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-12 w-12 text-blue dark:text-red animate-spin relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-star text-2xl text-white tracking-wide">{conversionMessage}</p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black animate-pulse">Converting font format to WOFF2...</p>
            </div>
          </div>
        </div>
      )}
      <SavingOverlay message="Saving Font..." />
    </form>
  );
}