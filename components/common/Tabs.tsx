"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  orientation: "horizontal" | "vertical";
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* components must be rendered inside <Tabs>");
  return ctx;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  children: React.ReactNode;
}

// Generic compound Tabs primitive — the codebase had no shared tab switcher
// (grep found none, and no Radix/shadcn Tabs installed). Built to the same
// controlled/uncontrolled pattern as most headless tab libs so it can be
// reused anywhere, not just in the settings page.
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const setValue = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: current, setValue, orientation }}>
      <div className={cn(orientation === "vertical" ? "flex flex-col lg:flex-row gap-6" : "", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabsList({ className, children }: TabsListProps) {
  const { orientation } = useTabsContext();
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        orientation === "vertical"
          ? "flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible shrink-0 lg:w-64 pb-2 lg:pb-0"
          : "flex flex-wrap gap-2 border-b border-black/5 dark:border-white/5 pb-0",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, icon, className, children }: TabsTriggerProps) {
  const { value: active, setValue, orientation } = useTabsContext();
  const isActive = active === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setValue(value)}
      className={cn(
        "font-haas font-bold uppercase tracking-wide outline-none transition-all duration-200 shrink-0",
        "focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-black focus-visible:ring-blue-500 dark:focus-visible:ring-red-500",
        orientation === "vertical"
          ? cn(
              "flex items-center gap-2.5 text-left px-4 py-2.5 rounded-md text-xs whitespace-nowrap lg:whitespace-normal",
              isActive
                ? "bg-blue-500 text-black dark:bg-red-500 dark:text-black shadow-sm"
                : "text-bluegray-800 dark:text-redgray-200 hover:bg-bluegray-100 dark:hover:bg-redgray-900/50"
            )
          : cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs border-b-2 -mb-px",
              isActive
                ? "border-blue-500 dark:border-red-500 text-black dark:text-white"
                : "border-transparent text-bluegray-800 dark:text-redgray-200 hover:text-black dark:hover:text-white"
            ),
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: active } = useTabsContext();
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={cn("min-w-0 flex-1", className)}>
      {children}
    </div>
  );
}
