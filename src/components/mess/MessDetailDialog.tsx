"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Phone,
  Copy,
  MapPin,
  BedDouble,
  Tag,
  CheckCircle2,
  Send,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AMENITIES,
  formatBDT,
  messTypeLabel,
} from "@/lib/constants";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, type MessDetail } from "@/lib/api-client";

export default function MessDetailDialog() {
  const selectedMessId = useAppStore((s) => s.selectedMessId);
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);
  const user = useAppStore((s) => s.user);

  const open = selectedMessId !== null;
  const [mess, setMess] = useState<MessDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const { toast } = useToast();

  // Booking form state
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingMsg, setBookingMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMess = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setMess(null);
    setPhotoIdx(0);
    try {
      const data = await apiFetch<MessDetail>(`/api/mess/${id}`);
      setMess(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "মেসের তথ্য লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMessId) {
      void fetchMess(selectedMessId);
      // Prefill booking form from logged-in user
      if (user) {
        setBookingName(user.name || "");
        setBookingPhone(user.phone || "");
      }
    } else {
      // Reset on close
      setMess(null);
      setError(null);
      setBookingName("");
      setBookingPhone("");
      setBookingMsg("");
    }
  }, [selectedMessId, user, fetchMess]);

  const handleOpenChange = (o: boolean) => {
    if (!o) setSelectedMessId(null);
  };

  const copyContact = async () => {
    if (!mess) return;
    try {
      await navigator.clipboard.writeText(mess.contactNumber);
      toast({
        title: "কপি সম্পন্ন",
        description: `কন্টাক্ট নম্বর কপি হয়েছে: ${mess.contactNumber}`,
      });
    } catch {
      toast({
        title: "কপি ব্যর্থ",
        description: "কন্টাক্ট নম্বর কপি করা যায়নি",
        variant: "destructive",
      });
    }
  };

  const submitBooking = async () => {
    if (!mess) return;
    if (!bookingName.trim() || !bookingPhone.trim()) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "নাম ও ফোন নম্বর প্রয়োজন",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/booking", {
        method: "POST",
        body: JSON.stringify({
          messId: mess.id,
          name: bookingName.trim(),
          phone: bookingPhone.trim(),
          message: bookingMsg.trim() || null,
        }),
      });
      toast({
        title: "বুকিং রিকোয়েস্ট পাঠানো হয়েছে",
        description: "মেস ম্যানেজার শীঘ্রই আপনার সাথে যোগাযোগ করবেন।",
      });
      setBookingMsg("");
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

  const photos = mess?.photos?.length ? mess.photos : ["/placeholder-mess.svg"];
  const safePhotoIdx = Math.min(photoIdx, photos.length - 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{mess?.name ?? "মেসের বিস্তারিত"}</DialogTitle>
          <DialogDescription>
            মেসের সম্পূর্ণ তথ্য, সিট ম্যাপ ও বুকিং রিকোয়েস্ট।
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              onClick={() => selectedMessId && fetchMess(selectedMessId)}
            >
              আবার চেষ্টা করুন
            </Button>
          </div>
        ) : mess ? (
          <div className="max-h-[92vh] overflow-y-auto">
            {/* Photo carousel */}
            <div className="relative aspect-[16/9] w-full bg-muted">
              <img
                src={photos[safePhotoIdx]}
                alt={mess.name}
                className="size-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/placeholder-mess.svg";
                }}
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setPhotoIdx(
                        (safePhotoIdx - 1 + photos.length) % photos.length
                      )
                    }
                    className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
                    aria-label="পূর্ববর্তী ছবি"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={() =>
                      setPhotoIdx((safePhotoIdx + 1) % photos.length)
                    }
                    className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
                    aria-label="পরবর্তী ছবি"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        className={cn(
                          "size-2 rounded-full transition",
                          i === safePhotoIdx
                            ? "bg-teal-400 w-5"
                            : "bg-white/60 hover:bg-white"
                        )}
                        aria-label={`ছবি ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-teal-500/90 text-white hover:bg-teal-500">
                  {messTypeLabel(mess.type)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/20 bg-black/40 text-white"
                >
                  <Tag className="size-3" />
                  {mess.code}
                </Badge>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-5 p-5 sm:p-6">
              {/* Title + rent */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    {mess.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-teal-500" />
                    {mess.address || `${mess.area}, ${mess.city}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-300">
                    {formatBDT(mess.rentPerSeat)}
                  </div>
                  <div className="text-xs text-muted-foreground">/সিট · মাসিক</div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatBox
                  icon={<BedDouble className="size-4" />}
                  label="ফাঁকা সিট"
                  value={mess.vacantSeats}
                  highlight={mess.vacantSeats > 0}
                />
                <StatBox
                  icon={<Users className="size-4" />}
                  label="মোট সিট"
                  value={mess.totalSeats}
                />
                <StatBox
                  icon={<Building2 className="size-4" />}
                  label="রুম"
                  value={mess.totalRooms}
                />
              </div>

              {/* Description */}
              {mess.description && (
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                    বিস্তারিত
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {mess.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  সুবিধাসমূহ
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.filter((a) => mess.amenities.includes(a.key)).map(
                    (a) => {
                      const Icon = getAmenityIcon(a.key);
                      return (
                        <Badge
                          key={a.key}
                          variant="outline"
                          className="gap-1.5 border-teal-500/30 bg-teal-500/5 py-1 pl-2 pr-2.5 text-teal-700 dark:text-teal-200"
                        >
                          <Icon className="size-3.5" />
                          {a.label}
                        </Badge>
                      );
                    }
                  )}
                  {mess.amenities.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      কোনো সুবিধা তালিকাভুক্ত নেই
                    </span>
                  )}
                </div>
              </div>

              {/* Room / seat map */}
              {mess.rooms && mess.rooms.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    রুম ও সিট ম্যাপ
                  </h3>
                  <div className="flex flex-col gap-3">
                    {mess.rooms.map((room) => {
                      const occupied = room.seats.filter(
                        (s) => s.status === "OCCUPIED"
                      ).length;
                      return (
                        <div
                          key={room.id}
                          className="rounded-xl border bg-muted/30 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                রুম {room.roomNumber}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-normal"
                              >
                                ধারণক্ষমতা {room.capacity}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {occupied}/{room.seats.length} বসানো
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {room.seats.map((seat) => {
                              const isOccupied = seat.status === "OCCUPIED";
                              return (
                                <span
                                  key={seat.id}
                                  title={
                                    isOccupied
                                      ? `${seat.seatNumber} — ${seat.memberName ?? "বসানো"}`
                                      : `${seat.seatNumber} — ফাঁকা`
                                  }
                                  className={cn(
                                    "inline-flex min-w-9 items-center justify-center rounded-md border px-2 py-1 text-[11px] font-medium",
                                    isOccupied
                                      ? "border-teal-500/40 bg-teal-500/15 text-teal-700 dark:text-teal-200"
                                      : "border-dashed border-teal-500/50 bg-teal-500/5 text-teal-600 dark:text-teal-300"
                                  )}
                                >
                                  {seat.seatNumber}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="rounded-xl border bg-muted/30 p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  যোগাযোগ
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                    <Phone className="size-4 text-teal-500" />
                    <span className="text-sm font-medium">
                      {mess.contactNumber}
                    </span>
                  </div>
                  <Button asChild className="bg-teal-600 text-white hover:bg-teal-700">
                    <a href={`tel:${mess.contactNumber}`}>
                      <Phone className="size-4" />
                      কল করুন
                    </a>
                  </Button>
                  <Button variant="outline" onClick={copyContact}>
                    <Copy className="size-4" />
                    কন্টাক্ট কপি
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  মালিক: {mess.ownerName}
                </p>
              </div>

              {/* Booking request form */}
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Send className="size-4 text-teal-500" />
                  বুকিং রিকোয়েস্ট পাঠান
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  মেস ম্যানেজারকে সরাসরি রিকোয়েস্ট পাঠান।
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bk-name" className="text-xs">
                      আপনার নাম
                    </Label>
                    <Input
                      id="bk-name"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      placeholder="পুরো নাম"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bk-phone" className="text-xs">
                      ফোন নম্বর
                    </Label>
                    <Input
                      id="bk-phone"
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  <Label htmlFor="bk-msg" className="text-xs">
                    বার্তা (ঐচ্ছিক)
                  </Label>
                  <Textarea
                    id="bk-msg"
                    value={bookingMsg}
                    onChange={(e) => setBookingMsg(e.target.value)}
                    placeholder="কোন বিশেষ অনুরোধ থাকলে লিখুন..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={submitBooking}
                  disabled={submitting}
                  className="mt-3 w-full bg-teal-600 text-white hover:bg-teal-700"
                >
                  {submitting ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      পাঠানো হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      রিকোয়েস্ট পাঠান
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StatBox({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border p-3 text-center",
        highlight
          ? "border-teal-500/40 bg-teal-500/10"
          : "bg-muted/30"
      )}
    >
      <div
        className={cn(
          "mb-1",
          highlight ? "text-teal-600 dark:text-teal-300" : "text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          "text-xl font-bold",
          highlight ? "text-teal-700 dark:text-teal-200" : "text-foreground"
        )}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
