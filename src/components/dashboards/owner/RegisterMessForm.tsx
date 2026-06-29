"use client";

import { useState } from "react";
import { Building2, Sparkles, ImagePlus, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LocationPicker from "@/components/mess/LocationPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AMENITIES,
  BANGLADESH_AREAS,
  MESS_TYPES,
} from "@/lib/constants";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, type MessDetail } from "@/lib/api-client";

interface RegisterMessFormProps {
  /** Called with the created mess detail when the POST succeeds. */
  onCreated: (mess: MessDetail) => void;
  /** Called when the user cancels (only meaningful inside a dialog). */
  onCancel?: () => void;
  /** Compact mode renders within a dialog (no outer card chrome). */
  compact?: boolean;
}

interface FormState {
  name: string;
  description: string;
  type: string;
  address: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  rentPerSeat: string;
  contactNumber: string;
  photo1: string;
  photo2: string;
  photo3: string;
  amenities: string[];
  totalRooms: string;
  perRoomSeats: string;
}

const EMPTY: FormState = {
  name: "",
  description: "",
  type: "STUDENT_MALE",
  address: "",
  area: "",
  city: "",
  lat: 0,
  lng: 0,
  rentPerSeat: "",
  contactNumber: "",
  photo1: "",
  photo2: "",
  photo3: "",
  amenities: [],
  totalRooms: "",
  perRoomSeats: "",
};

const DEMO: FormState = {
  name: "ধানমন্ডি পিস মেস",
  description:
    "ধানমন্ডি লেকের পাশে শান্ত পরিবেশে অবস্থিত ছাত্রদের জন্য আদর্শ মেস। ২৪/৭ ওয়াইফাই, নিরাপত্তা ও পরিষ্কার পরিবেশ নিশ্চিত।",
  type: "STUDENT_MALE",
  address: "হাউজ ১২, রোড ৭, ধানমন্ডি",
  area: "Dhanmondi",
  city: "Dhaka",
  lat: 23.7461,
  lng: 90.3742,
  rentPerSeat: "4500",
  contactNumber: "01712345678",
  photo1: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
  photo2: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
  photo3: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
  amenities: ["wifi", "filteredWater", "generator", "security", "kitchen"],
  totalRooms: "4",
  perRoomSeats: "4",
};

