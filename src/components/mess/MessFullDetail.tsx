"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  BedDouble,
  Wallet,
  Phone,
  Building2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  ShieldCheck,
  Home,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import { apiFetch, type MessListItem, type MessDetail } from "@/lib/api-client";
import {
  messTypeLabel,
  formatBDT,
  RAJSHAHI_UNIVERSITY,
} from "@/lib/constants";
import { haversineKm, formatDistance } from "@/lib/geo";
import { useAppStore } from "@/store/app-store";
import { useMessFilter } from "@/store/mess-filter-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logAnalyticsEvent } from "@/lib/firebase";

interface MessFullDetailProps {
  messes: MessListItem[];
}

export default function MessFullDetail({ messes }: MessFullDetailProps) {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const setAuthOpen = useAppStore((s) => s.setAuthOpen);
  const setProfileOpen = useAppStore((s) => s.setProfileOpen);
  const selectedMessId = useAppStore((s) => s.selectedMessId);
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);
  const refPoint = useMessFilter((s) => s.refPoint);

  const [detail, setDetail] = useState<MessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [bookingStep, setBookingStep] = useState<"form" | "confirm" | "done">(
    "form"
  );
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingMsg, setBookingMsg] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch detail
  useEffect(() => {
    if (!selectedMessId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    setPhotoIdx(0);
    setBookingStep("form");
    setSelectedRoomId("");
    setSelectedSeatId("");
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

  // Prefill booking form if logged in
  useEffect(() => {
    if (user) {
      setBookingName(user.name);
      setBookingPhone(user.phone || "");
    }
  }, [user, selectedMessId]);

  const goBack = useCallback(() => {
    setView("landing");
  }, [setView]);

  const selectOtherMess = useCallback(
    (id: string) => {
      setSelectedMessId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSelectedMessId]
  );

  const handleBook = async () => {
    if (!detail) return;
    if (!bookingName.trim() || !bookingPhone.trim()) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "নাম ও ফোন নম্বর প্রয়োজন",
        variant: "destructive",
      });
      return;
    }
    if (!selectedSeatId) {
      toast({
        title: "সিট নির্বাচন করুন",
        description: "অনুগ্রহ করে একটি ফাঁকা সিট নির্বাচন করুন",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/booking", {
        method: "POST",
        body: JSON.stringify({
          messId: detail.id,
          name: bookingName,
          phone: bookingPhone,
          message: bookingMsg,
          seatId: selectedSeatId,
        }),
      });
      setBookingStep("done");
      // Log booking event to Firebase Analytics
      logAnalyticsEvent("booking_request", {
        mess_id: detail.id,
        mess_name: detail.name,
        rent: detail.rentPerSeat,
      });
      toast({
        title: "বুকিং রিকোয়েস্ট সফল!",
        description: "মেস ম্যানেজার শীঘ্রই আপনার সাথে যোগাযোগ করবেন।",
      });
    } catch (e) {
      toast({
        title: "বুকিং ব্যর্থ",
        description: e instanceof Error ? e.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-teal-500" />
          <p className="text-sm text-slate-500">মেসের বিস্তারিত লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-sm text-slate-500">মেসের তথ্য পাওয়া যায়নি।</p>
        <Button onClick={goBack} variant="outline">
          <ArrowLeft className="mr-1 size-4" />
          ম্যাপে ফিরুন
        </Button>
      </div>
    );
  }

  const distance = haversineKm(
    refPoint.lat,
    refPoint.lng,
    detail.lat,
    detail.lng
  );
  const occupiedSeats = detail.rooms.reduce(
    (acc, r) => acc + r.seats.filter((s) => s.status === "OCCUPIED").length,
    0
  );
  const photos = detail.photos.length > 0 ? detail.photos : [];

  // Find prev/next mess in the list for navigation
  const currentIdx = messes.findIndex((m) => m.id === selectedMessId);
  const prevMess = currentIdx > 0 ? messes[currentIdx - 1] : null;
  const nextMess =
    currentIdx >= 0 && currentIdx < messes.length - 1
      ? messes[currentIdx + 1]
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm sm:px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="gap-1.5 text-slate-600"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">ম্যাপে ফিরুন</span>
          <span className="sm:hidden">ফিরুন</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{detail.code}</span>
          <Badge className="bg-teal-500/15 text-teal-700 hover:bg-teal-500/15">
            {messTypeLabel(detail.type)}
          </Badge>
        </div>
        {user ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProfileOpen(true)}
            className="gap-1.5"
          >
            <UserCircle className="size-4 text-teal-600" />
            <span className="hidden max-w-20 truncate sm:inline">
              {user.name.split(" ")[0]}
            </span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setAuthOpen(true, "login")}
            className="bg-teal-600 hover:bg-teal-700"
          >
            লগইন
          </Button>
        )}
      </header>

      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
        {/* Title + address */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {detail.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-teal-600" />
              {detail.address}, {detail.area}, {detail.city}
            </span>
            <span className="flex items-center gap-1.5 text-teal-600">
              <Navigation className="size-4" />
              {refPoint.label} থেকে {formatDistance(distance)}
            </span>
          </div>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left: photos + info (2 cols) */}
          <div className="space-y-5 lg:col-span-2">
            {/* Photo gallery */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[16/10] w-full bg-slate-100">
                {photos.length > 0 ? (
                  <img
                    src={photos[photoIdx]}
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
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)
                      }
                      className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      onClick={() =>
                        setPhotoIdx((i) => (i + 1) % photos.length)
                      }
                      className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={cn(
                            "h-2 rounded-full transition",
                            i === photoIdx
                              ? "w-6 bg-white"
                              : "w-2 bg-white/50 hover:bg-white/80"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute right-3 top-3 flex gap-2">
                  <Badge className="bg-teal-600 text-white hover:bg-teal-600">
                    {messTypeLabel(detail.type)}
                  </Badge>
                  <Badge className="bg-white/90 text-slate-700 hover:bg-white/90">
                    {detail.code}
                  </Badge>
                </div>
              </div>
              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={cn(
                        "h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition",
                        i === photoIdx
                          ? "border-teal-500"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img
                        src={p}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = "0";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={<Wallet className="size-5" />}
                label="ভাড়া (প্রতি সিট/মাস)"
                value={formatBDT(detail.rentPerSeat)}
                color="teal"
              />
              <StatCard
                icon={<Navigation className="size-5" />}
                label="দূরত্ব"
                value={formatDistance(distance)}
                color="teal"
              />
              <StatCard
                icon={<BedDouble className="size-5" />}
                label="ফাঁকা সিট"
                value={`${detail.vacantSeats} / ${detail.totalSeats}`}
                color={detail.vacantSeats > 0 ? "teal" : "slate"}
              />
              <StatCard
                icon={<Building2 className="size-5" />}
                label="রুম সংখ্যা"
                value={`${detail.totalRooms}`}
                color="slate"
              />
            </div>

            {/* Description */}
            {detail.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-sm font-bold text-foreground">
                  মেস সম্পর্কে
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {detail.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {detail.amenities.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <CheckCircle2 className="size-4 text-teal-600" />
                  সুযোগ-সুবিধা ({detail.amenities.length})
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {detail.amenities.map((a) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <div
                        key={a}
                        className="flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-teal-500/10">
                          <Icon className="size-4 text-teal-600" />
                        </div>
                        <span className="text-xs font-medium text-teal-800">
                          {a}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Room & seat map */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <BedDouble className="size-4 text-teal-600" />
                  রুম ও সিট ম্যাপ
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-3 rounded bg-teal-500" />
                    বসবাসরত ({occupiedSeats})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-3 rounded border border-dashed border-teal-400 bg-teal-50" />
                    ফাঁকা ({detail.vacantSeats})
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {detail.rooms.map((room) => {
                  const roomVacant = room.seats.filter(
                    (s) => s.status === "VACANT"
                  ).length;
                  return (
                    <div
                      key={room.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700">
                          {room.roomNumber}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            roomVacant > 0
                              ? "border-teal-300 text-teal-600"
                              : "border-slate-300 text-slate-400"
                          )}
                        >
                          {roomVacant} ফাঁকা / {room.capacity}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {room.seats.map((seat) => (
                          <span
                            key={seat.id}
                            title={
                              seat.status === "OCCUPIED"
                                ? `${seat.seatNumber} · ${seat.memberName || "বসবাসরত"}`
                                : `${seat.seatNumber} · ফাঁকা`
                            }
                            className={cn(
                              "inline-flex min-w-[44px] items-center justify-center rounded px-2 py-1 text-[10px] font-semibold transition",
                              seat.status === "OCCUPIED"
                                ? "bg-teal-500 text-white"
                                : "border border-dashed border-teal-400 bg-white text-teal-600 hover:bg-teal-50"
                            )}
                          >
                            {seat.seatNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prev/Next mess navigation */}
            {(prevMess || nextMess) && (
              <div className="flex items-center justify-between gap-3">
                {prevMess ? (
                  <button
                    onClick={() => selectOtherMess(prevMess.id)}
                    className="group flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300 hover:shadow-sm"
                  >
                    <ChevronLeft className="size-5 shrink-0 text-slate-400 group-hover:text-teal-600" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400">পূর্ববর্তী</p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {prevMess.name}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
                {nextMess ? (
                  <button
                    onClick={() => selectOtherMess(nextMess.id)}
                    className="group flex flex-1 items-center justify-end gap-2 rounded-lg border border-slate-200 bg-white p-3 text-right transition hover:border-teal-300 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400">পরবর্তী</p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {nextMess.name}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-slate-400 group-hover:text-teal-600" />
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            )}
          </div>

          {/* Right: booking sidebar (sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              {/* Contact card */}
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-foreground">
                  যোগাযোগ
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-teal-500/10">
                    <Phone className="size-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500">ম্যানেজার</p>
                    <a
                      href={`tel:${detail.contactNumber}`}
                      className="text-sm font-bold text-teal-700 hover:underline"
                    >
                      {detail.contactNumber}
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      navigator.clipboard?.writeText(detail.contactNumber);
                      toast({ title: "নম্বর কপি হয়েছে" });
                    }}
                  >
                    কপি
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-bold text-foreground">{detail.totalRooms}</p>
                    <p className="text-[10px] text-slate-500">রুম</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-bold text-foreground">{detail.totalSeats}</p>
                    <p className="text-[10px] text-slate-500">মোট সিট</p>
                  </div>
                  <div className="rounded-lg bg-teal-50 p-2">
                    <p className="font-bold text-teal-700">{detail.vacantSeats}</p>
                    <p className="text-[10px] text-teal-600">ফাঁকা</p>
                  </div>
                </div>
              </div>

              {/* Booking card */}
              <div className="overflow-hidden rounded-xl border-2 border-teal-300 bg-white shadow-lg">
                <div className="bg-teal-600 px-4 py-3 text-white">
                  <h3 className="flex items-center gap-2 text-base font-bold">
                    <ArrowRight className="size-5" />
                    {bookingStep === "done" ? "বুকিং সম্পন্ন!" : "বুকিং রিকোয়েস্ট"}
                  </h3>
                  <p className="mt-0.5 text-xs text-teal-100">
                    {bookingStep === "done"
                      ? "আপনার রিকোয়েস্ট পাঠানো হয়েছে"
                      : `ভাড়া ${formatBDT(detail.rentPerSeat)}/সিট · ${formatDistance(distance)} দূরে`}
                  </p>
                </div>

                <div className="p-4">
                  {bookingStep === "form" && (
                    <>
                      {detail.vacantSeats <= 0 ? (
                        <div className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700">
                          <Clock className="mx-auto mb-1 size-5" />
                          এই মেসে বর্তমানে কোনো ফাঁকা সিট নেই।
                          <br />
                          তবুও আপনি অপেক্ষার তালিকায় যোগ হতে পারেন।
                        </div>
                      ) : null}

                      {!user ? (
                        /* Login required — show CTA instead of form */
                        <div className="space-y-3">
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                            <ShieldCheck className="mx-auto mb-2 size-8 text-amber-600" />
                            <p className="mb-1 text-sm font-bold text-amber-900">
                              বুকিং করতে লগইন আবশ্যক
                            </p>
                            <p className="mb-3 text-xs text-amber-700">
                              অর্ডার করতে অ্যাকাউন্ট থাকা দরকার। আপনার অ্যাকাউন্ট না থাকলে নতুন অ্যাকাউন্ট তৈরি করুন।
                            </p>
                            <Button
                              onClick={() => setAuthOpen(true, "login")}
                              className="w-full bg-teal-600 hover:bg-teal-700"
                              size="sm"
                            >
                              লগইন করুন
                            </Button>
                            <Button
                              onClick={() => setAuthOpen(true, "register")}
                              variant="outline"
                              className="mt-2 w-full border-teal-300 text-teal-700 hover:bg-teal-50"
                              size="sm"
                            >
                              নতুন অ্যাকাউন্ট তৈরি করুন
                            </Button>
                          </div>
                          <div className="text-center text-[10px] text-slate-400">
                            লগইন করলে আপনি বুকিং রিকোয়েস্ট পাঠাতে পারবেন এবং আপনার সব বুকিং ও বিল একসাথে দেখতে পারবেন।
                          </div>
                        </div>
                      ) : (
                        /* Logged in — show booking form */
                        <div className="space-y-3">
                          {/* Room & Seat Selection */}
                          <div>
                            <Label className="mb-1 text-xs font-medium text-slate-600">
                              রুম নির্বাচন করুন *
                            </Label>
                            <Select
                              value={selectedRoomId}
                              onValueChange={(v) => {
                                setSelectedRoomId(v);
                                setSelectedSeatId("");
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="রুম নির্বাচন করুন" />
                              </SelectTrigger>
                              <SelectContent>
                                {detail.rooms.map((room) => {
                                  const vacantCount = room.seats.filter(
                                    (s) => s.status === "VACANT"
                                  ).length;
                                  return (
                                    <SelectItem
                                      key={room.id}
                                      value={room.id}
                                      disabled={vacantCount === 0}
                                    >
                                      {room.roomNumber} ({vacantCount} ফাঁকা)
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedRoomId && (
                            <div>
                              <Label className="mb-1 text-xs font-medium text-slate-600">
                                সিট নির্বাচন করুন *
                              </Label>
                              <Select
                                value={selectedSeatId}
                                onValueChange={setSelectedSeatId}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="ফাঁকা সিট নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                  {detail.rooms
                                    .find((r) => r.id === selectedRoomId)
                                    ?.seats.filter((s) => s.status === "VACANT")
                                    .map((seat) => (
                                      <SelectItem key={seat.id} value={seat.id}>
                                        {seat.seatNumber}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div>
                            <Label className="mb-1 text-xs font-medium text-slate-600">
                              পুরো নাম *
                            </Label>
                            <Input
                              value={bookingName}
                              onChange={(e) => setBookingName(e.target.value)}
                              placeholder="আপনার নাম"
                              className="h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 text-xs font-medium text-slate-600">
                              ফোন নম্বর *
                            </Label>
                            <Input
                              value={bookingPhone}
                              onChange={(e) => setBookingPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="h-9 text-sm"
                            />
                          </div>
                        <div>
                          <Label className="mb-1 text-xs font-medium text-slate-600">
                            বার্তা (ঐচ্ছিক)
                          </Label>
                          <textarea
                            value={bookingMsg}
                            onChange={(e) => setBookingMsg(e.target.value)}
                            placeholder="কোন বিশেষ অনুরোধ? কখন সিট দরকার?"
                            rows={3}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (!bookingName.trim() || !bookingPhone.trim()) {
                              toast({
                                title: "তথ্য অসম্পূর্ণ",
                                description: "নাম ও ফোন নম্বর প্রয়োজন",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (!selectedSeatId) {
                              toast({
                                title: "সিট নির্বাচন করুন",
                                description: "অনুগ্রহ করে একটি ফাঁকা সিট নির্বাচন করুন",
                                variant: "destructive",
                              });
                              return;
                            }
                            setBookingStep("confirm");
                          }}
                          className="w-full bg-teal-600 hover:bg-teal-700"
                          disabled={detail.vacantSeats <= 0}
                        >
                          রিকোয়েস্ট প্রিভিউ দেখুন
                          <ArrowRight className="ml-1 size-4" />
                        </Button>
                        </div>
                      )}
                    </>
                  )}

                  {bookingStep === "confirm" && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold text-slate-500">
                          আপনার রিকোয়েস্ট নিশ্চিত করুন
                        </p>
                        <div className="space-y-1.5 text-sm">
                          <Row label="মেস" value={detail.name} />
                          <Row label="ভাড়া" value={`${formatBDT(detail.rentPerSeat)}/সিট`} />
                          <Row
                            label="দূরত্ব"
                            value={`${formatDistance(distance)} (${refPoint.label} থেকে)`}
                          />
                          <Row
                            label="ফাঁকা সিট"
                            value={`${detail.vacantSeats} টি`}
                          />
                          {selectedSeatId && (
                            <Row
                              label="নির্বাচিত সিট"
                              value={
                                detail.rooms
                                  .find((r) => r.id === selectedRoomId)
                                  ?.seats.find((s) => s.id === selectedSeatId)
                                  ?.seatNumber || ""
                              }
                            />
                          )}
                          <Separator className="my-1.5" />
                          <Row label="নাম" value={bookingName} />
                          <Row label="ফোন" value={bookingPhone} />
                          {bookingMsg && <Row label="বার্তা" value={bookingMsg} />}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBookingStep("form")}
                          className="flex-1"
                        >
                          ফিরে যান
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleBook}
                          disabled={submitting}
                          className="flex-[2] bg-teal-600 hover:bg-teal-700"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-1 size-3.5 animate-spin" />
                              পাঠানো হচ্ছে…
                            </>
                          ) : (
                            <>
                              রিকোয়েস্ট পাঠান
                              <ArrowRight className="ml-1 size-3.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {bookingStep === "done" && (
                    <div className="py-4 text-center">
                      <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-teal-100">
                        <CheckCircle2 className="size-8 text-teal-600" />
                      </div>
                      <p className="mb-1 font-bold text-foreground">
                        বুকিং রিকোয়েস্ট পাঠানো হয়েছে!
                      </p>
                      <p className="mb-4 text-xs text-muted-foreground">
                        মেস ম্যানেজার {detail.contactNumber} নম্বরে যোগাযোগ করবেন।
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goBack}
                          className="flex-1"
                        >
                          ম্যাপে ফিরুন
                        </Button>
                        {user && (
                          <Button
                            size="sm"
                            onClick={() => setView("tenant-dashboard")}
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                          >
                            আমার ড্যাশবোর্ড
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner info */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-xs font-bold text-slate-500">
                  মেস মালিক
                </h3>
                <div className="flex items-center gap-2">
                  <Avatar className="size-9 border border-teal-200">
                    <AvatarFallback className="bg-teal-500/10 text-xs font-bold text-teal-700">
                      {detail.ownerName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {detail.ownerName}
                    </p>
                    <p className="text-[10px] text-slate-500">মেস মালিক / ম্যানেজার</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
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
        "rounded-xl border p-4 shadow-sm",
        color === "teal"
          ? "border-teal-200 bg-teal-50"
          : "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "mb-1.5 flex items-center gap-1.5 text-xs",
          color === "teal" ? "text-teal-600" : "text-slate-500"
        )}
      >
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "text-lg font-bold sm:text-xl",
          color === "teal" ? "text-teal-800" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
