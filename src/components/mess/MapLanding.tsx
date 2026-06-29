"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  Filter,
  X,
  SlidersHorizontal,
  UserCircle,
  LogIn,
  BedDouble,
  Wallet,
  Phone,
  Building2,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Home,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ExploreMap from "./ExploreMap";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import { apiFetch, type MessListItem, type MessDetail } from "@/lib/api-client";
import {
  BANGLADESH_AREAS,
  RAJSHAHI_UNIVERSITY,
  MESS_TYPES,
  AMENITIES,
  messTypeLabel,
  formatBDT,
} from "@/lib/constants";
import { haversineKm, formatDistance } from "@/lib/geo";
import { useAppStore } from "@/store/app-store";
import { useMessFilter, filterMesses } from "@/store/mess-filter-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MapLandingProps {
  messes: MessListItem[];
}

export default function MapLanding({ messes }: MapLandingProps) {
  const user = useAppStore((s) => s.user);
  const setAuthOpen = useAppStore((s) => s.setAuthOpen);
  const setProfileOpen = useAppStore((s) => s.setProfileOpen);
  const setView = useAppStore((s) => s.setView);
  const selectedMessId = useAppStore((s) => s.selectedMessId);
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);

  // Filter store
  const search = useMessFilter((s) => s.search);
  const setSearch = useMessFilter((s) => s.setSearch);
  const type = useMessFilter((s) => s.type);
  const setType = useMessFilter((s) => s.setType);
  const minRent = useMessFilter((s) => s.minRent);
  const maxRent = useMessFilter((s) => s.maxRent);
  const setRentRange = useMessFilter((s) => s.setRentRange);
  const amenities = useMessFilter((s) => s.amenities);
  const toggleAmenity = useMessFilter((s) => s.toggleAmenity);
  const onlyVacant = useMessFilter((s) => s.onlyVacant);
  const setOnlyVacant = useMessFilter((s) => s.setOnlyVacant);
  const refPoint = useMessFilter((s) => s.refPoint);
  const setRefPoint = useMessFilter((s) => s.setRefPoint);
  const maxDistance = useMessFilter((s) => s.maxDistance);
  const setMaxDistance = useMessFilter((s) => s.setMaxDistance);
  const resetFilters = useMessFilter((s) => s.reset);

  const [detail, setDetail] = useState<MessDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { toast } = useToast();

  // Apply filters
  const filteredMesses = useMemo(
    () =>
      filterMesses(messes, {
        search,
        type,
        minRent,
        maxRent,
        amenities,
        onlyVacant,
        refPoint,
        maxDistance,
      }),
    [messes, search, type, minRent, maxRent, amenities, onlyVacant, refPoint, maxDistance]
  );

  // Fetch detail when selected
  useEffect(() => {
    if (!selectedMessId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setDetail(null);
    (async () => {
      try {
        const data = await apiFetch<MessDetail>(`/api/mess/${selectedMessId}`);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMessId]);

  const handleSelectMess = useCallback(
    (id: string) => setSelectedMessId(id),
    [setSelectedMessId]
  );

  const hasActiveFilters =
    !!search ||
    !!type ||
    minRent !== null ||
    maxRent !== null ||
    amenities.length > 0 ||
    onlyVacant ||
    maxDistance !== null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Home className="size-5" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-foreground">মেস সেটল</span>
            <span className="ml-1 text-xs text-muted-foreground">· রাজশাহী</span>
          </div>
        </div>

        {/* Global search */}
        <div className="relative flex-1 max-w-md mx-2 sm:mx-4">
          <AreaSearch
            value={search}
            onChange={setSearch}
            onPickArea={(a) => {
              setRefPoint({ lat: a.lat, lng: a.lng, label: a.area });
              setSearch(a.area);
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile filter button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative h-9 gap-1.5 lg:hidden"
              >
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">ফিল্টার</span>
                {hasActiveFilters && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-teal-600" />
                  ফিল্টার
                </SheetTitle>
              </SheetHeader>
              <FilterPanel
                type={type}
                setType={setType}
                minRent={minRent}
                maxRent={maxRent}
                setRentRange={setRentRange}
                amenities={amenities}
                toggleAmenity={toggleAmenity}
                onlyVacant={onlyVacant}
                setOnlyVacant={setOnlyVacant}
                maxDistance={maxDistance}
                setMaxDistance={setMaxDistance}
                resultCount={filteredMesses.length}
                totalCount={messes.length}
                onReset={() => {
                  resetFilters();
                }}
              />
            </SheetContent>
          </Sheet>

          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProfileOpen(true)}
                className="h-9 gap-1.5"
              >
                <UserCircle className="size-4 text-teal-600" />
                <span className="hidden max-w-20 truncate sm:inline">
                  {user.name.split(" ")[0]}
                </span>
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  setView(
                    user.role === "OWNER"
                      ? "owner-dashboard"
                      : user.role === "STAFF"
                        ? "staff-dashboard"
                        : "tenant-dashboard"
                  )
                }
                className="hidden h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 sm:flex"
              >
                ড্যাশবোর্ড
                <ArrowRight className="size-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setAuthOpen(true, "login")}
              className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700"
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline">লগইন</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left filter sidebar — desktop */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <SlidersHorizontal className="size-4 text-teal-600" />
              ফিল্টার
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <FilterPanel
              type={type}
              setType={setType}
              minRent={minRent}
              maxRent={maxRent}
              setRentRange={setRentRange}
              amenities={amenities}
              toggleAmenity={toggleAmenity}
              onlyVacant={onlyVacant}
              setOnlyVacant={setOnlyVacant}
              maxDistance={maxDistance}
              setMaxDistance={setMaxDistance}
              resultCount={filteredMesses.length}
              totalCount={messes.length}
              onReset={() => resetFilters()}
            />
          </ScrollArea>
        </aside>

        {/* Map area */}
        <div className="relative flex-1">
          <ExploreMap
            messes={filteredMesses}
            selectedMessId={selectedMessId}
            onSelectMess={handleSelectMess}
            refPoint={refPoint}
            maxDistance={maxDistance}
            className="h-full"
          />

          {/* Result count badge — top center over map */}
          <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full border border-teal-200 bg-white/95 px-4 py-1.5 text-sm shadow-lg">
            <span className="font-bold text-teal-700">{filteredMesses.length}</span>
            <span className="text-slate-600"> / {messes.length} টি মেস পাওয়া গেছে</span>
            {hasActiveFilters && (
              <button
                onClick={() => resetFilters()}
                className="pointer-events-auto ml-2 text-xs text-rose-500 hover:underline"
              >
                রিসেট
              </button>
            )}
          </div>
        </div>

        {/* Right detail panel — desktop */}
        <aside className="hidden w-96 shrink-0 border-l border-slate-200 bg-white xl:flex xl:flex-col">
          <DetailPanel
            loading={loadingDetail}
            detail={detail}
            selectedMessId={selectedMessId}
            messes={filteredMesses}
            refPoint={refPoint}
            onSelectMess={handleSelectMess}
            onClose={() => setSelectedMessId(null)}
          />
        </aside>
      </div>

      {/* Mobile detail sheet */}
      <AnimatePresence>
        {selectedMessId && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[600] max-h-[75vh] overflow-hidden rounded-t-2xl border-t-2 border-teal-300 bg-white shadow-2xl xl:hidden"
          >
            <div className="flex justify-center pb-1 pt-2">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <DetailPanel
                loading={loadingDetail}
                detail={detail}
                selectedMessId={selectedMessId}
                messes={filteredMesses}
                refPoint={refPoint}
                onSelectMess={handleSelectMess}
                onClose={() => setSelectedMessId(null)}
                isMobile
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Area search ---------- */
function AreaSearch({
  value,
  onChange,
  onPickArea,
}: {
  value: string;
  onChange: (s: string) => void;
  onPickArea: (a: (typeof BANGLADESH_AREAS)[number]) => void;
}) {
  const [open, setOpen] = useState(false);

  const suggestions = BANGLADESH_AREAS.filter((a) =>
    a.area.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
        <Search className="size-4 shrink-0 text-teal-600" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions.length > 0) {
              onPickArea(suggestions[0]);
              setOpen(false);
            }
          }}
          placeholder="এলাকা বা মেসের নাম..."
          className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
      {open && suggestions.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {suggestions.map((a) => (
              <button
                key={a.area}
                onClick={() => {
                  onPickArea(a);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-teal-50"
              >
                <MapPin className="size-3.5 text-teal-500" />
                <span className="font-medium">{a.area}</span>
                <span className="text-xs text-slate-400">{a.city}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Filter panel ---------- */
function FilterPanel({
  type,
  setType,
  minRent,
  maxRent,
  setRentRange,
  amenities,
  toggleAmenity,
  onlyVacant,
  setOnlyVacant,
  maxDistance,
  setMaxDistance,
  resultCount,
  totalCount,
  onReset,
}: {
  type: string | null;
  setType: (t: string | null) => void;
  minRent: number | null;
  maxRent: number | null;
  setRentRange: (min: number | null, max: number | null) => void;
  amenities: string[];
  toggleAmenity: (a: string) => void;
  onlyVacant: boolean;
  setOnlyVacant: (v: boolean) => void;
  maxDistance: number | null;
  setMaxDistance: (d: number | null) => void;
  resultCount: number;
  totalCount: number;
  onReset: () => void;
}) {
  const rentMax = maxRent ?? 5000;
  const distanceVal = maxDistance ?? 10;

  return (
    <div className="space-y-5 p-4">
      {/* Result count */}
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-teal-700">{resultCount}</p>
            <p className="text-xs text-teal-600">
              মেস পাওয়া গেছে (মোট {totalCount})
            </p>
          </div>
          <CheckCircle2 className="size-8 text-teal-400" />
        </div>
      </div>

      {/* Distance filter */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            দূরত্ব (কেন্দ্র থেকে)
          </label>
          {maxDistance !== null && (
            <button
              onClick={() => setMaxDistance(null)}
              className="text-xs text-rose-400 hover:underline"
            >
              মুছুন
            </button>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>০</span>
            <span className="font-semibold text-teal-600">
              {maxDistance !== null ? `≤ ${maxDistance} কিমি` : "সব দূরত্ব"}
            </span>
            <span>১০ কিমি</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={distanceVal}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-full accent-teal-600"
          />
          <div className="flex gap-1">
            {[
              { label: "৫০০মি", val: 0.5 },
              { label: "১কিমি", val: 1 },
              { label: "২কিমি", val: 2 },
              { label: "৫কিমি", val: 5 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setMaxDistance(p.val)}
                className={cn(
                  "flex-1 rounded-md border px-1 py-1 text-[10px] font-medium transition",
                  maxDistance === p.val
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Price filter */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            ভাড়া (প্রতি সিট / মাস)
          </label>
          {(minRent !== null || maxRent !== null) && (
            <button
              onClick={() => setRentRange(null, null)}
              className="text-xs text-rose-400 hover:underline"
            >
              মুছুন
            </button>
          )}
        </div>
        <div className="mb-2 flex items-center gap-2">
          <Input
            type="number"
            placeholder="ন্যূনতম"
            value={minRent ?? ""}
            onChange={(e) =>
              setRentRange(e.target.value ? Number(e.target.value) : null, maxRent)
            }
            className="h-8 text-xs"
          />
          <span className="text-xs text-slate-400">—</span>
          <Input
            type="number"
            placeholder="সর্বোচ্চ"
            value={maxRent ?? ""}
            onChange={(e) =>
              setRentRange(minRent, e.target.value ? Number(e.target.value) : null)
            }
            className="h-8 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            { label: "≤৳১৫০০", min: null, max: 1500 },
            { label: "৳১৫০০-২৫০০", min: 1500, max: 2500 },
            { label: "৳২৫০০-৪০০০", min: 2500, max: 4000 },
            { label: "৳৪০০০+", min: 4000, max: null },
          ].map((p, i) => (
            <button
              key={i}
              onClick={() => setRentRange(p.min, p.max)}
              className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-medium transition",
                minRent === p.min && maxRent === p.max
                  ? "border-teal-500 bg-teal-500 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Mess type */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          মেসের ধরন
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setType(null)}
            className={cn(
              "rounded-md border px-2 py-1.5 text-xs font-medium transition",
              !type
                ? "border-teal-500 bg-teal-500 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
            )}
          >
            সব ধরন
          </button>
          {MESS_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(type === t.value ? null : t.value)}
              className={cn(
                "rounded-md border px-2 py-1.5 text-xs font-medium transition",
                type === t.value
                  ? "border-teal-500 bg-teal-500 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Amenities */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          সুযোগ-সুবিধা
        </label>
        <div className="flex flex-wrap gap-1">
          {AMENITIES.map((a) => {
            const active = amenities.includes(a.key);
            const Icon = getAmenityIcon(a.key);
            return (
              <button
                key={a.key}
                onClick={() => toggleAmenity(a.key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-medium transition",
                  active
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
                )}
              >
                <Icon className="size-3" />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Vacant only */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-700">শুধু ফাঁকা সিট</p>
          <p className="text-[10px] text-slate-400">যেসব মেসে কমপক্ষে ১টি সিট খালি</p>
        </div>
        <Switch checked={onlyVacant} onCheckedChange={setOnlyVacant} />
      </div>

      {/* Reset all */}
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
      >
        <X className="mr-1 size-3.5" />
        সব ফিল্টার রিসেট করুন
      </Button>
    </div>
  );
}

/* ---------- Detail panel (right side / mobile bottom) ---------- */
function DetailPanel({
  loading,
  detail,
  selectedMessId,
  messes,
  refPoint,
  onSelectMess,
  onClose,
  isMobile,
}: {
  loading: boolean;
  detail: MessDetail | null;
  selectedMessId: string | null;
  messes: MessListItem[];
  refPoint: { lat: number; lng: number; label: string };
  onSelectMess: (id: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}) {
  const setView = useAppStore((s) => s.setView);

  // No selection → show nearby list
  if (!selectedMessId) {
    const sorted = [...messes]
      .map((m) => ({
        ...m,
        distance: haversineKm(refPoint.lat, refPoint.lng, m.lat, m.lng),
      }))
      .sort((a, b) => a.distance - b.distance);

    return (
      <div className="flex h-full flex-col">
        <div className="border-b px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Navigation className="size-4 text-teal-600" />
            কাছাকাছি মেস
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {refPoint.label} থেকে দূরত্ব অনুযায়ী
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {sorted.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                ফিল্টারে কোনো মেস পাওয়া যায়নি।
              </div>
            ) : (
              sorted.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMess(m.id)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/50"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-700">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {m.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="size-3" />
                        {m.area}
                      </span>
                      <span className="flex items-center gap-0.5 text-teal-600">
                        <Navigation className="size-3" />
                        {formatDistance(m.distance)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-teal-700">
                      {formatBDT(m.rentPerSeat)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      ফাঁকা {m.vacantSeats}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Selected → show COMPACT summary card + "বিস্তারিত দেখুন" button
  const distance = detail
    ? haversineKm(refPoint.lat, refPoint.lng, detail.lat, detail.lng)
    : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header with close */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-bold text-foreground">নির্বাচিত মেস</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16">
            <Loader2 className="size-5 animate-spin text-teal-500" />
            <span className="text-sm text-muted-foreground">লোড হচ্ছে…</span>
          </div>
        ) : detail ? (
          <div className="p-3">
            {/* Photo */}
            <div className="relative mb-3 h-36 overflow-hidden rounded-lg bg-slate-100">
              {detail.photos[0] ? (
                <img
                  src={detail.photos[0]}
                  alt={detail.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Building2 className="size-10 text-slate-300" />
                </div>
              )}
              <div className="absolute left-2 top-2 flex gap-1.5">
                <Badge className="bg-teal-600 text-white hover:bg-teal-600">
                  {messTypeLabel(detail.type)}
                </Badge>
              </div>
              {detail.vacantSeats > 0 && (
                <div className="absolute right-2 top-2">
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                    ফাঁকা {detail.vacantSeats}
                  </Badge>
                </div>
              )}
            </div>

            {/* Name + address */}
            <h2 className="text-base font-bold text-foreground">{detail.name}</h2>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3 text-teal-600" />
              {detail.area}, {detail.city}
            </p>

            {/* Quick stats */}
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-2 text-center">
                <div className="flex items-center justify-center gap-0.5 text-[10px] text-teal-600">
                  <Wallet className="size-3" />
                  ভাড়া
                </div>
                <p className="mt-0.5 text-sm font-bold text-teal-800">
                  {formatBDT(detail.rentPerSeat)}
                </p>
              </div>
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-2 text-center">
                <div className="flex items-center justify-center gap-0.5 text-[10px] text-teal-600">
                  <Navigation className="size-3" />
                  দূরত্ব
                </div>
                <p className="mt-0.5 text-sm font-bold text-teal-800">
                  {formatDistance(distance)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
                <div className="flex items-center justify-center gap-0.5 text-[10px] text-slate-500">
                  <BedDouble className="size-3" />
                  সিট
                </div>
                <p className="mt-0.5 text-sm font-bold text-foreground">
                  {detail.vacantSeats}/{detail.totalSeats}
                </p>
              </div>
            </div>

            {/* Amenities preview */}
            {detail.amenities.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-semibold text-slate-500">
                  সুযোগ-সুবিধা ({detail.amenities.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {detail.amenities.slice(0, 6).map((a) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <span
                        key={a}
                        className="inline-flex items-center gap-0.5 rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[9px] font-medium text-teal-700"
                      >
                        <Icon className="size-2.5" />
                        {a}
                      </span>
                    );
                  })}
                  {detail.amenities.length > 6 && (
                    <span className="text-[9px] text-slate-400">
                      +{detail.amenities.length - 6} আরও
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contact quick */}
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <Phone className="size-4 text-teal-600" />
              <a
                href={`tel:${detail.contactNumber}`}
                className="flex-1 text-xs font-semibold text-teal-700 hover:underline"
              >
                {detail.contactNumber}
              </a>
            </div>

            {/* CTA: বিস্তারিত দেখুন */}
            <Button
              onClick={() => setView("mess-detail")}
              className="mt-3 w-full bg-teal-600 hover:bg-teal-700"
              size="sm"
            >
              বিস্তারিত দেখুন
              <ArrowRight className="ml-1 size-4" />
            </Button>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">
              ছবি, সিট ম্যাপ, বুকিং ও সব তথ্যের জন্য
            </p>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">
            তথ্য লোড করা যায়নি।
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