export default function RegisterMessForm({
  onCreated,
  onCancel,
  compact = false,
}: RegisterMessFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAmenity = (key: string) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }));

  const onAreaChange = (area: string) => {
    const found = BANGLADESH_AREAS.find((a) => a.area === area);
    if (found) {
      setForm((f) => ({
        ...f,
        area: found.area,
        city: found.city,
        lat: found.lat,
        lng: found.lng,
      }));
    } else {
      update("area", area);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validation
    if (
      !form.name.trim() ||
      !form.area ||
      !form.address.trim() ||
      !form.rentPerSeat ||
      !form.contactNumber.trim() ||
      !form.totalRooms ||
      !form.perRoomSeats
    ) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "নাম, ঠিকানা, এলাকা, ভাড়া, ফোন, রুম ও সিট সংখ্যা আবশ্যক",
        variant: "destructive",
      });
      return;
    }

    const totalRooms = parseInt(form.totalRooms, 10);
    const perRoomSeats = parseInt(form.perRoomSeats, 10);
    const rentPerSeat = parseInt(form.rentPerSeat, 10);

    if (
      Number.isNaN(totalRooms) ||
      Number.isNaN(perRoomSeats) ||
      Number.isNaN(rentPerSeat) ||
      totalRooms < 1 ||
      perRoomSeats < 1 ||
      rentPerSeat < 0
    ) {
      toast({
        title: "সংখ্যা সঠিক নয়",
        description: "রুম, সিট ও ভাড়া সঠিক সংখ্যা দিন",
        variant: "destructive",
      });
      return;
    }

    const photos = [form.photo1, form.photo2, form.photo3].filter(Boolean);

    setSubmitting(true);
    try {
      const created = await apiFetch<MessDetail>("/api/mess", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          type: form.type,
          address: form.address.trim(),
          area: form.area,
          city: form.city,
          lat: form.lat,
          lng: form.lng,
          rentPerSeat,
          contactNumber: form.contactNumber.trim(),
          photos,
          amenities: form.amenities,
          totalRooms,
          perRoomSeats,
        }),
      });
      toast({
        title: "মেস নিবন্ধিত হয়েছে",
        description: `${created.name} (${created.code}) সফলভাবে তৈরি হয়েছে।`,
      });
      setForm(EMPTY);
      onCreated(created);
    } catch (err) {
      toast({
        title: "নিবন্ধন ব্যর্থ",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const body = (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="m-name" className="text-xs">
            মেসের নাম <span className="text-destructive">*</span>
          </Label>
          <Input
            id="m-name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="যেমন: ধানমন্ডি পিস মেস"
          />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-type" className="text-xs">
            মেসের ধরন <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.type}
            onValueChange={(v) => update("type", v)}
          >
            <SelectTrigger id="m-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESS_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rent */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-rent" className="text-xs">
            প্রতি সিট মাসিক ভাড়া (৳) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="m-rent"
            type="number"
            min={0}
            value={form.rentPerSeat}
            onChange={(e) => update("rentPerSeat", e.target.value)}
            placeholder="4500"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="m-desc" className="text-xs">
            বিবরণ
          </Label>
          <Textarea
            id="m-desc"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="মেসের পরিবেশ, নিয়ম, আশেপাশের সুবিধা ইত্যাদি..."
            rows={3}
          />
        </div>

        {/* Area */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-area" className="text-xs">
            এলাকা <span className="text-destructive">*</span>
          </Label>
          <Select value={form.area} onValueChange={onAreaChange}>
            <SelectTrigger id="m-area" className="w-full">
              <SelectValue placeholder="এলাকা নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {BANGLADESH_AREAS.map((a) => (
                <SelectItem key={a.area} value={a.area}>
                  {a.area} — {a.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-city" className="text-xs">
            শহর
          </Label>
          <Input
            id="m-city"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Dhaka"
            readOnly={!!form.area}
            className={form.area ? "bg-muted/50 text-muted-foreground" : ""}
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="m-addr" className="text-xs">
            বিস্তারিত ঠিকানা <span className="text-destructive">*</span>
          </Label>
          <Input
            id="m-addr"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="হাউজ নং, রোড নং, এলাকা"
          />
        </div>

        {/* Location picker — exact pin on map */}
        <div className="sm:col-span-2">
          <LocationPicker
            value={{ lat: form.lat, lng: form.lng }}
            onChange={(v) => {
              setForm((f) => ({ ...f, lat: v.lat, lng: v.lng }));
            }}
            label="মেসের সঠিক অবস্থান (ম্যাপে চিহ্নিত করুন) *"
            height={280}
          />
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-contact" className="text-xs">
            যোগাযোগ নম্বর <span className="text-destructive">*</span>
          </Label>
          <Input
            id="m-contact"
            value={form.contactNumber}
            onChange={(e) => update("contactNumber", e.target.value)}
            placeholder="01XXXXXXXXX"
          />
        </div>

        {/* Rooms & seats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-rooms" className="text-xs">
              মোট রুম <span className="text-destructive">*</span>
            </Label>
            <Input
              id="m-rooms"
              type="number"
              min={1}
              value={form.totalRooms}
              onChange={(e) => update("totalRooms", e.target.value)}
              placeholder="4"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-seats" className="text-xs">
              প্রতি রুমে সিট <span className="text-destructive">*</span>
            </Label>
            <Input
              id="m-seats"
              type="number"
              min={1}
              value={form.perRoomSeats}
              onChange={(e) => update("perRoomSeats", e.target.value)}
              placeholder="4"
            />
          </div>
        </div>

        {/* Photos (3 URL inputs) */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label className="text-xs">
            <span className="inline-flex items-center gap-1.5">
              <ImagePlus className="size-3.5 text-teal-500" />
              ছবির URL (ঐচ্ছিক, সর্বোচ্চ ৩টি)
            </span>
          </Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input
              value={form.photo1}
              onChange={(e) => update("photo1", e.target.value)}
              placeholder="https://..."
            />
            <Input
              value={form.photo2}
              onChange={(e) => update("photo2", e.target.value)}
              placeholder="https://..."
            />
            <Input
              value={form.photo3}
              onChange={(e) => update("photo3", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label className="text-xs">সুবিধাসমূহ</Label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const Icon = getAmenityIcon(a.key);
              const active = form.amenities.includes(a.key);
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggleAmenity(a.key)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-200"
                      : "border-border bg-background text-muted-foreground hover:border-teal-500/40 hover:bg-teal-500/5"
                  )}
                >
                  <Icon className="size-3.5" />
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setForm(DEMO)}
            className="text-teal-700 hover:bg-teal-500/10 hover:text-teal-700"
          >
            <Wand2 className="size-4" />
            ডেমো তথ্য ভরুন
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              বাতিল
            </Button>
          )}
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 bg-teal-600 text-white hover:bg-teal-700 sm:min-w-44"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              নিবন্ধন করা হচ্ছে...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              মেস নিবন্ধন করুন
            </>
          )}
        </Button>
      </div>
    </form>
  );

  if (compact) {
    return body;
  }

  return (
    <Card className="border-teal-500/20 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-9 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-300">
            <Building2 className="size-5" />
          </span>
          নতুন মেস নিবন্ধন
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
