"use client";

import { Home } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export interface NavTab {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

interface MobileBottomNavProps {
  tabs: NavTab[];
  activeTab: string;
  onTabChange?: (key: string) => void;
}

/**
 * Reusable mobile bottom navigation bar — app-like.
 * Shows on mobile only (lg:hidden). Each dashboard passes its own tabs.
 */
export default function MobileBottomNav({
  tabs,
  activeTab,
  onTabChange,
}: MobileBottomNavProps) {
  const setView = useAppStore((s) => s.setView);

  return (
    <nav
      className="flex h-16 shrink-0 items-stretch justify-around border-t border-slate-200/80 bg-white/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => {
              if (onTabChange) onTabChange(tab.key);
              tab.onClick?.();
            }}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors",
              isActive ? "text-teal-600" : "text-slate-400"
            )}
          >
            <Icon className={cn("size-5", isActive && "fill-teal-100")} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
      {/* Always-present home button to go back to landing */}
      <button
        onClick={() => setView("landing")}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-slate-400 transition-colors"
      >
        <Home className="size-5" />
        <span className="text-[10px] font-medium">হোম</span>
      </button>
    </nav>
  );
}
