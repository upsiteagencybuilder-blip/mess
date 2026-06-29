"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight custom DropdownMenu (replaces Radix to avoid pointerdown
 * selection issues that break click-based dropdowns in this environment).
 * Same public API used by the app: DropdownMenu, DropdownMenuTrigger,
 * DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
 * DropdownMenuSeparator.
 */

interface DropdownCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = React.createContext<DropdownCtx | null>(null);
function useCtx() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("DropdownMenu components must be used within <DropdownMenu>");
  return c;
}

function DropdownMenu({
  children,
  defaultOpen,
  open: controlled,
  onOpenChange,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internal, setInternal] = React.useState(defaultOpen ?? false);
  const open = controlled ?? internal;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (controlled === undefined) setInternal(v);
      onOpenChange?.(v);
    },
    [controlled, onOpenChange]
  );
  return (
    <Ctx.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex">{children}</span>
    </Ctx.Provider>
  );
}

function DropdownMenuTrigger({
  children,
  asChild,
  ...props
}: {
  children: React.ReactElement;
  asChild?: boolean;
} & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const { open, setOpen } = useCtx();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className="inline-flex cursor-pointer"
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function DropdownMenuContent({
  children,
  className,
  align = "center",
  sideOffset = 4,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  const { open, setOpen } = useCtx();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const alignClass =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={ref}
      data-slot="dropdown-menu-content"
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md",
        "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        alignClass
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled,
  onSelect,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSelect?: () => void;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onClick">) {
  const { setOpen } = useCtx();
  return (
    <div
      role="menuitem"
      data-slot="dropdown-menu-item"
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e as unknown as React.MouseEvent);
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuLabel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      role="separator"
      className={cn("-mx-1 my-1 h-px bg-slate-200 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuPortal,
};
