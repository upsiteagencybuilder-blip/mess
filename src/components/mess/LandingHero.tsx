"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe2,
  Search,
  MapPin,
  X,
  ArrowRight,
  Sparkles,
  UserCircle,
} from "lucide-react";
import MessGlobe from "@/components/globe/MessGlobe";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BANGLADESH_AREAS, MESS_TYPES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { useMessFilter } from "@/store/mess-filter-store";
import type { MessListItem } from "@/lib/api-client";

export interface LandingHeroProps {
  messes: MessListItem[];
}

export default function LandingHero({ messes }: LandingHeroProps) {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const landingTab = useAppStore((s) => s.landingTab);
  const setLandingTab = useAppStore((s) => s.setLandingTab);
  const selectedArea = useAppStore((s) => s.selectedArea);
  const setSelectedArea = useAppStore((s) => s.setSelectedArea);
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);
  const setAuthOpen = useAppStore((s) => s.setAuthOpen);

  const setSearch = useMessFilter((s) => s.setSearch);
  const type = useMessFilter((s) => s.type);
  const setType = useMessFilter((s) => s.setType);

  const stats = useMemo(() => {
    const totalMesses = messes.length;
    const totalVacant = messes.reduce((s, m) => s + m.vacantSeats, 0);
    const areas = new Set(messes.map((m) => m.area));
    return { totalMesses, totalVacant, areasCount: areas.size };
  }, [messes]);

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-[#070b12]">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b12] via-[#0a1018] to-[#0f1623]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(20,184,166,0.18),transparent_62%)]" />

      {/* Globe (fills hero, behind content) */}
      <div className="absolute inset-0 z-0">
        <MessGlobe
          messes={messes}
          selectedArea={selectedArea}
          onSelectMess={setSelectedMessId}
        />
      </div>

      {/* Foreground overlay (pointer-events-none wrapper so globe stays interactive) */}
      <div className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/15">
              <Globe2 className="size-5 text-teal-400" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white sm:text-base">
                MessFinder BD
              </div>
              <div className="text-[10px] text-teal-300/70 sm:text-xs">
                ডিজিটাল মেস ম্যানেজমেন্ট
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
            <Tabs
              value={landingTab}
              onValueChange={(v) =>
                setLandingTab(v as "explore" | "list" | "map")
              }
            >
              <TabsList className="h-9 border border-white/10 bg-white/5 backdrop-blur-sm">
                <TabsTrigger
                  value="explore"
                  className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-200 data-[state=active]:shadow-none text-slate-300 text-xs sm:text-sm"
                >
                  এক্সপ্লোর
                </TabsTrigger>
                <TabsTrigger
                  value="map"
                  className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-200 data-[state=active]:shadow-none text-slate-300 text-xs sm:text-sm"
                >
                  ম্যাপ
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-200 data-[state=active]:shadow-none text-slate-300 text-xs sm:text-sm"
                >
                  তালিকা
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    useAppStore.getState().setProfileOpen(true)
                  }
                  size="sm"
                  className="h-9 gap-1.5 border border-teal-500/40 bg-teal-500/10 text-teal-200 hover:bg-teal-500/20 hover:text-teal-100"
                  variant="outline"
                >
                  <UserCircle className="size-4" />
                  <span className="hidden sm:inline">প্রোফাইল</span>
                </Button>
                <Button
                  onClick={() =>
                    setView(
                      user.role === "OWNER"
                        ? "owner-dashboard"
                        : user.role === "STAFF"
                          ? "staff-dashboard"
                          : "tenant-dashboard"
                    )
                  }
                  size="sm"
                  className="h-9 border border-teal-500/40 bg-teal-500/10 text-teal-200 hover:bg-teal-500/20 hover:text-teal-100"
                  variant="outline"
                >
                  ড্যাশবোর্ড
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setAuthOpen(true, "login")}
                size="sm"
                className="h-9 border border-teal-500/40 bg-teal-500/10 text-teal-200 hover:bg-teal-500/20 hover:text-teal-100"
                variant="outline"
              >
                লগইন
              </Button>
            )}
          </div>
        </header>

        {/* Headline + stats */}
        <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs text-teal-200"
            >
              <Sparkles className="size-3.5" />
              বাংলাদেশের ১ম ডিজিটাল মেস প্ল্যাটফর্ম
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              প্রতিটি মেসের একটি
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                গল্প আছে।
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4 max-w-xl text-sm text-slate-300/80 sm:text-base lg:text-lg"
            >
              বাংলাদেশের সেরা মেস ও সিটি খুঁজুন — রিয়েল-টাইম ভ্যাকেন্সি, স্বচ্ছ ভাড়া ও
              ইউটিলিটি বিল, সম্পূর্ণ ডিজিটাল।
            </motion.p>

            {/* Stats column */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.42 }}
              className="mt-8 flex flex-row gap-4 sm:flex-col sm:gap-3"
            >
              <StatItem value={stats.totalMesses} label="মোট মেস" />
              <StatItem value={stats.totalVacant} label="ফাঁকা সিট" />
              <StatItem value={stats.areasCount} label="এলাকা" />
            </motion.div>
          </div>
        </div>

        {/* Bottom: floating search bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="pointer-events-auto px-4 pb-6 sm:px-6 sm:pb-8 lg:px-10"
        >
          <HeroSearchBar
            onSearchChange={setSearch}
            onTypeToggle={setType}
            activeType={type}
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
            onViewMap={() => setLandingTab("map")}
          />
        </motion.div>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-teal-300 sm:text-3xl lg:text-4xl">
        {value.toLocaleString("en-BD")}
      </span>
      <span className="text-xs text-slate-400 sm:text-sm">{label}</span>
    </div>
  );
}

interface HeroSearchBarProps {
  onSearchChange: (s: string) => void;
  onTypeToggle: (t: string | null) => void;
  activeType: string | null;
  selectedArea: string | null;
  onSelectArea: (a: string | null) => void;
  onViewMap: () => void;
}

function HeroSearchBar({
  onSearchChange,
  onTypeToggle,
  activeType,
  selectedArea,
  onSelectArea,
  onViewMap,
}: HeroSearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BANGLADESH_AREAS.slice(0, 6);
    return BANGLADESH_AREAS.filter(
      (a) =>
        a.area.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setOpen(true);
    onSearchChange(val);
    // Auto-match an area by exact name
    const match = BANGLADESH_AREAS.find(
      (a) => a.area.toLowerCase() === val.trim().toLowerCase()
    );
    onSelectArea(match ? match.area : null);
  };

  const pickArea = (area: string) => {
    setQuery(area);
    setOpen(false);
    onSearchChange(area);
    onSelectArea(area);
    onViewMap();
  };

  const clearAll = () => {
    setQuery("");
    onSearchChange("");
    onSelectArea(null);
    onTypeToggle(null);
  };

  const hasActive = !!query || !!activeType || !!selectedArea;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        ref={wrapRef}
        className="rounded-2xl border border-teal-500/20 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-xl sm:p-4"
      >
        <div className="flex flex-col gap-3">
          {/* Search input row */}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Search className="size-5 shrink-0 text-teal-300" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setOpen(false);
                    if (suggestions.length > 0) {
                      pickArea(suggestions[0].area);
                    } else {
                      onViewMap();
                    }
                  }
                }}
                placeholder="এলাকা / মেসের নাম লিখুন (যেমন Kazla)"
                className="h-9 w-full min-w-0 bg-transparent text-sm text-white placeholder:text-slate-400 outline-none sm:text-base"
                aria-label="মেস খুঁজুন"
              />
              {hasActive && (
                <button
                  onClick={clearAll}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="পরিষ্কার করুন"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Area suggestions dropdown */}
            {open && suggestions.length > 0 && (
              <div className="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-teal-500/20 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
                <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-teal-300/70">
                  এলাকা নির্বাচন করুন
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {suggestions.map((a) => (
                    <button
                      key={a.area}
                      onClick={() => pickArea(a.area)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-teal-500/10",
                        selectedArea === a.area && "bg-teal-500/15"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-teal-400" />
                        <div>
                          <div className="text-sm font-medium text-white">
                            {a.area}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {a.city}
                          </div>
                        </div>
                      </div>
                      {selectedArea === a.area && (
                        <span className="text-[10px] font-medium text-teal-300">
                          নির্বাচিত
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Type chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 sm:text-sm">ধরন:</span>
            {MESS_TYPES.map((t) => {
              const active = activeType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => onTypeToggle(active ? null : t.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                    active
                      ? "border-teal-400 bg-teal-500/20 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-200"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
            <div className="ml-auto hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
              <span className="inline-flex size-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.7)]" />
              রিয়েল-টাইম আপডেট
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
