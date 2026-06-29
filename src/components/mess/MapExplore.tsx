"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  BedDouble,
  Wallet,
  Phone,
  Building2,
  Loader2,
  X,
  ArrowRight,
  CheckCircle2,
  Clock,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ExploreMap from "./ExploreMap";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import { apiFetch, type MessListItem, type MessDetail } from "@/lib/api-client";
import { messTypeLabel, formatBDT } from "@/lib/constants";
import { haversineKm, formatDistance, DEFAULT_CENTER } from "@/lib/geo";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MapExploreProps {
  messes: MessListItem[];
}

export default function MapExplore({ messes }: MapExploreProps) {
  const selectedMessId = useAppStore((s) => s.selectedMessId);
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);
  const [detail, setDetail] = useState<MessDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch detail when a mess is selected
  useEffect(() => {
    if (!selectedMessId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    (async () => {
      try {
        const data = await apiFetch<MessDetail>(`/api/mess/${selectedMessId}`);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMessId]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedMessId(id);
      // Scroll to detail panel
      setTimeout(() => {
        document
          .getElementById("selected-mess-detail")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
    [setSelectedMessId]
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
            <MapPin className="size-6 text-teal-600" />
            ম্যাপে মেস খুঁজুন
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            আপনার এলাকা সিলেক্ট করুন — প্রতিটি পিনে ভাড়া ও দূরত্ব দেখানো হচ্ছে।
            পছন্দের পিনে ক্লিক করে বিস্তারিত দেখুন।
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedMessId(null)}
          className="h-8 gap-1.5"
        >
          <X className="size-3.5" />
          সিলেকশন মুছুন
        </Button>
      </div>

      {/* Map */}
      <div className="mb-6 h-[520px] overflow-hidden rounded-2xl border-2 border-teal-200 shadow-lg sm:h-[560px]">
        <ExploreMap
          messes={messes}
          selectedMessId={selectedMessId}
          onSelectMess={handleSelect}
          className="h-full"
        />
      </div>

      {/* Nearby messes quick list (sorted by distance) */}
      {!selectedMessId && (
        <NearbyList messes={messes} onSelect={handleSelect} />
      )}

      {/* Selected mess detail */}
      <AnimatePresence mode="wait">
        {selectedMessId && (
          <motion.div
            id="selected-mess-detail"
            key={selectedMessId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <Card className="border-teal-200">
                <CardContent className="flex items-center justify-center gap-3 py-16">
                  <Loader2 className="size-6 animate-spin text-teal-500" />
                  <span className="text-sm text-muted-foreground">
                    মেসের বিস্তারিত লোড হচ্ছে…
                  </span>
                </CardContent>
              </Card>
            ) : detail ? (
              <SelectedMessDetail detail={detail} messes={messes} />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Nearby list sorted by distance from RU center. */
function NearbyList({
  messes,
  onSelect,
}: {
  messes: MessListItem[];
  onSelect: (id: string) => void;
}) {
  const sorted = [...messes]
    .map((m) => ({
      ...m,
      distance: haversineKm(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, m.lat, m.lng),
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <Card className="border-slate-200">
      <CardContent className="px-4 py-4 sm:px-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Navigation className="size-4 text-teal-600" />
          কাছাকাছি মেসসমূহ (দূরত্ব অনুযায়ী)
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/50"
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
                <p className="text-[10px] text-muted-foreground">/সিট</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Full detail panel for the selected mess. */
function SelectedMessDetail({
  detail,
  messes,
}: {
  detail: MessDetail;
  messes: MessListItem[];
}) {
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);
  const user = useAppStore((s) => s.user);
  const setAuthOpen = useAppStore((s) => s.setAuthOpen);
  const { toast } = useToast();

  const distance = haversineKm(
    DEFAULT_CENTER.lat,
    DEFAULT_CENTER.lng,
    detail.lat,
    detail.lng
  );

  // Seat stats
  const occupiedSeats = detail.rooms.reduce(
    (acc, r) => acc + r.seats.filter((s) => s.status === "OCCUPIED").length,
    0
  );
  const totalSeats = detail.totalSeats;
  const vacantSeats = detail.vacantSeats;

  return (
    <Card className="overflow-hidden border-2 border-teal-300 shadow-lg">
      <div className="grid gap-0 lg:grid-cols-5">
        {/* Photo */}
        <div className="relative lg:col-span-2">
          <div className="relative h-48 w-full overflow-hidden bg-slate-100 lg:h-full">
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
                <Building2 className="size-16 text-slate-300" />
              </div>
            )}
            <div className="absolute left-3 top-3 flex gap-2">
              <Badge className="bg-teal-600 text-white hover:bg-teal-600">
                {messTypeLabel(detail.type)}
              </Badge>
              <Badge className="bg-white/90 text-slate-700 hover:bg-white/90">
                {detail.code}
              </Badge>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-3">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                  {detail.name}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-teal-600" />
                  {detail.address}, {detail.area}, {detail.city}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMessId(null)}
                className="h-8 shrink-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Quick stats */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile
                icon={<Wallet className="size-4" />}
                label="ভাড়া/সিট"
                value={formatBDT(detail.rentPerSeat)}
                color="teal"
              />
              <StatTile
                icon={<Navigation className="size-4" />}
                label="দূরত্ব"
                value={formatDistance(distance)}
                color="teal"
              />
              <StatTile
                icon={<BedDouble className="size-4" />}
                label="ফাঁকা সিট"
                value={`${vacantSeats}/${totalSeats}`}
                color={vacantSeats > 0 ? "teal" : "slate"}
              />
              <StatTile
                icon={<Building2 className="size-4" />}
                label="রুম"
                value={`${detail.totalRooms}`}
                color="slate"
              />
            </div>

            {/* Description */}
            {detail.description && (
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                {detail.description}
              </p>
            )}

            {/* Amenities */}
            {detail.amenities.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  সুযোগ-সুবিধা
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.amenities.map((a) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700"
                      >
                        <Icon className="size-3" />
                        {a}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Contact + actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-teal-500/10">
                  <Phone className="size-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">যোগাযোগ</p>
                  <a
                    href={`tel:${detail.contactNumber}`}
                    className="text-sm font-semibold text-teal-700 hover:underline"
                  >
                    {detail.contactNumber}
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-teal-300 text-teal-700 hover:bg-teal-50"
                  onClick={() => {
                    toast({
                      title: "নম্বর কপি হয়েছে",
                      description: detail.contactNumber,
                    });
                    navigator.clipboard?.writeText(detail.contactNumber);
                  }}
                >
                  কপি করুন
                </Button>
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => {
                    if (!user) {
                      setAuthOpen(true, "register");
                      toast({
                        title: "বুকিংয়ের জন্য লগইন দরকার",
                        description: "অ্যাকাউন্ট তৈরি করুন বা লগইন করুন।",
                      });
                    } else {
                      toast({
                        title: "বুকিং রিকোয়েস্ট",
                        description: "মেসের বিস্তারিত ডায়ালগ খুলছে…",
                      });
                    }
                  }}
                >
                  বুকিং রিকোয়েস্ট
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>

            {/* Room / seat map */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-slate-500">
                রুম ও সিট ম্যাপ{" "}
                <span className="font-normal text-slate-400">
                  ({occupiedSeats} বসবাসরত · {vacantSeats} ফাঁকা)
                </span>
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {detail.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="rounded-md border border-slate-200 bg-white p-2"
                    >
                      <p className="mb-1.5 text-xs font-semibold text-slate-700">
                        {room.roomNumber}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {room.seats.map((seat) => (
                          <span
                            key={seat.id}
                            title={
                              seat.status === "OCCUPIED"
                                ? seat.memberName || "বসবাসরত"
                                : "ফাঁকা"
                            }
                            className={cn(
                              "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-medium",
                              seat.status === "OCCUPIED"
                                ? "bg-teal-500 text-white"
                                : "border border-dashed border-teal-400 bg-teal-50 text-teal-600"
                            )}
                          >
                            {seat.seatNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "teal" | "slate";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        color === "teal"
          ? "border-teal-200 bg-teal-50"
          : "border-slate-200 bg-slate-50"
      )}
    >
      <div
        className={cn(
          "mb-1 flex items-center gap-1 text-xs",
          color === "teal" ? "text-teal-600" : "text-slate-500"
        )}
      >
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "text-sm font-bold sm:text-base",
          color === "teal" ? "text-teal-800" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
