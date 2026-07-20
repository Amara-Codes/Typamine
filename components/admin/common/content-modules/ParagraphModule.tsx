"use client";

import { Input, Label } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import {
  Toggle,
  GranularColorPickerButton,
  FONT_FAMILIES,
  Module
} from "./shared";

interface ParagraphModuleProps {
  module: Module;
  onChange: (newProps: Record<string, any>) => void;
}

export default function ParagraphModule({ module, onChange }: ParagraphModuleProps) {
  const { props } = module;

  const handleChange = (key: string, value: any) => {
    onChange({ ...props, [key]: value });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="mb-16">
        <Input label="Content Text" value={props.children} onChange={(v: string) => handleChange('children', v)} as="textarea" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        <div className="space-y-2">
          <Label>As Tag</Label>
          <Select
            options={["p", "span", "div", "h2", "h1"].map((t) => ({ label: t, value: t }))}
            value={props.as}
            onChange={(v: string) => handleChange('as', v)}
          />
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select
            options={['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'].map((s) => ({ label: s, value: s }))}
            value={props.size}
            onChange={(v: string) => handleChange('size', v)}
          />
        </div>
        <div className="space-y-2">
          <Label>Weight</Label>
          <Select
            options={[
              { label: "Normal", value: "normal" },
              { label: "Medium", value: "medium" },
              { label: "Bold", value: "bold" },
            ]}
            value={props.weight}
            onChange={(v: string) => handleChange('weight', v)}
          />
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        <GranularColorPickerButton
          label="Text Color"
          value={props.colorClassName}
          onChange={(v: string) => handleChange('colorClassName', v)}
        />
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select
            options={FONT_FAMILIES.map((font) => ({ label: font.label, value: font.id }))}
            value={props.fontFamily}
            onChange={(v: string) => handleChange('fontFamily', v)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col justify-end">
          <div className="flex items-center justify-between p-4 bg-black/2 dark:bg-white/2 rounded-2xl border-2 border-black/5 dark:border-white/5 min-h-[66px]">
            <Label className="mb-0">Scroll Reveal</Label>
            <Toggle checked={props.scrollReveal} onChange={(v: boolean) => handleChange('scrollReveal', v)} />
          </div>
        </div>
      </div>
    </div>
  );
}
