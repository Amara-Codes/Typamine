"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, Image as ImageIcon, Trash2, RefreshCw, Check, Tag as TagIcon } from "lucide-react";
import { savePairing } from "@/lib/actions/pairing";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import FormActions from "@/components/admin/common/FormActions";
import SavingOverlay from "@/components/admin/common/SavingOverlay";

interface PairingFormProps {
  initialData?: any;
  fonts: any[];
  tags: any[];
}

export default function PairingForm({ initialData, fonts, tags }: PairingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Basic Form Fields
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!initialData?.slug);
  const [description, setDescription] = useState(initialData?.description || "");
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [primaryFontId, setPrimaryFontId] = useState(initialData?.primaryFontId || (fonts[0]?.id || ""));
  const [secondaryFontId, setSecondaryFontId] = useState(initialData?.secondaryFontId || (fonts[1]?.id || fonts[0]?.id || ""));
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    (initialData?.tags || []).map((t: any) => t.id)
  );

  // Image Upload & Canvas States
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"canvas" | "upload">("canvas");

  // Canvas Config States
  const [primaryText, setPrimaryText] = useState("Typamine Studio");
  const [secondaryText, setSecondaryText] = useState("Harmonious Typography Pairing & Design System");
  const [bgColor, setBgColor] = useState("#0C0B0A");
  const [primaryColor, setPrimaryColor] = useState("#F5F6F9");
  const [secondaryColor, setSecondaryColor] = useState("#9CA3AF");
  const [layoutPreset, setLayoutPreset] = useState<"stacked" | "centered" | "sideBySide">("stacked");
  const [primaryFontSize, setPrimaryFontSize] = useState(56);
  const [secondaryFontSize, setSecondaryFontSize] = useState(24);
  const [primaryY, setPrimaryY] = useState(260);
  const [secondaryY, setSecondaryY] = useState(390);
  const [paddingX, setPaddingX] = useState(70);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [swapFonts, setSwapFonts] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Find selected font objects
  const primaryFontObj = fonts.find((f) => f.id === primaryFontId);
  const secondaryFontObj = fonts.find((f) => f.id === secondaryFontId);

  // Inject @font-face style tags for preview
  const primaryWoff2 = primaryFontObj?.variants?.[0]?.woff2Url;
  const secondaryWoff2 = secondaryFontObj?.variants?.[0]?.woff2Url;

  const primaryFamilyName = primaryFontObj ? `Canvas_${primaryFontObj.name.replace(/\s+/g, "_")}` : "sans-serif";
  const secondaryFamilyName = secondaryFontObj ? `Canvas_${secondaryFontObj.name.replace(/\s+/g, "_")}` : "sans-serif";

  // Auto-slug generator
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (autoSlug) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Draw Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // Fill Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Grid / Scanline pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Border line inside canvas
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Decorative Watermark / Tag
    ctx.fillStyle = primaryColor;
    ctx.font = "bold 14px sans-serif";
    ctx.letterSpacing = "4px";
    ctx.textAlign = "left";
    ctx.fillText("Typamine®", 70, 80);

    ctx.fillStyle = secondaryColor;
    ctx.font = "14px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${primaryFontObj?.name || "Primary"} + ${secondaryFontObj?.name || "Secondary"}`, width - 70, 80);

    // Determine font families for Title and Body text based on swapFonts setting
    const titleFamily = swapFonts ? secondaryFamilyName : primaryFamilyName;
    const bodyFamily = swapFonts ? primaryFamilyName : secondaryFamilyName;

    // Apply alignment setting
    ctx.textAlign = textAlign;

    if (layoutPreset === "stacked" || layoutPreset === "centered") {
      const actualAlign = layoutPreset === "centered" ? "center" : textAlign;
      ctx.textAlign = actualAlign;
      
      const xPos = actualAlign === "center" ? width / 2 : actualAlign === "right" ? width - paddingX : paddingX;

      // Primary Title
      ctx.fillStyle = primaryColor;
      ctx.font = `bold ${primaryFontSize * 1.5}px "${titleFamily}", sans-serif`;
      ctx.fillText(primaryText, xPos, primaryY);

      // Secondary Body
      ctx.fillStyle = secondaryColor;
      ctx.font = `${secondaryFontSize * 1.3}px "${bodyFamily}", sans-serif`;

      // Word wrapping for secondary text
      const words = secondaryText.split(" ");
      let line = "";
      let yPos = secondaryY;
      const maxWidth = width - (paddingX * 2);

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, xPos, yPos);
          line = words[n] + " ";
          yPos += secondaryFontSize * 1.6;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, xPos, yPos);

    } else if (layoutPreset === "sideBySide") {
      // Left side Primary (aligned left/center/right relative to half canvas)
      ctx.textAlign = textAlign;
      const leftX = textAlign === "center" ? width / 4 : textAlign === "right" ? width / 2 - paddingX : paddingX;
      
      ctx.fillStyle = primaryColor;
      ctx.font = `bold ${primaryFontSize * 1.3}px "${titleFamily}", sans-serif`;
      ctx.fillText(primaryText, leftX, primaryY);

      // Right side Secondary
      ctx.textAlign = textAlign;
      const rightX = textAlign === "center" ? (3 * width) / 4 : textAlign === "right" ? width - paddingX : width / 2 + paddingX;
      
      ctx.fillStyle = secondaryColor;
      ctx.font = `${secondaryFontSize * 1.2}px "${bodyFamily}", sans-serif`;
      
      // Word wrapping for secondary text in split screen
      const words = secondaryText.split(" ");
      let line = "";
      let yPos = secondaryY;
      const maxWidth = width / 2 - paddingX;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, rightX, yPos);
          line = words[n] + " ";
          yPos += secondaryFontSize * 1.5;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, rightX, yPos);
    }

    // Export Data URL
    const dataUrl = canvas.toDataURL("image/png");
    setCanvasDataUrl(dataUrl);
  };

  // Re-draw when config parameters change, forcing font load
  useEffect(() => {
    let active = true;

    // Draw immediately (with fallback font if not yet loaded)
    drawCanvas();

    // Asynchronously load the custom fonts, then redraw to ensure correct typography
    const loadFontsAndRedraw = async () => {
      try {
        const promises = [];
        if (primaryFamilyName && primaryFamilyName !== "sans-serif") {
          promises.push(document.fonts.load(`bold 14px "${primaryFamilyName}"`));
        }
        if (secondaryFamilyName && secondaryFamilyName !== "sans-serif") {
          promises.push(document.fonts.load(`14px "${secondaryFamilyName}"`));
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }
        if (active) {
          drawCanvas();
        }
      } catch (err) {
        console.warn("Failed to load web fonts for canvas:", err);
      }
    };

    loadFontsAndRedraw();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    primaryText,
    secondaryText,
    bgColor,
    primaryColor,
    secondaryColor,
    layoutPreset,
    primaryFontSize,
    secondaryFontSize,
    primaryFontId,
    secondaryFontId,
    primaryFamilyName,
    secondaryFamilyName,
    primaryY,
    secondaryY,
    paddingX,
    textAlign,
    swapFonts
  ]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    
    // Append tag IDs
    selectedTagIds.forEach((tId) => formData.append("tagIds", tId));
    formData.set("published", String(published));

    // If using canvas tab and canvas was generated, set canvasImageData
    if (activeTab === "canvas" && canvasDataUrl) {
      formData.set("canvasImageData", canvasDataUrl);
    }

    if (removeImage) {
      formData.set("removeImage", "true");
    }

    startTransition(async () => {
      const err = await savePairing(null, formData, initialData?.id);
      if (err) {
        setErrorMessage(err);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Inject @font-face dynamically for live rendering */}
      {primaryWoff2 && (
        <style>{`
          @font-face {
            font-family: '${primaryFamilyName}';
            src: url('${primaryWoff2}') format('woff2');
          }
        `}</style>
      )}
      {secondaryWoff2 && (
        <style>{`
          @font-face {
            font-family: '${secondaryFamilyName}';
            src: url('${secondaryWoff2}') format('woff2');
          }
        `}</style>
      )}


      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
          {errorMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Actions (Top of form, full width) */}
        <div className="lg:col-span-12">
          <FormActions
            backLink="/admin/pairings"
            backLabel="Back to pairings list"
            buttonLabel={initialData ? "Save Changes" : "Create Pairing"}
            disabled={isPending}
          />
        </div>

        {/* Card 1: Identity & Details (Basic Infos - Left, 2/3 width) */}
        <div className="lg:col-span-8 relative z-10 border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-xl bg-white/50 dark:bg-zinc-950/50 space-y-5">
          <div>
            <h3 className="text-lg font-star font-bold text-black dark:text-white pb-2 border-b border-black/5 dark:border-white/5">
              Pairing basic infos
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">Define the descriptive info for this typography recipe.</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              Pairing Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Editorial Modernism (Inter + Playfair)"
              className="w-full px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              Slug *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAutoSlug(false);
                }}
                placeholder="editorial-modernism"
                className="w-full px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              {!autoSlug && (
                <button
                  type="button"
                  onClick={() => {
                    setAutoSlug(true);
                    handleNameChange({ target: { value: name } } as any);
                  }}
                  className="p-2.5 border border-black/10 dark:border-white/10 rounded-lg text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
                  title="Auto-generate from Name"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-black dark:text-white mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe why these two fonts work together so well..."
              className="w-full px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>
        </div>

        {/* Card 3: Categorization & Visibility (Taxonomy - Right, 1/3 width) */}
        <div className="lg:col-span-4 relative z-20 border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-xl bg-white/50 dark:bg-zinc-950/50 space-y-5">
          <div>
            <h3 className="text-lg font-star font-bold text-black dark:text-white pb-2 border-b border-black/5 dark:border-white/5">
              Taxonomy & Visibility
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">Set visibility status and tag associations.</p>
          </div>

          {/* Tags Multiselect */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-black dark:text-white mb-2 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5" />
              Assign Tags
            </label>
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
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between p-4 border border-black/5 dark:border-white/5 rounded-xl bg-black/5 dark:bg-white/5">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">Publish Pairing</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Make this prescription publicly visible on /prescriptions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:peer-checked:after:border-zinc-800 peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Card 2: Typography Pairing (Font Selection - Left, 1/3 width) */}
        <div className="lg:col-span-4 relative z-30 border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-xl bg-white/50 dark:bg-zinc-950/50 space-y-5">
          <div>
            <h3 className="text-lg font-star font-bold text-black dark:text-white pb-2 border-b border-black/5 dark:border-white/5">
              Font Pairing Selection
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">Select the primary and secondary components of this pairing.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] relative z-20">
              <Select
                label="Primary Font (Title / Display) *"
                options={fonts.map((f) => ({
                  label: `${f.name} (${f.category})`,
                  value: f.id,
                }))}
                value={primaryFontId}
                onChange={(val) => setPrimaryFontId(val)}
                placeholder="Select primary font..."
              />
              <input type="hidden" name="primaryFontId" value={primaryFontId} />
            </div>

            <div className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] relative z-10">
              <Select
                label="Secondary Font (Body / Subtitle) *"
                options={fonts.map((f) => ({
                  label: `${f.name} (${f.category})`,
                  value: f.id,
                }))}
                value={secondaryFontId}
                onChange={(val) => setSecondaryFontId(val)}
                placeholder="Select secondary font..."
              />
              <input type="hidden" name="secondaryFontId" value={secondaryFontId} />
            </div>
          </div>
        </div>

        {/* Canvas & Controls Card (Right, 2/3 width) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-xl bg-white/50 dark:bg-zinc-950/50 space-y-5">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <h2 className="text-xl font-star font-bold text-black dark:text-white flex items-center gap-2">
                Canvas Generator
              </h2>

              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("canvas")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    activeTab === "canvas"
                      ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Canvas Generator
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    activeTab === "upload"
                      ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  File Upload
                </button>
              </div>
            </div>

            {activeTab === "canvas" ? (
              <div className="space-y-4">
                {/* Live Canvas View */}
                <div className="relative border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-inner bg-black aspect-[1.91/1] flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Canvas Controls */}
                <div className="space-y-4 p-5 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-xs">
                  {/* Group 1: Texts, Sizes & Content */}
                  <div className="space-y-3 p-3 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 mb-2">1. Text Content & Sizing</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-black dark:text-white">Primary Title Text</label>
                          <span className="text-[10px] text-zinc-500 font-mono">Font Size: {primaryFontSize}px</span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <input
                            type="text"
                            value={primaryText}
                            onChange={(e) => setPrimaryText(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white"
                          />
                          <input
                            type="range"
                            min="24"
                            max="120"
                            value={primaryFontSize}
                            onChange={(e) => setPrimaryFontSize(Number(e.target.value))}
                            className="w-24 accent-black dark:accent-white"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-black dark:text-white">Secondary Body Text</label>
                          <span className="text-[10px] text-zinc-500 font-mono">Font Size: {secondaryFontSize}px</span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <input
                            type="text"
                            value={secondaryText}
                            onChange={(e) => setSecondaryText(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white"
                          />
                          <input
                            type="range"
                            min="12"
                            max="64"
                            value={secondaryFontSize}
                            onChange={(e) => setSecondaryFontSize(Number(e.target.value))}
                            className="w-24 accent-black dark:accent-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group 2: Layout & Aesthetics */}
                  <div className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 space-y-3">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 mb-1">2. Layout & Styles</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-black dark:text-white">Layout Preset</label>
                        <select
                          value={layoutPreset}
                          onChange={(e) => setLayoutPreset(e.target.value as any)}
                          className="w-full px-2 py-1.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white"
                        >
                          <option value="stacked">Stacked</option>
                          <option value="centered">Centered</option>
                          <option value="sideBySide">Side by Side</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-black dark:text-white">Text Alignment</label>
                        <select
                          value={textAlign}
                          onChange={(e) => setTextAlign(e.target.value as any)}
                          className="w-full px-2 py-1.5 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-white"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="swapFontsCheckbox"
                          checked={swapFonts}
                          onChange={(e) => setSwapFonts(e.target.checked)}
                          className="rounded border-black/10 dark:border-white/10 focus:ring-black dark:focus:ring-white"
                        />
                        <label htmlFor="swapFontsCheckbox" className="font-bold text-black dark:text-white cursor-pointer select-none">
                          Swap Fonts
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Color Palette */}
                  <div className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 space-y-3">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 mb-1">3. Color Palette</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex flex-col items-center">
                        <span className="block font-bold mb-1 text-black dark:text-white">Bg Color</span>
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-10 h-7 p-0 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <div className="p-2 rounded border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex flex-col items-center">
                        <span className="block font-bold mb-1 text-black dark:text-white">Primary</span>
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-7 p-0 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <div className="p-2 rounded border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex flex-col items-center">
                        <span className="block font-bold mb-1 text-black dark:text-white">Secondary</span>
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-10 h-7 p-0 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group 4: Positioning & Margins */}
                  <div className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 space-y-3">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-zinc-400 mb-1">4. Positioning & Spacing</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between font-bold mb-1 text-black dark:text-white">
                          <span>Primary Font Y-Pos</span>
                          <span>{primaryY}px</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="580"
                          value={primaryY}
                          onChange={(e) => setPrimaryY(Number(e.target.value))}
                          className="w-full accent-black dark:accent-white"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between font-bold mb-1 text-black dark:text-white">
                          <span>Secondary Font Y-Pos</span>
                          <span>{secondaryY}px</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="580"
                          value={secondaryY}
                          onChange={(e) => setSecondaryY(Number(e.target.value))}
                          className="w-full accent-black dark:accent-white"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between font-bold mb-1 text-black dark:text-white">
                          <span>Horizontal Padding</span>
                          <span>{paddingX}px</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="300"
                          value={paddingX}
                          onChange={(e) => setPaddingX(Number(e.target.value))}
                          className="w-full accent-black dark:accent-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-zinc-500 dark:text-zinc-400">Canvas resolution: 1200 x 630 px</span>
                    <button
                      type="button"
                      onClick={drawCanvas}
                      className="px-2.5 py-1 rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-85 font-bold flex items-center gap-1.5 transition-opacity"
                    >
                      <RefreshCw className="w-3 h-3" /> Redraw Canvas
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {currentImageUrl && !removeImage && (
                  <div className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 group aspect-[1.91/1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentImageUrl} alt="Current Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setRemoveImage(true)}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-red-600 text-white shadow-lg opacity-90 hover:opacity-100 transition-all"
                      title="Remove current image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-white mb-2">
                    Upload Image File
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={() => setRemoveImage(false)}
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-80"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Recommended aspect ratio: 1.91:1 (e.g. 1200x630px PNG/JPG)</p>
                </div>
              </div>
            )}

            {/* Repositioned Save Button to Top */}
          </div>
        </div>
      </form>

      <SavingOverlay message="Saving Pairing..." show={isPending} />
    </div>
  );
}
