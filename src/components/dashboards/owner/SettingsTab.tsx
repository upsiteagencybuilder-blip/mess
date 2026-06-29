"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings2,
  Save,
  Copy,
  Tag,
  User as UserIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  ImagePlus,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/components/mess/LocationPicker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AMENITIES,
  BANGLADESH_AREAS,
  MESS_TYPES,
} from "@/lib/constants";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, type MessDetail } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";

interface SettingsTabProps {
  activeMess: MessDetail | null;
  onDeleted: () => void;
  onUpdated: () => void;
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
}

export default function SettingsTab({
  activeMess,
  onDeleted,
  onUpdated,
}: SettingsTabProps) {
  const user = useAppStore((s) => s.user);
  const { toast } = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Sync form from activeMess whenever it changes (e.g. parent refetch)
  useEffect(() => {
    if (!activeMess) {
      setForm(null);
      return;
    }
    const photos = activeMess.photos || [];
    setForm({
      name: activeMess.name,
      description: activeMess.description || "",
      type: activeMess.type,
      address: activeMess.address,
      area: activeMess.area,
      city: activeMess.city,
      lat: activeMess.lat,
      lng: activeMess.lng,
      rentPerSeat: String(activeMess.rentPerSeat),
      contactNumber: activeMess.contactNumber,
      photo1: photos[0] || "",
      photo2: photos[1] || "",
      photo3: photos[2] || "",
      amenities: activeMess.amenities || [],
    });
  }, [activeMess]);

  if (!activeMess || !form) {
    return <Skeleton className="h-96 w-full" />;
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const toggleAmenity = (key: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            amenities: f.amenities.includes(key)
              ? f.amenities.filter((a) => a !== key)
              : [...f.amenities, key],
          }
        : f
    );

  const onAreaChange = (area: string) => {
    const found = BANGLADESH_AREAS.find((a) => a.area === area);
    if (found) {
      setForm((f) =>
        f ? { ...f, area: found.area, city: found.city } : f
      );
    } else {
      update("area", area);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeMess.code);
      toast({
        title: "কপি সম্পন্ন",
        description: `মেস কোড ${activeMess.code} কপি হয়েছে।`,
      });
    } catch {
      toast({
        title: "কপি ব্যর্থ",
        variant: "destructive",
      });
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !form) return;
    if (
      !form.name.trim() ||
      !form.area ||
      !form.address.trim() ||
      !form.rentPerSeat ||
      !form.contactNumber.trim()
    ) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "নাম, এলাকা, ঠিকানা, ভাড়া ও ফোন আবশ্যক",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const photos = [form.photo1, form.photo2, form.photo3].filter(Boolean);
      await apiFetch(`/api/mess/${activeMess.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          type: form.type,
          address: form.address.trim(),
          area: form.area,
          city: form.city,
          lat: form.lat,
          lng: form.lng,
          rentPerSeat: parseInt(form.rentPerSeat, 10),
          contactNumber: form.contactNumber.trim(),
          photos,
          amenities: form.amenities,
        }),
      });
      toast({
        title: "সেটিংস সংরক্ষিত",
        description: "মেসের তথ্য আপডেট হয়েছে।",
      });
      onUpdated();
    } catch (err) {
      toast({
        title: "সংরক্ষণ ব্যর্থ",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (confirmText.trim() !== activeMess.name) {
      toast({
        title: "নাম মেলেনি",
        description: "নিশ্চিত করতে মেসের নাম হুবহু লিখুন।",
        variant: "destructive",
      });
      return;
    }
    setDeleting(true);
    try {
      await apiFetch(`/api/mess/${activeMess.id}`, { method: "DELETE" });
      toast({
        title: "মেস মুছে ফেলা হয়েছে",
        description: `${activeMess.name} সফলভাবে মুছে যাওয়া হয়েছে।`,
      });
      onDeleted();
    } catch (err) {
      toast({
        title: "মুছতে ব্যর্থ",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setConfirmText("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      {/* Identity card */}
      <Card className="border-teal-500/20 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <Tag className="size-4" />
            </span>
            মেস পরিচয়
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-[10px] uppercase text-muted-foreground">
              কোড
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {activeMess.code}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyCode}
              className="size-7 p-0 text-muted-foreground hover:text-teal-700"
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <UserIcon className="size-3.5 text-muted-foreground" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase text-muted-foreground">
                মালিক
              </span>
              <span className="text-xs font-medium text-foreground">
                {user?.name ?? activeMess.ownerName}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300"
          >
            {MESS_TYPES.find((t) => t.value === activeMess.type)?.label ??
              activeMess.type}
          </Badge>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-7 items-center justify-center rounded-lg bg-slate-500/15 text-slate-600 dark:text-slate-300">
              <Settings2 className="size-4" />
            </span>
            মেসের তথ্য সম্পাদনা
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="s-name" className="text-xs">
                মেসের নাম <span className="text-destructive">*</span>
              </Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-type" className="text-xs">
                ধরন <span className="text-destructive">*</span>
              </Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger id="s-type" className="w-full">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-rent" className="text-xs">
                প্রতি সিট ভাড়া (৳) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="s-rent"
                type="number"
                min={0}
                value={form.rentPerSeat}
                onChange={(e) => update("rentPerSeat", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="s-desc" className="text-xs">
                বিবরণ
              </Label>
              <Textarea
                id="s-desc"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-area" className="text-xs">
                এলাকা <span className="text-destructive">*</span>
              </Label>
              <Select value={form.area} onValueChange={onAreaChange}>
                <SelectTrigger id="s-area" className="w-full">
                  <SelectValue />
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-city" className="text-xs">
                শহর
              </Label>
              <Input
                id="s-city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="s-addr" className="text-xs">
                বিস্তারিত ঠিকানা <span className="text-destructive">*</span>
              </Label>
              <Input
                id="s-addr"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <LocationPicker
                value={{ lat: form.lat, lng: form.lng }}
                onChange={(v) => {
                  setForm((f) => (f ? { ...f, lat: v.lat, lng: v.lng } : f));
                }}
                label="মেসের সঠিক অবস্থান (ভুল থাকলে ম্যাপে ক্লিক করে ঠিক করুন)"
                height={280}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-contact" className="text-xs">
                যোগাযোগ নম্বর <span className="text-destructive">*</span>
              </Label>
              <Input
                id="s-contact"
                value={form.contactNumber}
                onChange={(e) => update("contactNumber", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <ImagePlus className="size-3.5 text-teal-500" />
                  ছবির URL (সর্বোচ্চ ৩টি)
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

            <div className="flex justify-end sm:col-span-2">
              <Button
                type="submit"
                disabled={saving}
                className="h-11 bg-teal-600 text-white hover:bg-teal-700 sm:min-w-44"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    পরিবর্তন সংরক্ষণ
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-rose-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="size-4" />
            ডেঞ্জার জোন
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                মেস ডিলিট করুন
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                এটি মেসের সকল রুম, সিট, মেম্বার, ইনভয়েস ও বুকিং স্থায়ীভাবে মুছে ফেলবে। এই কাজটি ফিরিয়ে আনা যাবে না।
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                >
                  <Trash2 className="size-4" />
                  মেস ডিলিট করুন
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-rose-600" />
                    মেস ডিলিট করার নিশ্চিত করুন
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    আপনি <strong className="text-foreground">{activeMess.name}</strong> মুছতে যাচ্ছেন। নিশ্চিত করতে মেসের নাম হুবহু নিচে লিখুন:
                    <span className="mt-2 block font-mono text-xs text-foreground">
                      {activeMess.name}
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={activeMess.name}
                  className="mt-2"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setConfirmText("")}
                  >
                    বাতিল
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleDelete()}
                    disabled={deleting || confirmText.trim() !== activeMess.name}
                    className="border-0 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    স্থায়ীভাবে মুছুন
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
