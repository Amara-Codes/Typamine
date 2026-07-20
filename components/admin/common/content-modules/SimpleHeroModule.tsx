"use client";

import { useState } from "react";
import { Input, Label } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import {
  ImageUpload,
  GranularColorPickerButton,
  GranularBGColorPickerButton,
  FONT_FAMILIES,
  resolveMediaUrl,
  Module
} from "./shared";

interface SimpleHeroModuleProps {
  module: Module;
  onChange: (newProps: Record<string, any>) => void;
}

export default function SimpleHeroModule({ module, onChange }: SimpleHeroModuleProps) {
  const { props } = module;
  const [modulePreview, setModulePreview] = useState<string | null>(resolveMediaUrl(props.imageSrc));

  const handleChange = (key: string, value: any) => {
    onChange({ ...props, [key]: value });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="space-y-4 mb-16">
        <Input label="Title" value={props.title} onChange={(v: string) => handleChange('title', v)} />
        <div className="grid grid-cols-2 gap-4">
          <GranularColorPickerButton
            label="Title Color"
            value={props.titleColorClassName}
            onChange={(v: string) => handleChange('titleColorClassName', v)}
          />
          <div className="space-y-2">
            <Label>Title Font Family</Label>
            <Select
              options={FONT_FAMILIES.map((font) => ({ label: font.label, value: font.id }))}
              value={props.titleFontFamily}
              onChange={(v: string) => handleChange('titleFontFamily', v)}
            />
          </div>
        </div>
      </div>
      <div className="space-y-4 mb-16">
        <Input label="Subtitle" value={props.subtitle} onChange={(v: string) => handleChange('subtitle', v)} />
        <div className="grid grid-cols-2 gap-4">
          <GranularColorPickerButton
            label="Subtitle Color"
            value={props.subtitleColorClassName}
            onChange={(v: string) => handleChange('subtitleColorClassName', v)}
          />
          <div className="space-y-2">
            <Label>Subtitle Font Family</Label>
            <Select
              options={FONT_FAMILIES.map((font) => ({ label: font.label, value: font.id }))}
              value={props.subtitleFontFamily}
              onChange={(v: string) => handleChange('subtitleFontFamily', v)}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        <div className="space-y-2">
          <Label>Align</Label>
          <Select
            options={[
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ]}
            value={props.align}
            onChange={(v: string) => handleChange('align', v)}
          />
        </div>
        <div className="space-y-2">
          <Label>V Align</Label>
          <Select
            options={[
              { label: "Top", value: "top" },
              { label: "Center", value: "center" },
              { label: "Bottom", value: "bottom" },
            ]}
            value={props.vAlign}
            onChange={(v: string) => handleChange('vAlign', v)}
          />
        </div>
      </div>
      <div className="space-y-4 mb-16">
        <Label>Hero Image</Label>
        <ImageUpload
          name={`module_${module.id}_image`}
          preview={modulePreview}
          onPreviewChange={(v: string | null) => {
            setModulePreview(v);
            handleChange('imageSrc', v);
          }}
        />
        <Input label="Image Alt" value={props.imageAlt} onChange={(v: string) => handleChange('imageAlt', v)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GranularBGColorPickerButton
          label="Overlay Color - Light Mode"
          value={props.overlayColorClassName}
          onChange={(v: string) => handleChange('overlayColorClassName', v)}
          themeMode="light"
        />
        <GranularBGColorPickerButton
          label="Overlay Color - Dark Mode"
          value={props.overlayColorClassName}
          onChange={(v: string) => handleChange('overlayColorClassName', v)}
          themeMode="dark"
        />
      </div>
    </div>
  );
}
