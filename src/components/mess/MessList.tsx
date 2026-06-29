"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Building2,
  RotateCcw,
  Filter,
} from "lucide-react";
import MessCard from "./MessCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AMENITIES, MESS_TYPES, formatBDT } from "@/lib/constants";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import { useAppStore } from "@/store/app-store";
import { useMessFilter } from "@/store/mess-filter-store";
import type { MessListItem } from "@/lib/api-client";

export interface MessListProps {
  messes: MessListItem[];
  onSelect?: (id: string) => void;
}

const RENT_MIN = 0;
const RENT_MAX = 30000;
const RENT_STEP = 500;

export default function MessList({ messes, onSelect }: MessListProps) {
  const selectedArea = useAppStore((s) => s.selectedArea);
  const setSelectedArea = useAppStore((s) => s.setSelectedArea);
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);

  const search = useMessFilter((s) => s.search);
  const setSearch = useMessFilter((s) => s.setSearch);
  const type = useMessFilter((s) => s.type);
  const setType = useMessFilter((s) => s.setType);
  const minRent = useMessFilter((s) => s.minRent);
  const maxRent = useMessFilter((s) => s.maxRent);
  const amenities = useMessFilter((s) => s.amenities);
  const toggleAmenity = useMessFilter((s) => s.toggleAmenity);
  const onlyVacant = useMessFilter((s) => s.onlyVacant);
  const setOnlyVacant = useMessFilter((s) => s.setOnlyVacant);
  const reset = useMessFilter((s) => s.reset);

  const [sheetOpen, setSheetOpen] = useState(false);

  // The parent may pre-filter by area; we apply the rest of the filter-store
  // state on top of whatever messes we receive.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messes.filter((m) => {
      if (type && m.type !== type) return false;
      if (onlyVacant && m.vacantSeats <= 0) return false;
      if (minRent != null && m.rentPerSeat < minRent) return false;
      if (maxRent != null && m.rentPerSeat > maxRent) return false;
      if (amenities.length > 0) {
        const ok = amenities.every((a) => m.amenities.includes(a));
        if (!ok) return false;
      }
      if (q) {
        const hay = `${m.name} ${m.area} ${m.city} ${m.code}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [messes, search, type, onlyVacant, minRent, maxRent, amenities]);

  const handleSelect = (id: string) => {
    setSelectedMessId(id);
    onSelect?.(id);
  };

  const resetAll = () => {
    reset();
    setSelectedArea(null);
  };

  const hasActiveFilters =
    !!search ||
    !!type ||
    !!onlyVacant ||
    minRent != null ||
    maxRent != null ||
    amenities.length > 0 ||
    !!selectedArea;

  return (
    <section className="bg-background px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
              <Building2 className="size-7 text-teal-500" />
              মেস তালিকা
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              মেসের সংখ্যা:{" "}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              / {messes.length}
            </p>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-4" />
              ফিল্টার রিসেট
            </Button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {selectedArea && (
              <FilterChip
                label={`এলাকা: ${selectedArea}`}
                onClear={() => setSelectedArea(null)}
              />
            )}
            {type && (
              <FilterChip
                label={MESS_TYPES.find((t) => t.value === type)?.label ?? type}
                onClear={() => setType(null)}
              />
            )}
            {onlyVacant && (
              <FilterChip
                label="শুধু ফাঁকা সিট"
                onClear={() => setOnlyVacant(false)}
              />
            )}
            {amenities.map((a) => (
              <FilterChip
                key={a}
                label={AMENITIES.find((x) => x.key === a)?.label ?? a}
                onClear={() => toggleAmenity(a)}
              />
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="মেসের নাম / এলাকা / সিটি দিয়ে খুঁজুন"
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filter sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 min-h-11 border-teal-500/30 text-teal-700 hover:bg-teal-500/10 dark:text-teal-300 lg:hidden"
                >
                  <SlidersHorizontal className="size-4" />
                  ফিল্টার
                  {hasActiveFilters && (
                    <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                      !
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[85vh] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="size-5 text-teal-500" />
                    ফিল্টার অপশন
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterControls />
                </div>
                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetAll}
                  >
                    রিসেট
                  </Button>
                  <Button
                    className="flex-1 bg-teal-600 text-white hover:bg-teal-700"
                    onClick={() => setSheetOpen(false)}
                  >
                    {filtered.length} টি ফলাফল দেখুন
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              className="hidden h-9 min-h-11 border-teal-500/30 text-teal-700 hover:bg-teal-500/10 dark:text-teal-300 lg:inline-flex"
              onClick={resetAll}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="size-4" />
              রিসেট
            </Button>
          </div>
        </div>

        {/* Desktop inline filter controls (always visible on lg+) */}
        <div className="mb-6 hidden rounded-2xl border bg-card p-4 shadow-sm lg:block">
          <FilterControls />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <EmptyState onReset={resetAll} />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((m, i) => (
              <MessCard
                key={m.id}
                mess={m}
                index={i}
                onSelect={handleSelect}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

/** Top-level filter controls component — reads its own state from the filter store. */
function FilterControls() {
  const type = useMessFilter((s) => s.type);
  const setType = useMessFilter((s) => s.setType);
  const minRent = useMessFilter((s) => s.minRent);
  const maxRent = useMessFilter((s) => s.maxRent);
  const setRentRange = useMessFilter((s) => s.setRentRange);
  const amenities = useMessFilter((s) => s.amenities);
  const toggleAmenity = useMessFilter((s) => s.toggleAmenity);
  const onlyVacant = useMessFilter((s) => s.onlyVacant);
  const setOnlyVacant = useMessFilter((s) => s.setOnlyVacant);

  const rentRange: [number, number] = [
    minRent ?? RENT_MIN,
    maxRent ?? RENT_MAX,
  ];

  const onRentChange = (val: number[]) => {
    if (Array.isArray(val) && val.length === 2) {
      const [lo, hi] = val as [number, number];
      setRentRange(lo === RENT_MIN ? null : lo, hi === RENT_MAX ? null : hi);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Type */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          মেসের ধরন
        </Label>
        <Select
          value={type ?? "__all"}
          onValueChange={(v) => setType(v === "__all" ? null : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="সব ধরন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">সব ধরন</SelectItem>
            {MESS_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rent range */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            ভাড়ার পরিসর (মাসিক / সিট)
          </Label>
          <span className="text-xs font-medium text-teal-600 dark:text-teal-300">
            {formatBDT(rentRange[0])} – {formatBDT(rentRange[1])}
          </span>
        </div>
        <Slider
          min={RENT_MIN}
          max={RENT_MAX}
          step={RENT_STEP}
          value={rentRange}
          onValueChange={onRentChange}
          className="py-2"
        />
      </div>

      {/* Amenities */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          সুবিধাসমূহ
        </Label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const Icon = getAmenityIcon(a.key);
            const active = amenities.includes(a.key);
            return (
              <button
                key={a.key}
                onClick={() => toggleAmenity(a.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-teal-400 bg-teal-500/15 text-teal-700 dark:text-teal-200"
                    : "border-border bg-background text-muted-foreground hover:border-teal-500/40 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vacant toggle */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
        <div className="flex flex-col">
          <span className="text-sm font-medium">শুধু ফাঁকা সিট</span>
          <span className="text-xs text-muted-foreground">
            যেসব মেসে কমপক্ষে একটি সিট ফাঁকা আছে
          </span>
        </div>
        <Switch checked={onlyVacant} onCheckedChange={setOnlyVacant} />
      </div>
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-full bg-teal-500/10 py-1 pl-3 pr-1.5 text-teal-700 dark:text-teal-200"
    >
      {label}
      <button
        onClick={onClear}
        className="flex size-4 items-center justify-center rounded-full hover:bg-teal-500/20"
        aria-label="ফিল্টার মুছুন"
      >
        <X className="size-3" />
      </button>
    </Badge>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-teal-500/10 text-teal-500">
        <Search className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">কোনো মেস পাওয়া যায়নি</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        আপনার ফিল্টারের সাথে মিলে এমন কোনো মেস নেই। ফিল্টার পরিবর্তন করে আবার
        চেষ্টা করুন।
      </p>
      <Button
        onClick={onReset}
        className="mt-5 bg-teal-600 text-white hover:bg-teal-700"
      >
        <RotateCcw className="size-4" />
        ফিল্টার রিসেট করুন
      </Button>
    </div>
  );
}
