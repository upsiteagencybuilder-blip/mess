"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight custom Tabs implementation (replaces Radix to avoid
 * pointerdown-selection issues that break click-based tab switching).
 * Same public API: <Tabs value onValueChange>, <TabsList>,
 * <TabsTrigger value>, <TabsContent value>.
 */

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsCtx(component: string) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used within <Tabs>`);
  }
  return ctx;
}

function Tabs({
  value,
  onValueChange,
  defaultValue,
  className,
  children,
  ...props
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">) {
  const baseId = React.useId();
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value ?? internal;

  const setValue = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [value, onValueChange]
  );

  const ctx = React.useMemo(
    () => ({ value: current, setValue, baseId }),
    [current, setValue, baseId]
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  value,
  className,
  children,
  onClick,
  ...props
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value">) {
  const ctx = useTabsCtx("TabsTrigger");
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      data-slot="tabs-trigger"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      tabIndex={isActive ? 0 : -1}
      id={`${ctx.baseId}-trigger-${value}`}
      aria-controls={`${ctx.baseId}-content-${value}`}
      onClick={(e) => {
        ctx.setValue(value);
        onClick?.(e);
      }}
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = useTabsCtx("TabsContent");
  if (ctx.value !== value) return null;

  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      id={`${ctx.baseId}-content-${value}`}
      aria-labelledby={`${ctx.baseId}-trigger-${value}`}
      tabIndex={0}
      className={cn("flex-1 outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
