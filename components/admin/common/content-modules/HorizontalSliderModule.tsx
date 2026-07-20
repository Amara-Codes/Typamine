"use client";

import { Input, Label } from "@/components/common/Input";
import { Reorder } from "framer-motion";
import { Plus, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { Module, GranularColorPickerButton, GranularBGColorPickerButton } from "./shared";

interface HorizontalSliderModuleProps {
  module: Module;
  onChange: (newProps: Record<string, any>) => void;
}

export default function HorizontalSliderModule({ module, onChange }: HorizontalSliderModuleProps) {
  const { props } = module;

  const handleChange = (key: string, value: any) => {
    onChange({ ...props, [key]: value });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="space-y-4 mb-16">
        <Input label="Title" value={props.title} onChange={(v) => handleChange('title', v)} />
        <GranularColorPickerButton
          label="Title Color"
          value={props.titleColorClassName}
          onChange={(v: string) => handleChange('titleColorClassName', v)}
        />
      </div>
      <div className="space-y-4 mb-16">
        <Input label="Subtitle" value={props.subtitle} onChange={(v) => handleChange('subtitle', v)} />

        <GranularColorPickerButton
          label="Subtitle Color"
          value={props.subtitleColorClassName}
          onChange={(v: string) => handleChange('subtitleColorClassName', v)}
        />
      </div>


      <div className="grid grid-cols-2 gap-4 mb-16">
        <GranularBGColorPickerButton
          label="Background Color - Light Mode"
          value={props.bgColorClassName}
          onChange={(v: string) => handleChange('bgColorClassName', v)}
          themeMode="light"
        />
        <GranularBGColorPickerButton
          label="Background Color - Dark Mode"
          value={props.bgColorClassName}
          onChange={(v: string) => handleChange('bgColorClassName', v)}
          themeMode="dark"
        />
      </div>


      <div className="space-y-4 mb-16">
        <div className="flex items-center justify-between">
          <Label className="mb-0">Slider Items</Label>
          <button
            type="button"
            onClick={() => {
              const newItems = [...(props.items || []), { title: '', description: '', id: Math.random().toString(36).substr(2, 9) }];
              handleChange('items', newItems);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 hover:bg-black/10 transition-all"
          >
            <Plus className="h-3 w-3" />
            Add Item
          </button>
        </div>

        <Reorder.Group
          axis="y"
          values={props.items || []}
          onReorder={(newItems) => handleChange('items', newItems)}
          className="space-y-4"
        >
          {(props.items || []).map((item: any, index: number) => (
            <Reorder.Item
              key={item.id || index}
              value={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="p-6 rounded-2xl bg-black/2 dark:bg-white/2 border border-black/5 dark:border-white/5 relative group/item">
                <div className="flex items-center justify-between mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-black/60 dark:bg-white/60 rounded-lg text-black/60 dark:text-white">
                      <ImageIcon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white">Item #{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = props.items.filter((_: any, i: number) => i !== index);
                        handleChange('items', newItems);
                      }}
                      className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="p-2 text-black/40 dark:text-white/40 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <Input
                    label="Item Title"
                    value={item.title}
                    onChange={(v) => {
                      const newItems = [...props.items];
                      newItems[index] = { ...newItems[index], title: v };
                      handleChange('items', newItems);
                    }}
                  />
                  <Input
                    label="Item Description"
                    value={item.description}
                    onChange={(v) => {
                      const newItems = [...props.items];
                      newItems[index] = { ...newItems[index], description: v };
                      handleChange('items', newItems);
                    }}
                    as="textarea"
                  />
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {(!props.items || props.items.length === 0) && (
          <div className="py-12 border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center px-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/20">No items added to slider</p>
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GranularBGColorPickerButton
          label="Card Color - Light Mode"
          value={props.cardColorClassName}
          onChange={(v: string) => handleChange('cardColorClassName', v)}
          themeMode="light"
        />
        <GranularBGColorPickerButton
          label="Card Color - Dark Mode"
          value={props.cardColorClassName}
          onChange={(v: string) => handleChange('cardColorClassName', v)}
          themeMode="dark"
        />
      </div>
    </div>
  );
}
