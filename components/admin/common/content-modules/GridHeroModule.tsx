"use client";

import { useState } from "react";
import { Input, Label } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { cn } from "@/lib/utils";
import {
  ImageUpload,
  Toggle,
  GranularColorPickerButton,
  GranularBGColorPickerButton,
  FONT_FAMILIES,
  resolveMediaUrl,
  Module
} from "./shared";

interface GridHeroModuleProps {
  module: Module;
  onChange: (newProps: Record<string, any>) => void;
}

export default function GridHeroModule({ module, onChange }: GridHeroModuleProps) {
  const { props } = module;
  const [modulePreview, setModulePreview] = useState<string | null>(resolveMediaUrl(props.imageSrc));

  const handleChange = (key: string, value: any) => {
    onChange({ ...props, [key]: value });
  };

  const fontOptions = FONT_FAMILIES.map((font) => ({ label: font.label, value: font.id }));

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Phase 1: Media & Position */}
      <div className="space-y-4 mb-16">
        <div className="space-y-4">
          <Label>Hero Image</Label>
          <ImageUpload
            name={`module_${module.id}_image`}
            preview={modulePreview}
            onPreviewChange={(v: string | null) => {
              setModulePreview(v);
              handleChange('imageSrc', v);
            }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Image Alt" value={props.imageAlt} onChange={(v: string) => handleChange('imageAlt', v)} />
          <div className="space-y-2">
            <Label>Image Position</Label>
            <Select
              options={[
                { label: "Left", value: "left" },
                { label: "Right", value: "right" },
              ]}
              value={props.imagePosition}
              onChange={(v: string) => handleChange('imagePosition', v)}
            />
          </div>
        </div>
      </div>

      {/* Phase 2: Top Container (Children Part 1) */}
      <div className="space-y-4 p-4 rounded-2xl bg-black/2 dark:bg-white/2 border border-black/5 dark:border-white/5 mb-16">
        <div className="mb-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60">Top Section</h5>
        </div>

        <div className="space-y-4 mb-16">
          <Input label="Title" value={props.topTitle} onChange={(v: string) => handleChange('topTitle', v)} />
          <div className="grid grid-cols-2 gap-4">
            <GranularColorPickerButton
              label="Title Color"
              value={props.topTitleColorClassName}
              onChange={(v: string) => handleChange('topTitleColorClassName', v)}
            />
            <div className="space-y-2">
              <Label>Title Font Family</Label>
              <Select
                options={fontOptions}
                value={props.topTitleFontFamily}
                onChange={(v: string) => handleChange('topTitleFontFamily', v)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-16">
          <Input label="Subtitle" value={props.topSubtitle} onChange={(v: string) => handleChange('topSubtitle', v)} as="textarea" />
          <div className="grid grid-cols-2 gap-4">
            <GranularColorPickerButton
              label="Subtitle Color"
              value={props.topSubtitleColorClassName}
              onChange={(v: string) => handleChange('topSubtitleColorClassName', v)}
            />
            <div className="space-y-2">
              <Label>Subtitle Font Family</Label>
              <Select
                options={fontOptions}
                value={props.topSubtitleFontFamily}
                onChange={(v: string) => handleChange('topSubtitleFontFamily', v)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GranularBGColorPickerButton
            label="Background Color - Light Mode"
            value={props.topBgColorClassName}
            onChange={(v: string) => handleChange('topBgColorClassName', v)}
            themeMode="light"
          />
          <GranularBGColorPickerButton
            label="Background Color - Dark Mode"
            value={props.topBgColorClassName}
            onChange={(v: string) => handleChange('topBgColorClassName', v)}
            themeMode="dark"
          />
        </div>
      </div>

      {/* Phase 3: Bottom Container (Children Part 2) */}
      <div className="space-y-4 p-4 rounded-2xl bg-black/2 dark:bg-white/2 border border-black/5 dark:border-white/5">
        <div className="mb-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60">Bottom Section</h5>
        </div>

        <div className="space-y-4 mb-16">
          <Input label="Paragraph" value={props.bottomParagraph} onChange={(v: string) => handleChange('bottomParagraph', v)} as="textarea" />
          <div className="grid grid-cols-2 gap-4">
            <GranularColorPickerButton
              label="Paragraph Color"
              value={props.bottomParagraphColorClassName}
              onChange={(v: string) => handleChange('bottomParagraphColorClassName', v)}
            />
            <div className="space-y-2">
              <Label>Paragraph Font Family</Label>
              <Select
                options={fontOptions}
                value={props.bottomFontFamily}
                onChange={(v: string) => handleChange('bottomFontFamily', v)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GranularBGColorPickerButton
            label="Background Color - Light Mode"
            value={props.bottomBgColorClassName}
            onChange={(v: string) => handleChange('bottomBgColorClassName', v)}
            themeMode="light"
          />
          <GranularBGColorPickerButton
            label="Background Color - Dark Mode"
            value={props.bottomBgColorClassName}
            onChange={(v: string) => handleChange('bottomBgColorClassName', v)}
            themeMode="dark"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-8">
          <div className={cn(
            "flex items-center justify-between p-4 bg-black/2 dark:bg-white/2 rounded-2xl border-2 border-black/5 dark:border-white/5 min-h-[66px] transition-all duration-500",
            !props.hasButton ? "md:col-span-2" : 'mt-16'
          )}>
            <Label className="mb-0">Has Button</Label>
            <Toggle checked={props.hasButton} onChange={(v: boolean) => handleChange('hasButton', v)} />
          </div>

          {props.hasButton && (
            <>
              <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                <Label>Button Variant</Label>
                <Select
                  options={[
                    { label: "Primary", value: "primary" },
                    { label: "Secondary", value: "secondary" },
                    { label: "Outline", value: "outline" },
                    { label: "Ghost", value: "ghost" },
                  ]}
                  value={props.buttonVariant}
                  onChange={(v: string) => handleChange('buttonVariant', v)}
                />
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
                <Input label="Button Label" value={props.buttonLabel} onChange={(v: string) => handleChange('buttonLabel', v)} />
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                <Input label="Button Href" value={props.buttonHref} onChange={(v: string) => handleChange('buttonHref', v)} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
