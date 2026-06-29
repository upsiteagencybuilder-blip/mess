"use client";

import { useEffect, useState, useCallback } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  BedDouble,
  Calendar,
  Wallet,
  LogOut,
  Search,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Edit3,
  Save,
  X,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore, type SessionUser } from "@/store/app-store";
import { apiFetch } from "@/lib/api-client";
import { roleLabel, formatBDT, messTypeLabel } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TenantMembership {
  id: string;
  messId: string;
  seatNumber: string;
  roomNumber: string;
  joinDate: string;
  status: string;
  name: string;
  phone: string;
  email: string;
}

interface MessInfo {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  area: string;
  city: string;
  rentPerSeat: number;
  contactNumber: string;
  photos: string[];
  amenities: string[];
}

interface BookingItem {
  id: string;
  messId: string;
  messName: string;
  messCode: string;
  messArea: string;
  messCity: string;
  rentPerSeat: number;
  name: string;
  phone: string;
  message: string | null;
  status: string;
  createdAt: string;
}

interface InvoiceSummary {
  totalPaid: number;
  totalOutstanding: number;
  count: number;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function statusBadge(status: string) {
  switch (status) {
    case "PAID":
    case "APPROVED":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
          <CheckCircle2 className="mr-1 size-3" />
          নিশ্চিত
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">
          <Clock className="mr-1 size-3" />
          অপেক্ষমাণ
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/15">
          <XCircle className="mr-1 size-3" />
          বাতিল
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function ProfileDialog() {
  const profileOpen = useAppStore((s) => s.profileOpen);
  const setProfileOpen = useAppStore((s) => s.setProfileOpen);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setView = useAppStore((s) => s.setView);
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Role-specific data
  const [membership, setMembership] = useState<TenantMembership | null>(null);
  const [messInfo, setMessInfo] = useState<MessInfo | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [ownerMesses, setOwnerMesses] = useState<{ id: string; name: string; code: string; vacantSeats: number; totalSeats: number }[]>([]);
  const [ownerStats, setOwnerStats] = useState<{ totalCollected: number; outstanding: number; vacantSeats: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === "TENANT") {
        // Fetch membership, bookings, invoice summary in parallel
        const [memRes, bookRes, invRes] = await Promise.all([
          apiFetch<{ member: TenantMembership | null } | TenantMembership | null>("/api/member/mine").catch(() => null),
          apiFetch<BookingItem[]>("/api/booking").catch(() => []),
          apiFetch<Array<{ total: number; status: string }>>("/api/invoice").catch(() => []),
        ]);

        // Handle possible shapes from /api/member/mine
        const mem =
          memRes && "member" in memRes
            ? (memRes as { member: TenantMembership | null }).member
            : (memRes as TenantMembership | null);
        setMembership(mem);
        setBookings(bookRes || []);

        const invs = invRes || [];
        setInvoiceSummary({
          totalPaid: invs.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0),
          totalOutstanding: invs.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0),
          count: invs.length,
        });

        // If has membership, fetch mess info
        if (mem?.messId) {
          try {
            const mess = await apiFetch<MessInfo>(`/api/mess/${mem.messId}`);
            setMessInfo(mess);
          } catch {
            setMessInfo(null);
          }
        } else {
          setMessInfo(null);
        }
      } else if (user.role === "OWNER") {
        const messes = await apiFetch<Array<{ id: string; name: string; code: string; vacantSeats: number; totalSeats: number }>>(
          "/api/mess/0/mine"
        ).catch(() => []);
        setOwnerMesses(messes || []);

        // Aggregate owner stats
        try {
          const stats = await apiFetch<{
            totalCollected: number;
            outstanding: number;
            vacantSeats: number;
          }>("/api/mess/all/owner-stats");
          setOwnerStats(stats);
        } catch {
          setOwnerStats(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (profileOpen && user) {
      setEditing(false);
      setEditName(user.name);
      setEditPhone(user.phone || "");
      loadProfileData();
    }
  }, [profileOpen, user, loadProfileData]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await apiFetch<{ user: SessionUser }>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      setUser(res.user);
      setEditing(false);
      triggerRefresh();
      toast({ title: "প্রোফাইল আপডেট হয়েছে", description: "আপনার তথ্য সফলভাবে সংরক্ষিত হয়েছে।" });
    } catch (e) {
      toast({
        title: "আপডেট ব্যর্থ",
        description: e instanceof Error ? e.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setView("landing");
    setProfileOpen(false);
    toast({ title: "লগআউট সম্পন্ন", description: "আবার দেখা হবে।" });
  };

  if (!user) return null;

  return (
    <Dialog open={profileOpen} onOpenChange={(o) => setProfileOpen(o)}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-2xl">
        {/* Header banner */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-6 pb-6 pt-6">
          <button
            onClick={() => setProfileOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2 border-teal-400/40 ring-2 ring-teal-500/20">
              <AvatarFallback className="bg-teal-500/20 text-xl font-bold text-teal-200">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-sm text-slate-300">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge className="bg-teal-500/20 text-teal-200 hover:bg-teal-500/20">
                  <ShieldCheck className="mr-1 size-3" />
                  {roleLabel(user.role)}
                </Badge>
                {user.phone && (
                  <span className="flex items-center gap-1 text-xs text-slate-300">
                    <Phone className="size-3" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh] px-6 pb-6">
          {/* Edit profile section */}
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="size-4 text-teal-600" />
                ব্যক্তিগত তথ্য
              </h3>
              {!editing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(true);
                    setEditName(user.name);
                    setEditPhone(user.phone || "");
                  }}
                  className="h-8 text-teal-600 hover:text-teal-700"
                >
                  <Edit3 className="mr-1 size-3.5" />
                  সম্পাদনা
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(false)}
                    className="h-8"
                  >
                    বাতিল
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-8 bg-teal-600 hover:bg-teal-700"
                  >
                    <Save className="mr-1 size-3.5" />
                    {saving ? "সংরক্ষণ..." : "সংরক্ষণ"}
                  </Button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 text-xs">নাম</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 text-xs">ফোন নম্বর</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="h-9"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <Mail className="size-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">ইমেইল</p>
                    <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <Phone className="size-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">ফোন</p>
                    <p className="truncate text-sm font-medium text-foreground">{user.phone || "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <Separator className="mb-6" />

          {/* Role-specific content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500" />
            </div>
          ) : user.role === "TENANT" ? (
            <TenantProfileSection
              membership={membership}
              messInfo={messInfo}
              bookings={bookings}
              invoiceSummary={invoiceSummary}
              onFindMess={() => {
                setProfileOpen(false);
                setView("landing");
              }}
              onViewMess={(id) => {
                setProfileOpen(false);
                setSelectedMessId(id);
              }}
            />
          ) : user.role === "OWNER" ? (
            <OwnerProfileSection
              messes={ownerMesses}
              stats={ownerStats}
              onGoDashboard={() => {
                setProfileOpen(false);
                setView("owner-dashboard");
              }}
            />
          ) : (
            <StaffProfileSection
              onGoDashboard={() => {
                setProfileOpen(false);
                setView("staff-dashboard");
              }}
            />
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="mr-2 size-4" />
            লগআউট
          </Button>
          <Button
            onClick={() => setProfileOpen(false)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            বন্ধ করুন
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Tenant profile section ---------- */
function TenantProfileSection({
  membership,
  messInfo,
  bookings,
  invoiceSummary,
  onFindMess,
  onViewMess,
}: {
  membership: TenantMembership | null;
  messInfo: MessInfo | null;
  bookings: BookingItem[];
  invoiceSummary: InvoiceSummary | null;
  onFindMess: () => void;
  onViewMess: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Current mess / destination */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Home className="size-4 text-teal-600" />
          আপনার মেস
        </h3>
        {membership && messInfo ? (
          <div className="overflow-hidden rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
            <div className="flex items-start gap-3 p-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-white">
                <Building2 className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate font-bold text-foreground">{messInfo.name}</h4>
                    <p className="text-xs text-slate-500">{messInfo.code}</p>
                  </div>
                  <Badge className="bg-teal-500/15 text-teal-700 hover:bg-teal-500/15">
                    {messTypeLabel(messInfo.type)}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <BedDouble className="size-3.5 text-teal-600" />
                    <span className="text-slate-600">সিট:</span>
                    <span className="font-semibold text-foreground">{membership.seatNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-teal-600" />
                    <span className="text-slate-600">রুম:</span>
                    <span className="font-semibold text-foreground">{membership.roomNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet className="size-3.5 text-teal-600" />
                    <span className="text-slate-600">ভাড়া:</span>
                    <span className="font-semibold text-foreground">{formatBDT(messInfo.rentPerSeat)}/মাস</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-teal-600" />
                    <span className="text-slate-600">যোগদান:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(membership.joinDate).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">
                  <MapPin className="size-3.5 shrink-0 text-teal-600" />
                  <span className="truncate">{messInfo.address}, {messInfo.area}, {messInfo.city}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewMess(messInfo.id)}
                  className="mt-3 h-8 border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  বিস্তারিত দেখুন
                  <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100">
              <Search className="size-6 text-slate-400" />
            </div>
            <p className="mb-1 font-medium text-foreground">আপনি এখনও কোনো মেসে যুক্ত নন</p>
            <p className="mb-4 text-sm text-slate-500">
              মেস খুঁজে বুকিং রিকোয়েস্ট পাঠান। মেস মালিক নিশ্চিত করলে আপনার সিট বরাদ্দ হবে।
            </p>
            <Button onClick={onFindMess} className="bg-teal-600 hover:bg-teal-700">
              <Search className="mr-2 size-4" />
              মেস খুঁজুন
            </Button>
          </div>
        )}
      </section>

      {/* Payment summary (only if has membership) */}
      {membership && invoiceSummary && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wallet className="size-4 text-teal-600" />
            পেমেন্ট সারাংশ
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-xs text-emerald-700">পরিশোধিত</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{formatBDT(invoiceSummary.totalPaid)}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="text-xs text-amber-700">বাকি</p>
              <p className="mt-1 text-lg font-bold text-amber-700">{formatBDT(invoiceSummary.totalOutstanding)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-600">মোট বিল</p>
              <p className="mt-1 text-lg font-bold text-foreground">{invoiceSummary.count}</p>
            </div>
          </div>
        </section>
      )}

      {/* My booking requests */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardList className="size-4 text-teal-600" />
          আমার বুকিং রিকোয়েস্ট ({bookings.length})
        </h3>
        {bookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            কোনো বুকিং রিকোয়েস্ট নেই।
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{b.messName}</p>
                  <p className="text-xs text-slate-500">
                    {b.messCode} · {b.messArea}, {b.messCity} · {formatBDT(b.rentPerSeat)}/সিট
                  </p>
                  {b.message && (
                    <p className="mt-0.5 truncate text-xs italic text-slate-400">"{b.message}"</p>
                  )}
                </div>
                {statusBadge(b.status)}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- Owner profile section ---------- */
function OwnerProfileSection({
  messes,
  stats,
  onGoDashboard,
}: {
  messes: Array<{ id: string; name: string; code: string; vacantSeats: number; totalSeats: number }>;
  stats: { totalCollected: number; outstanding: number; vacantSeats: number } | null;
  onGoDashboard: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Quick stats */}
      {stats && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="size-4 text-teal-600" />
            সারাংশ
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-xs text-emerald-700">এই মাসের আয়</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{formatBDT(stats.totalCollected)}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="text-xs text-amber-700">বকেয়া</p>
              <p className="mt-1 text-lg font-bold text-amber-700">{formatBDT(stats.outstanding)}</p>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-center">
              <p className="text-xs text-teal-700">ফাঁকা সিট</p>
              <p className="mt-1 text-lg font-bold text-teal-700">{stats.vacantSeats}</p>
            </div>
          </div>
        </section>
      )}

      {/* My messes */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Building2 className="size-4 text-teal-600" />
          আমার মেস ({messes.length})
        </h3>
        {messes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            কোনো মেস নিবন্ধিত নেই। ড্যাশবোর্ড থেকে নতুন মেস যোগ করুন।
          </div>
        ) : (
          <div className="space-y-2">
            {messes.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.code}</p>
                </div>
                <Badge
                  className={cn(
                    m.vacantSeats > 0
                      ? "bg-teal-500/15 text-teal-700 hover:bg-teal-500/15"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {m.vacantSeats}/{m.totalSeats} ফাঁকা
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <Button onClick={onGoDashboard} className="w-full bg-teal-600 hover:bg-teal-700">
        ড্যাশবোর্ডে যান
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}

/* ---------- Staff profile section ---------- */
function StaffProfileSection({ onGoDashboard }: { onGoDashboard: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="size-5 text-teal-600" />
          <p className="font-medium text-foreground">স্টাফ প্যানেল</p>
        </div>
        <p className="text-sm text-slate-600">
          স্টাফ হিসেবে আপনি যেকোনো মেসের তথ্য দেখতে পারবেন — মেম্বার, সিট, বিলিং সব মনিটর করা যাবে।
          তবে কোনো পরিবর্তন করতে চাইলে মালিকের সাথে যোগাযোগ করুন।
        </p>
      </div>
      <Button onClick={onGoDashboard} className="w-full bg-teal-600 hover:bg-teal-700">
        স্টাফ প্যানেলে যান
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}
