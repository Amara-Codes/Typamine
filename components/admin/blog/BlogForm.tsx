"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { saveBlogPost } from "@/lib/actions/blog";
import {
  Globe,
  Lock,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  Image as ImageIcon,
  Layout,
  Type,
  Quote as QuoteIcon,
  Columns,
  Check,
  Target,
  Tag,
  Eye,
  Share2,
  MoveRight,
  GripVertical,
  Maximize2,
  Minimize2,
  ExternalLink,
  Minus,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import FormActions from "@/components/admin/common/FormActions";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { Select } from "@/components/common/Select";
import BaseModal from "@/components/common/BaseModal";
import { Input, Label } from "@/components/common/Input";

// Infrastruttura generica dei content module (condivisa con Pairing, Archive, ecc.)
import {
  resolveMediaUrl,
  ImageUpload,
  Toggle,
  PAGE_THEMES,
  Module as GenericModule,
} from "@/components/admin/common/content-modules/shared";

// Module Sub-components
import SimpleHeroModule from "@/components/admin/common/content-modules/SimpleHeroModule";
import GridHeroModule from "@/components/admin/common/content-modules/GridHeroModule";
import ParagraphModule from "@/components/admin/common/content-modules/ParagraphModule";
import QuoteModule from "@/components/admin/common/content-modules/QuoteModule";
import ParagraphWithImageModule from "@/components/admin/common/content-modules/ParagraphWithImageModule";
import HorizontalSliderModule from "@/components/admin/common/content-modules/HorizontalSliderModule";
import ActionCtaModule from "@/components/admin/common/content-modules/ActionCtaModule";
import SpacerModule from "@/components/admin/common/content-modules/SpacerModule";

// Design System Constants
const LABEL_CLASSES = "text-[10px] font-bold text-bluegray-800 dark:text-redgray-200 uppercase tracking-[0.2em]";
const CARD_CLASSES = "bg-white/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-sm";

// Module Types (specifiche del blog: qui sono ammessi tutti gli 8 tipi)
export type ModuleType =
  | 'simpleHero'
  | 'gridHero'
  | 'paragraph'
  | 'paragraphWithImage'
  | 'horizontalSlider'
  | 'quote'
  | 'actioncta'
  | 'spacer';

export interface Module extends GenericModule {
  type: ModuleType;
}

interface SeoData {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  ogImage: string;
  canonicalUrl: string;
}

interface BlogFormProps {
  post?: {
    id: string;
    title: string;
    slug: string;
    caption?: string;
    content?: string;
    published: boolean;
    showAuthor?: boolean;
    thumbnailUrl?: string;
    thumbnailCaption?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageUrl?: string;
    ogImage?: string;
    ogType?: string;
    canonicalUrl?: string;
    thumbnailImage?: string;
    pageTheme?: string;
  };
  categories?: { id: string; name: string }[];
  initialCategoryIds?: string[];
  canPublish?: boolean;
}

export default function BlogForm({ post, categories = [], initialCategoryIds = [], canPublish = true }: BlogFormProps) {
  const saveAction = (prevState: any, formData: FormData) => saveBlogPost(prevState, formData, post?.id);
  const [errorMessage, dispatch] = useActionState(saveAction, undefined);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (errorMessage) setShowError(true);
  }, [errorMessage]);

  // State
  const [published, setPublished] = useState(post?.published || false);
  const [showAuthor, setShowAuthor] = useState(post?.showAuthor ?? true);
  const [pageTheme, setPageTheme] = useState(post?.pageTheme || 'blue-coconut');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialCategoryIds);
  const [modules, setModules] = useState<Module[]>([]);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [buttonStyle, setButtonStyle] = useState<{ left: string; width: string }>({ left: 'auto', width: 'auto' });
  const [showSeoWarningModal, setShowSeoWarningModal] = useState(false);
  const bypassSeoCheckRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [seo, setSeo] = useState<SeoData>({
    metaTitle: post?.metaTitle || '',
    metaDescription: post?.metaDescription || '',
    keywords: post?.keywords || '',
    robots: post?.robots || 'index, follow',
    ogTitle: post?.ogTitle || '',
    ogDescription: post?.ogDescription || '',
    ogType: post?.ogType || 'article',
    ogImage: post?.ogImageUrl || post?.ogImage || '',
    canonicalUrl: post?.canonicalUrl || '',
  });
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

  // Previews
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(resolveMediaUrl(post?.thumbnailUrl || post?.thumbnailImage));
  const [ogPreview, setOgPreview] = useState<string | null>(resolveMediaUrl(post?.ogImageUrl || post?.ogImage));

  // Initialize from post data
  useEffect(() => {
    if (post) {
      try {
        if (post.content) {
          const parsedModules = JSON.parse(post.content).map((m: any) => {
            const defaults = getDefaultProps(m.type) as Record<string, any>;
            const mergedProps = { ...defaults };
            const mProps = (m.props || {}) as Record<string, any>;
            for (const key in mProps) {
              if (mProps[key] !== undefined && mProps[key] !== null) {
                mergedProps[key] = mProps[key];
              }
            }
            return {
              ...m,
              props: mergedProps
            };
          });
          setModules(parsedModules);
          // Start with all modules collapsed in edit mode for better overview
          setCollapsedModules(new Set(parsedModules.map((m: any) => m.id)));
        }
      } catch (e) {
        console.error("Failed to parse post content", e);
      }
    }
  }, [post]);

  useEffect(() => {
    if (lastAddedId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`module-card-${lastAddedId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setLastAddedId(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastAddedId]);

  useEffect(() => {
    const updatePosition = () => {
      const element = document.getElementById("canvas-controls");
      if (element) {
        const rect = element.getBoundingClientRect();
        setShowBackToTop(rect.top < -150);
      }

      const rightCol = rightColumnRef.current;
      if (rightCol) {
        const colRect = rightCol.getBoundingClientRect();
        setButtonStyle({
          left: `${colRect.left}px`,
          width: `${colRect.width}px`
        });
      }
    };

    // Capture phase (true) lets us listen to scrolling inside ANY container (divs, window, etc.)
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    updatePosition(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  const handleEditMetaTags = () => {
    setShowSeoWarningModal(false);
    setActiveTab('seo');
    setTimeout(() => {
      const element = document.getElementById("canvas-controls");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handlePublishAnyway = () => {
    setShowSeoWarningModal(false);
    bypassSeoCheckRef.current = true;
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
    setTimeout(() => {
      bypassSeoCheckRef.current = false;
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (bypassSeoCheckRef.current) return;

    const isMissingSeo = !seo.metaTitle?.trim() || !seo.metaDescription?.trim();
    if (published && isMissingSeo) {
      e.preventDefault();
      setShowSeoWarningModal(true);
    }
  };

  const addModule = (type: ModuleType) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newModule: Module = {
      id: newId,
      type,
      props: getDefaultProps(type),
    };
    setModules([...modules, newModule]);
    setLastAddedId(newId);
  };

  const removeModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
    const newCollapsed = new Set(collapsedModules);
    newCollapsed.delete(id);
    setCollapsedModules(newCollapsed);
  };

  const updateModuleProps = (id: string, newProps: Record<string, any>) => {
    setModules(modules.map(m => m.id === id ? { ...m, props: newProps } : m));
  };

  const toggleCollapse = (id: string) => {
    const newCollapsed = new Set(collapsedModules);
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id);
    } else {
      newCollapsed.add(id);
    }
    setCollapsedModules(newCollapsed);
  };

  const expandAll = () => setCollapsedModules(new Set());
  const collapseAll = () => setCollapsedModules(new Set(modules.map(m => m.id)));

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      action={dispatch}
      className="max-w-6xl space-y-12 pb-32 transition-colors duration-300"
    >
      <FormActions
        backLink="/admin/blog"
        backLabel="Back to list"
        buttonLabel={post ? "Update Article" : "Create Post"}
        disabled={!canPublish && published}
      />

      {/* Hidden Inputs for JSON data */}
      <input type="hidden" name="content" value={JSON.stringify(modules)} />
      <input type="hidden" name="published" value={String(published)} />
      <input type="hidden" name="showAuthor" value={String(showAuthor)} />
      <input type="hidden" name="pageTheme" value={pageTheme} />

      {/* Grid 1: Basic Info & Main Sidebar Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-10">
          {/* Phase 1: Basic Info */}
          <div className={cn(CARD_CLASSES, "p-8 sm:p-10")}>
            <div className="flex items-center gap-4 mb-10 border-b border-black/5 dark:border-white/5 pb-6">
              <div className="p-3 bg-black/5 dark:bg-white/10 rounded-2xl shadow-inner">
                <FileText className="h-8 w-8 text-black dark:text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-star text-black dark:text-white">Article Content</h3>
                <p className="text-[10px] ps-1 uppercase tracking-widest font-bold text-black/60 dark:text-white/50 mt-1">Add Title, Slug, Thumbnail, & Caption</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input label="Post Title" name="title" defaultValue={post?.title} placeholder="The Power of Silence..." />
                <Input label="URL Slug" name="slug" defaultValue={post?.slug} placeholder="the-power-of-silence" className="font-mono" />
              </div>

              <Input label="Article Caption / Summary" name="caption" defaultValue={post?.caption} placeholder="A brief introduction..." as="textarea" />

              <div className="space-y-4">
                <Label>Page Theme (Background)</Label>
                <Select
                  options={PAGE_THEMES.map(t => ({ label: t.label, value: t.id }))}
                  value={pageTheme}
                  onChange={setPageTheme}
                />
              </div>

              <div className="space-y-4">
                <Label>Thumbnail Image</Label>
                <ImageUpload
                  name="thumbnailImage"
                  preview={thumbnailPreview}
                  onPreviewChange={setThumbnailPreview}
                />
                <div className="space-y-2 mt-4">
                  <Input label="Thumbnail Caption" name="thumbnailCaption" defaultValue={post?.thumbnailCaption} placeholder="Image by..." />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Settings */}
        <div className="lg:col-span-1 space-y-8">
          {/* Status Settings */}
          <div className={cn(CARD_CLASSES, "p-8")}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-black/5 dark:bg-white/10 rounded-2xl">
                <Settings className="h-6 w-6 text-black dark:text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-star text-black dark:text-white">Visibility</h3>
                <Label className="mb-0">Publish Status</Label>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-black/2 dark:bg-white/5 rounded-2xl border-2 border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", published ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                    {published ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-black text-xs text-black dark:text-white">{published ? "Published" : "Draft"}</p>
                    <p className="text-[9px] text-black/60 dark:text-white/40 font-bold uppercase tracking-wider">{published ? "Live" : "Staging"}{!canPublish && " (Read-only)"}</p>
                  </div>
                </div>
                <Toggle checked={published} onChange={setPublished} disabled={!canPublish} />
              </div>
            </div>

            {/* Show Author Settings */}
            <div className="flex items-center justify-between p-5 bg-black/2 dark:bg-white/5 rounded-2xl border-2 border-black/5 dark:border-white/5 mt-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", showAuthor ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black text-xs text-black dark:text-white">Show Author</p>
                    <p className="text-[9px] text-black/60 dark:text-white/40 font-bold uppercase tracking-wider">{showAuthor ? "Visible" : "Hidden"}</p>
                  </div>
                </div>
                <Toggle checked={showAuthor} onChange={setShowAuthor} />
              </div>
            </div>
          </div>

          {/* Category Settings */}
          <div className={cn(CARD_CLASSES, "p-8")}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-black/5 dark:bg-white/10 rounded-2xl">
                <Tag className="h-6 w-6 text-black dark:text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-star text-black dark:text-white">Category</h3>
                <span className="text-[10px] font-bold text-black/60 dark:text-white/60 uppercase tracking-[0.2em]">Assign Categories</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 p-3 border border-black/10 dark:border-white/10 rounded-lg bg-white/50 dark:bg-zinc-900/50 max-h-48 overflow-y-auto">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryIds(
                          isSelected
                            ? selectedCategoryIds.filter((cid) => cid !== cat.id)
                            : [...selectedCategoryIds, cat.id]
                        );
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border",
                        isSelected
                          ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                          : "bg-transparent text-zinc-600 dark:text-zinc-400 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {cat.name}
                    </button>
                  );
                })}
                {categories.length === 0 && (
                  <span className="text-xs text-zinc-400 italic">No categories available.</span>
                )}
              </div>
            </div>
            {selectedCategoryIds.map((id) => (
              <input key={id} type="hidden" name="categoryIds" value={id} />
            ))}
          </div>
        </div>
      </div>

      {/* Grid 2: Builder Canvas & Add Module Toolkit */}
      <div id="canvas-controls" className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12 items-start scroll-mt-[100px]">
        {/* Left Column: Canvas Builder Area */}
        <div className="lg:col-span-2 space-y-10">

          {/* Builder Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2 p-1.5 bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/10 rounded-2xl backdrop-blur-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                  activeTab === 'content'
                    ? "bg-black text-white shadow-lg"
                    : "text-black/50 dark:text-white/50 hover:bg-white/50 dark:hover:bg-white/10"
                )}
              >
                Page Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                  activeTab === 'seo'
                    ? "bg-black text-white shadow-lg"
                    : "text-black/50 dark:text-white/50 hover:bg-white/50 dark:hover:bg-white/10"
                )}
              >
                SEO & Social
              </button>
            </div>

            {activeTab === 'content' && modules.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="p-2.5 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-xl text-black/60 dark:text-white/60 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm"
                  title="Expand All"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="p-2.5 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-xl text-black/60 dark:text-white/60 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm"
                  title="Collapse All"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Content Tab */}
          <div className={activeTab === 'content' ? "block" : "hidden"}>
            <>
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Module List with Reorder */}
                <Reorder.Group
                  axis="y"
                  values={modules}
                  onReorder={setModules}
                  className="space-y-6"
                >
                  {modules.map((module) => (
                    <Reorder.Item
                      key={module.id}
                      value={module}
                      id={`module-card-${module.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "visible", scrollMarginTop: "100px" }}
                    >
                      <div className={cn(
                        "group relative bg-white/50 dark:bg-black border border-black/5 dark:border-white/5 rounded-2xl shadow-xl transition-all hover:shadow-2xl hover:border-black/20 dark:hover:border-white/20 overflow-visible!",
                        !collapsedModules.has(module.id) ? "z-30" : "z-10"
                      )}>
                        {/* Module Header - Accordion Trigger */}
                        <div
                          className={cn(
                            "flex items-center justify-between p-6 cursor-pointer select-none transition-colors rounded-2xl",
                            collapsedModules.has(module.id) ? "hover:bg-black/5 dark:hover:bg-white/5" : "bg-black/2 dark:bg-white/2 border-b border-black/5 dark:border-white/5"
                          )}
                          onClick={() => toggleCollapse(module.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-black/5 dark:bg-white/10 rounded-lg text-black/60 dark:text-white/40">
                              {getModuleIcon(module.type)}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-[0.2em]">{module.type.replace(/([A-Z])/g, ' $1')}</h4>
                              <p className="text-[9px] text-black/30 dark:text-white/30 font-bold uppercase mt-0.5">Instance ID: {module.id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeModule(module.id); }}
                                className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <div className="p-2 text-black/20 dark:text-white/20 cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-4 w-4" />
                              </div>
                            </div>
                            <div className={cn("transition-transform duration-300", collapsedModules.has(module.id) ? "" : "rotate-180")}>
                              <ChevronDown className="h-5 w-5 text-black/20 dark:text-white/20" />
                            </div>
                          </div>
                        </div>

                        {/* Module Body - Content */}
                        <div className={collapsedModules.has(module.id) ? "hidden" : "block"}>
                          <div className="p-8 sm:p-10 pt-8 border-t border-black/5 dark:border-white/5 overflow-visible!">
                            <ModuleForm
                              module={module}
                              onChange={(newProps) => updateModuleProps(module.id, newProps)}
                            />
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                {modules.length === 0 && (
                  <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl py-24 flex flex-col items-center justify-center text-center px-10">
                    <div className="h-20 w-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6">
                      <Layout className="h-10 w-10 text-black/20 dark:text-white/20" />
                    </div>
                    <h4 className="text-xl font-star text-black/60 dark:text-white/40">No modules added yet</h4>
                    <p className="text-xs text-black/30 dark:text-white/30 mt-2 max-w-xs mx-auto">Start building your page by selecting a module from the sidebar palette.</p>
                  </div>
                )}
              </div>
            </>
          </div>

          {/* SEO Module Section */}
          <div className={activeTab === 'seo' ? "block" : "hidden"}>
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Google Search Preview */}
              <div className={cn(CARD_CLASSES, "p-8 sm:p-12")}>
                <div className="flex items-center gap-4 mb-10 border-b border-black/5 dark:border-white/5 pb-8">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl shadow-inner">
                    <Target className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-star text-black dark:text-white">Search Engine Optimization</h3>
                    <p className="text-[10px] ps-1 uppercase tracking-widest font-bold text-black/60 dark:text-white/50 mt-1">Configure metadata and robots</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <Input
                    label="Meta Title"
                    name="metaTitle"
                    value={seo.metaTitle}
                    onChange={(v) => setSeo({ ...seo, metaTitle: v })}
                    placeholder="Angkor Float | The Power of Silence"
                  />

                  <Input
                    label="Meta Description"
                    as="textarea"
                    name="metaDescription"
                    value={seo.metaDescription}
                    onChange={(v) => setSeo({ ...seo, metaDescription: v })}
                    placeholder="Discover the therapeutic benefits of floating in Siem Reap..."
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input
                      label="Keywords"
                      name="keywords"
                      value={seo.keywords}
                      onChange={(v) => setSeo({ ...seo, keywords: v })}
                      placeholder="floating, siem reap, spa, wellness..."
                    />
                    <div className="space-y-2">
                      <Label icon={Eye}>Robots</Label>
                      <Select
                        options={[
                          { label: "Index, Follow", value: "index, follow" },
                          { label: "Noindex, Follow", value: "noindex, follow" },
                          { label: "Index, Nofollow", value: "index, nofollow" },
                          { label: "Noindex, Nofollow", value: "noindex, nofollow" },
                        ]}
                        value={seo.robots}
                        onChange={(v) => setSeo({ ...seo, robots: v })}
                      />
                      <input type="hidden" name="robots" value={seo.robots} />
                    </div>
                  </div>
                </div>
              </div>

              {/* OpenGraph Section */}
              <div className={cn(CARD_CLASSES, "p-8 sm:p-12")}>
                <div className="flex items-center gap-4 mb-10 border-b border-black/5 dark:border-white/5 pb-8">
                  <div className="p-4 bg-black/5 dark:bg-white/10 rounded-2xl shadow-inner text-black dark:text-white">
                    <Share2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-star text-black dark:text-white">Social Sharing (OG)</h3>
                    <p className={LABEL_CLASSES}>Customize appearance on social media</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input
                      label="OG Title"
                      name="ogTitle"
                      value={seo.ogTitle}
                      onChange={(v) => setSeo({ ...seo, ogTitle: v })}
                      placeholder="Angkor Float - Experience Silence"
                    />
                    <div className="space-y-2">
                      <Label>OG Type</Label>
                      <Select
                        options={[
                          { label: "Article", value: "article" },
                          { label: "Website", value: "website" },
                        ]}
                        value={seo.ogType}
                        onChange={(v) => setSeo({ ...seo, ogType: v })}
                      />
                      <input type="hidden" name="ogType" value={seo.ogType} />
                    </div>
                  </div>

                  <Input
                    label="OG Description"
                    as="textarea"
                    name="ogDescription"
                    value={seo.ogDescription}
                    onChange={(v) => setSeo({ ...seo, ogDescription: v })}
                    placeholder="Share the silence with your followers..."
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <Label>OG Image</Label>
                      <ImageUpload
                        name="ogImage"
                        preview={ogPreview}
                        onPreviewChange={setOgPreview}
                      />
                    </div>
                    <div className="space-y-4 self-end">
                      <Input label="Canonical URL" name="canonicalUrl" value={seo.canonicalUrl} onChange={(v) => setSeo({ ...seo, canonicalUrl: v })} placeholder="https://angkorfloat.com/blog/..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Palette */}
        <div ref={rightColumnRef} className="lg:col-span-1">
          {/* Add Content Module (Only visible when activeTab === 'content') */}
          {activeTab === 'content' && (
            <div className={cn(CARD_CLASSES, "p-6 sm:p-8")}>
              <div className="flex items-center gap-3 mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                <div className="p-2 bg-black/5 dark:bg-white/10 rounded-xl shadow-inner">
                  <Layout className="h-5 w-5 text-black dark:text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-[0.2em]">Add Module</h3>
                  <p className="text-[9px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">Click to insert on canvas</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {moduleOptions.map(option => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => addModule(option.type)}
                    className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white hover:border-black/20 dark:hover:bg-white/10 transition-all duration-300 group shadow-xs hover:shadow-md hover:translate-x-1"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white group-hover:scale-105 transition-transform duration-300">
                      {option.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-black/60 dark:text-white/60 text-left">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BaseModal isOpen={showError} onClose={() => setShowError(false)} size="lg">
        <BaseModal.Header onClose={() => setShowError(false)}>
          <div className="flex items-end gap-4">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <Lock className="h-6 w-6 text-red-500" />
            </div>
            <span className="text-red-500 font-black tracking-tight">Post Save Failed</span>
          </div>
        </BaseModal.Header>
        <BaseModal.Body>
          <div className="space-y-4">
            <p className="text-black dark:text-white font-medium leading-relaxed">
              We encountered an issue while trying to save your article. Please check the details below:
            </p>
            <div className="p-6 bg-red-500/5 border-2 border-red-500/10 rounded-2xl">
              <code className="text-red-500 text-sm font-mono wrap-break-word whitespace-pre-wrap">
                {errorMessage}
              </code>
            </div>
          </div>
        </BaseModal.Body>
        <BaseModal.Footer>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowError(false)}
              className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Got it, thanks
            </button>
          </div>
        </BaseModal.Footer>
      </BaseModal>

      {/* Premium Floating Back to Controls Button, fixed and aligned to right column */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => {
              const element = document.getElementById("canvas-controls");
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            style={{
              left: buttonStyle.left,
              width: buttonStyle.width,
            }}
            className="fixed bottom-8 z-50 pointer-events-auto cursor-pointer flex items-center justify-center gap-2.5 px-6 py-4.5 rounded-2xl bg-black/95 dark:bg-white/95 text-white dark:text-black border border-white/10 dark:border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em]"
          >
            <ChevronUp className="h-4 w-4 text-white dark:text-black animate-bounce" />
            Back to Controls
          </motion.button>
        )}
      </AnimatePresence>

      {/* SEO Warning Modal */}
      <BaseModal isOpen={showSeoWarningModal} onClose={() => setShowSeoWarningModal(false)} size="2xl">
        <BaseModal.Header onClose={() => setShowSeoWarningModal(false)}>
          <div className="flex items-end gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <Settings className="h-6 w-6 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <span className="text-amber-500 text-2xl font-star font-black tracking-tight">SEO Metadata Missing</span>
          </div>
        </BaseModal.Header>
        <BaseModal.Body>
          <div className="space-y-6">
            <p className="text-black dark:text-white font-medium leading-relaxed">
              You are about to publish this article without a <strong className="font-bold">Meta Title</strong> or <strong className="font-bold">Meta Description</strong>. These tags are critical for search engine visibility and listing quality:
            </p>
            <div className="space-y-4 p-6 bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-2xl">
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-[0.1em] text-black dark:text-white flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Meta Title Importance
                </h4>
                <p className="text-xs text-black/70 dark:text-white/70 leading-relaxed ps-4">
                  Google uses this as the primary clickable headline in search results. Leaving it empty forces Google to auto-generate one, which is rarely optimized for your target audience.
                </p>
              </div>
              <div className="space-y-3 pt-3 border-t border-black/5 dark:border-white/5">
                <h4 className="text-xs font-black uppercase tracking-[0.1em] text-black dark:text-white flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Meta Description Importance
                </h4>
                <p className="text-xs text-black/70 dark:text-white/70 leading-relaxed ps-4">
                  This description is displayed below your title in Google search results. It serves as your organic advertisement copy, directly influencing whether users click through to your article.
                </p>
              </div>
            </div>
          </div>
        </BaseModal.Body>
        <BaseModal.Footer>
          <div className="flex flex-col sm:flex-row justify-end gap-4 w-full">
            <button
              type="button"
              onClick={handlePublishAnyway}
              className="px-8 py-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl font-black text-sm transition-all"
            >
              Publish Anyway
            </button>
            <button
              type="button"
              onClick={handleEditMetaTags}
              className="px-8 py-4 bg-black text-white dark:bg-white dark:text-black rounded-2xl font-black text-sm shadow-xl shadow-black/20 dark:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Edit Meta Tags
            </button>
          </div>
        </BaseModal.Footer>
      </BaseModal>
    </form>
  );
}

// Module Form Renderer
function ModuleForm({ module, onChange }: { module: Module, onChange: (newProps: Record<string, any>) => void }) {
  const { type } = module;

  switch (type) {
    case 'simpleHero':
      return <SimpleHeroModule module={module} onChange={onChange} />;
    case 'gridHero':
      return <GridHeroModule module={module} onChange={onChange} />;
    case 'paragraph':
      return <ParagraphModule module={module} onChange={onChange} />;
    case 'quote':
      return <QuoteModule module={module} onChange={onChange} />;
    case 'paragraphWithImage':
      return <ParagraphWithImageModule module={module} onChange={onChange} />;
    case 'horizontalSlider':
      return <HorizontalSliderModule module={module} onChange={onChange} />;
    case 'actioncta':
      return <ActionCtaModule module={module} onChange={onChange} />;
    case 'spacer':
      return <SpacerModule module={module} onChange={onChange} />;
    default:
      return <div className="text-xs text-black/60 italic">Module configuration coming soon...</div>;
  }
}

// Helpers
function getDefaultProps(type: ModuleType) {
  switch (type) {
    case 'simpleHero': return { title: '', subtitle: '', imageSrc: '', imageAlt: 'Hero image', align: 'center', vAlign: 'center', overlayOpacity: 0.4, lightOverlayColor: 'black', darkOverlayColor: 'black', parallax: true, titleColorClassName: 'text-white/100 dark:text-white/100', subtitleColorClassName: 'text-white/80 dark:text-white/80' };
    case 'gridHero': return {
      imageSrc: '',
      imageAlt: 'GridHero image',
      imagePosition: 'left',
      topTitle: '',
      topSubtitle: '',
      topBgColorClassName: 'bg-white/100 dark:bg-black/100',
      topTitleColorClassName: 'text-black/100 dark:text-white/100',
      topSubtitleColorClassName: 'text-black/80 dark:text-white/80',
      topTitleFontFamily: 'standard',
      topSubtitleFontFamily: 'standard',
      bottomParagraph: '',
      bottomBgColorClassName: 'bg-white/80 dark:bg-black/80',
      bottomParagraphColorClassName: 'text-black/100 dark:text-white/100',
      bottomFontFamily: 'standard',
      hasButton: false,
      buttonLabel: 'Discovery',
      buttonHref: '/',
      buttonVariant: 'primary'
    };
    case 'paragraph': return { children: '', as: 'p', size: 'md', weight: 'normal', variant: 'default', align: 'left', scrollReveal: false, colorClassName: 'text-black/100 dark:text-white/100', fontFamily: 'standard' };
    case 'quote': return { children: '', author: '', authorDates: '', authorInfo: '', colorClassName: 'text-black/100 dark:text-white/100', bgColorClassName: 'bg-white/20 dark:bg-black/20', fontFamily: 'standard' };
    case 'paragraphWithImage': return { children: '', as: 'p', size: 'md', weight: 'normal', variant: 'default', align: 'left', imageSrc: '', imageAlt: '', imagePosition: 'left', imageAspectRatio: 'video', parallax: true, parallaxSpeed: 0.3, overlayOpacity: 0.4, colorClassName: 'text-black/100 dark:text-white/100', fontFamily: 'standard' };
    case 'horizontalSlider': return { title: '', subtitle: '', scrollDistance: 'auto', items: [] };
    case 'actioncta': return { title: '', paragraph: '', imageSrc: '', imageAlt: '', imagePosition: 'right', buttonOneLabel: 'Learn More', buttonOneLink: '/', buttonOneVariant: 'outline', buttonTwoLabel: '', buttonTwoLink: '', buttonTwoVariant: 'secondary', fontFamily: 'standard', titleColorClassName: 'text-red-500/100 dark:text-white/100', paragraphColorClassName: 'text-black/100 dark:text-white/100' };
    case 'spacer': return { height: 'md', type: 'spacer', lineColor: 'transparent', lineWidth: '100%', opacity: 0.2, lineHeight: '1' };
    default: return {};
  }
}

function getModuleIcon(type: ModuleType) {
  switch (type) {
    case 'simpleHero': return <ImageIcon className="h-5 w-5" />;
    case 'paragraph': return <Type className="h-5 w-5" />;
    case 'quote': return <QuoteIcon className="h-5 w-5" />;
    case 'paragraphWithImage': return <Columns className="h-5 w-5" />;
    case 'gridHero': return <Layout className="h-5 w-5" />;
    case 'horizontalSlider': return <MoveRight className="h-5 w-5" />;
    case 'actioncta': return <ExternalLink className="h-5 w-5" />;
    case 'spacer': return <Minus className="h-5 w-5" />;
    default: return <Layout className="h-5 w-5" />;
  }
}

const moduleOptions = [
  { type: 'simpleHero', label: 'Simple Hero', icon: <ImageIcon className="h-6 w-6" /> },
  { type: 'gridHero', label: 'Grid Hero', icon: <Layout className="h-6 w-6" /> },
  { type: 'paragraph', label: 'Paragraph', icon: <Type className="h-6 w-6" /> },
  { type: 'paragraphWithImage', label: 'Text + Image', icon: <Columns className="h-6 w-6" /> },
  { type: 'quote', label: 'Quote', icon: <QuoteIcon className="h-6 w-6" /> },
  { type: 'horizontalSlider', label: 'Slider', icon: <MoveRight className="h-6 w-6" /> },
  { type: 'actioncta', label: 'Action CTA', icon: <ExternalLink className="h-6 w-6" /> },
  { type: 'spacer', label: 'Spacer / Line', icon: <Minus className="h-6 w-6" /> },
] as const;
