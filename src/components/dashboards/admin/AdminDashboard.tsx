"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  Wallet,
  LogOut,
  Compass,
  UserCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  BedDouble,
  MapPin,
  Phone,
  Mail,
  Trash2,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  XCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore, type SessionUser } from "@/store/app-store";
import { apiFetch } from "@/lib/api-client";
import { roleLabel, messTypeLabel, formatBDT, ROLES } from "@/lib/constants";
import { bengaliMonth } from "@/lib/months";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import MobileBottomNav from "@/components/mess/MobileBottomNav";

type TabKey = "overview" | "users" | "messes" | "bookings" | "invoices";

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "overview", label: "ওভারভিউ", icon: LayoutDashboard },
  { key: "users", label: "ইউজার", icon: Users },
  { key: "messes", label: "মেস", icon: Building2 },
  { key: "bookings", label: "বুকিং", icon: ClipboardList },
  { key: "invoices", label: "ইনভয়েস", icon: Wallet },
];

export default function AdminDashboard() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const setUser = useAppStore((s) => s.setUser);
  const setProfileOpen = useAppStore((s) => s.setProfileOpen);
  const refreshKey = useAppStore((s) => s.refreshKey);
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("overview");

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setView("landing");
    toast({ title: "লগআউট সম্পন্ন" });
  };

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 px-3 shadow-lg sm:px-6"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/20">
            <ShieldCheck className="size-5 text-rose-300" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">অ্যাডমিন প্যানেল</span>
            <span className="ml-2 hidden rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-200 sm:inline">
              ADMIN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("landing")}
            className="gap-1.5 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <Compass className="size-4 text-teal-300" />
            <span className="hidden sm:inline">এক্সপ্লোরে ফিরুন</span>
            <span className="sm:hidden">এক্সপ্লোর</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProfileOpen(true)}
            className="gap-1.5 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <UserCircle className="size-4 text-teal-300" />
            <span className="hidden max-w-20 truncate sm:inline">
              {user.name}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">লগআউট</span>
          </Button>
        </div>
      </motion.header>

      {/* Tabs nav */}
      <div className="sticky top-14 z-30 border-b border-slate-200 bg-white px-3 py-2 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  isActive
                    ? "bg-rose-500/15 text-rose-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "overview" && <OverviewTab refreshKey={refreshKey} />}
            {tab === "users" && <UsersTab refreshKey={refreshKey} />}
            {tab === "messes" && <MessesTab refreshKey={refreshKey} />}
            {tab === "bookings" && <BookingsTab refreshKey={refreshKey} />}
            {tab === "invoices" && <InvoicesTab refreshKey={refreshKey} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          icon: t.icon,
        }))}
        activeTab={tab}
        onTabChange={(k) => setTab(k as TabKey)}
      />
    </div>
  );
}

/* ============ OVERVIEW TAB ============ */
interface Stats {
  totalUsers: number;
  roleCounts: Record<string, number>;
  totalMesses: number;
  totalSeats: number;
  vacantSeats: number;
  occupiedSeats: number;
  occupancyRate: number;
  typeCounts: Record<string, number>;
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  activeMembers: number;
  month: number;
  year: number;
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  totalRevenueAllTime: number;
  revenue: { month: number; year: number; collected: number; outstanding: number }[];
  userGrowth: { month: number; year: number; users: number }[];
  recentUsers: { id: string; name: string; email: string; role: string; phone: string | null; createdAt: string }[];
  recentBookings: { id: string; messName: string; messCode: string; name: string; phone: string; status: string; createdAt: string }[];
}

function OverviewTab({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await apiFetch<Stats>("/api/admin/stats");
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-rose-500" />
      </div>
    );
  if (!stats) return <div className="py-10 text-center text-muted-foreground">তথ্য লোড করা যায়নি</div>;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Users className="size-5" />} label="মোট ইউজার" value={String(stats.totalUsers)} color="rose" />
        <StatCard icon={<Building2 className="size-5" />} label="মোট মেস" value={String(stats.totalMesses)} color="teal" />
        <StatCard icon={<BedDouble className="size-5" />} label="অকুপেন্সি" value={`${stats.occupancyRate}%`} sub={`${stats.occupiedSeats}/${stats.totalSeats} সিট`} color="teal" />
        <StatCard icon={<Wallet className="size-5" />} label="এই মাসের আয়" value={formatBDT(stats.totalCollected)} sub={`বকেয়া ${formatBDT(stats.outstanding)}`} color="emerald" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="ফাঁকা সিট" value={String(stats.vacantSeats)} />
        <MiniStat label="সক্রিয় মেম্বার" value={String(stats.activeMembers)} />
        <MiniStat label="অপেক্ষমাণ বুকিং" value={String(stats.pendingBookings)} />
        <MiniStat label="মোট বুকিং" value={String(stats.totalBookings)} />
      </div>

      {/* Revenue + user growth */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <TrendingUp className="size-4 text-teal-600" />
            মাসিক রেভিনিউ (সর্বশেষ ৬ মাস)
          </h3>
          <div className="space-y-2">
            {stats.revenue.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">
                  {bengaliMonth(r.month)} {String(r.year).slice(-2)}
                </span>
                <div className="flex-1">
                  <div className="flex gap-1">
                    <div
                      className="rounded-l bg-teal-500"
                      style={{ width: `${pct(r.collected, stats.totalRevenueAllTime)}%`, height: "20px" }}
                      title={`কালেক্টেড: ${formatBDT(r.collected)}`}
                    />
                    <div
                      className="rounded-r bg-amber-400"
                      style={{ width: `${pct(r.outstanding, stats.totalRevenueAllTime)}%`, height: "20px" }}
                      title={`বকেয়া: ${formatBDT(r.outstanding)}`}
                    />
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-medium text-foreground">
                  {formatBDT(r.collected + r.outstanding)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded bg-teal-500" /> কালেক্টেড
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded bg-amber-400" /> বকেয়া
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <Users className="size-4 text-rose-600" />
            ইউজার বৃদ্ধি
          </h3>
          <div className="flex h-40 items-end justify-between gap-2">
            {stats.userGrowth.map((g, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-rose-500 to-rose-400 transition-all"
                    style={{ height: `${pct(g.users, stats.totalUsers) || 2}%` }}
                    title={`${g.users} ইউজার`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {bengaliMonth(g.month).slice(0, 4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role breakdown + Mess types */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-foreground">ইউজার রোল ভাগ</h3>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <div key={r.value} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{r.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${pct(stats.roleCounts[r.value] || 0, stats.totalUsers)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-bold text-foreground">
                    {stats.roleCounts[r.value] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-foreground">মেস টাইপ ভাগ</h3>
          <div className="space-y-2">
            {Object.entries(stats.typeCounts).map(([t, c]) => (
              <div key={t} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{messTypeLabel(t)}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-teal-500"
                      style={{ width: `${pct(c, stats.totalMesses)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-bold text-foreground">{c}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-foreground">নতুন ইউজার</h3>
          <div className="space-y-2">
            {stats.recentUsers.length === 0 && (
              <p className="text-sm text-muted-foreground">কোনো ইউজার নেই</p>
            )}
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-rose-500/10 text-xs font-bold text-rose-700">
                    {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{roleLabel(u.role)}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-foreground">সাম্প্রতিক বুকিং</h3>
          <div className="space-y-2">
            {stats.recentBookings.length === 0 && (
              <p className="text-sm text-muted-foreground">কোনো বুকিং নেই</p>
            )}
            {stats.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.messName} · {b.messCode}</p>
                </div>
                {bookingBadge(b.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function pct(n: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((n / total) * 100));
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "rose" | "teal" | "emerald";
}) {
  const colors = {
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", colors[color])}>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs opacity-80">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs opacity-70">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function bookingBadge(status: string) {
  if (status === "APPROVED")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
        <CheckCircle2 className="mr-1 size-3" /> নিশ্চিত
      </Badge>
    );
  if (status === "REJECTED")
    return (
      <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/15">
        <XCircle className="mr-1 size-3" /> বাতিল
      </Badge>
    );
  return (
    <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">
      <Clock className="mr-1 size-3" /> অপেক্ষমাণ
    </Badge>
  );
}

/* ============ USERS TAB ============ */
interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  createdAt: string;
  ownedMesses: number;
  memberships: number;
  bookings: number;
}

function UsersTab({ refreshKey }: { refreshKey: number }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminUser[]>("/api/admin/users");
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]);

  const changeRole = async (id: string, role: string) => {
    try {
      await apiFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      toast({ title: "রোল আপডেট হয়েছে", description: `নতুন রোল: ${roleLabel(role)}` });
      loadUsers();
    } catch (e) {
      toast({
        title: "আপডেট ব্যর্থ",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      toast({ title: "ইউজার মুছে ফেলা হয়েছে" });
      loadUsers();
    } catch (e) {
      toast({
        title: "মুছতে ব্যর্থ",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-rose-500" />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="নাম বা ইমেইল খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">সব রোল</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} / {users.length} ইউজার
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">ইউজার</th>
              <th className="px-3 py-2 font-medium">যোগাযোগ</th>
              <th className="px-3 py-2 font-medium">রোল</th>
              <th className="px-3 py-2 font-medium">মেস/বুকিং</th>
              <th className="px-3 py-2 font-medium">যোগদান</th>
              <th className="px-3 py-2 font-medium">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-rose-500/10 text-xs font-bold text-rose-700">
                        {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {u.phone || "—"}
                </td>
                <td className="px-3 py-2">
                  <Select value={u.role} onValueChange={(r) => changeRole(u.id, r)}>
                    <SelectTrigger className="h-7 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className="text-foreground">{u.ownedMesses}</span> মেস ·{" "}
                  <span className="text-foreground">{u.memberships}</span> সদস্য ·{" "}
                  <span className="text-foreground">{u.bookings}</span> বুকিং
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-3 py-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ইউজার মুছবেন?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{u.name}" ({u.email}) কে মুছে ফেলা হবে। এই কাজটি ফিরিয়ে আনা যাবে না।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUser(u.id)}
                          className="bg-rose-600 hover:bg-rose-700"
                        >
                          মুছে ফেলুন
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">কোনো ইউজার পাওয়া যায়নি</p>
        )}
      </div>
    </div>
  );
}

/* ============ MESSES TAB ============ */
interface AdminMess {
  id: string;
  code: string;
  name: string;
  type: string;
  area: string;
  city: string;
  rentPerSeat: number;
  totalSeats: number;
  vacantSeats: number;
  occupiedSeats: number;
  totalRooms: number;
  contactNumber: string;
  createdAt: string;
  owner: { id: string; name: string; email: string; phone: string | null };
  memberCount: number;
  bookingCount: number;
}

function MessesTab({ refreshKey }: { refreshKey: number }) {
  const [messes, setMesses] = useState<AdminMess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminMess[]>("/api/admin/messes");
      setMesses(data);
    } catch {
      setMesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const deleteMess = async (id: string) => {
    try {
      await apiFetch(`/api/admin/messes/${id}`, { method: "DELETE" });
      toast({ title: "মেস মুছে ফেলা হয়েছে" });
      triggerRefresh();
      load();
    } catch (e) {
      toast({
        title: "মুছতে ব্যর্থ",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const filtered = messes.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.area.toLowerCase().includes(q) || m.owner.name.toLowerCase().includes(q);
  });

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-rose-500" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="মেসের নাম, কোড, এলাকা বা মালিক খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} / {messes.length} মেস
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">মেস</th>
              <th className="px-3 py-2 font-medium">এলাকা</th>
              <th className="px-3 py-2 font-medium">মালিক</th>
              <th className="px-3 py-2 font-medium">ভাড়া</th>
              <th className="px-3 py-2 font-medium">সিট</th>
              <th className="px-3 py-2 font-medium">মেম্বার/বুকিং</th>
              <th className="px-3 py-2 font-medium">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <p className="font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.code} · {messTypeLabel(m.type)}</p>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {m.area}, {m.city}
                </td>
                <td className="px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{m.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{m.owner.phone || m.owner.email}</p>
                </td>
                <td className="px-3 py-2 font-medium text-teal-700">
                  {formatBDT(m.rentPerSeat)}
                </td>
                <td className="px-3 py-2">
                  <span className="text-foreground">{m.vacantSeats}</span>
                  <span className="text-muted-foreground">/{m.totalSeats}</span>
                  <p className="text-[10px] text-muted-foreground">{m.occupiedSeats} বসবাসরত</p>
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className="text-foreground">{m.memberCount}</span> মেম্বার ·{" "}
                  <span className="text-foreground">{m.bookingCount}</span> বুকিং
                </td>
                <td className="px-3 py-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>মেস মুছবেন?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{m.name}" ({m.code}) মুছে ফেলা হবে। এর সব রুম, সিট, মেম্বার ও বিল মুছে যাবে। এই কাজটি ফিরিয়ে আনা যাবে না।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMess(m.id)}
                          className="bg-rose-600 hover:bg-rose-700"
                        >
                          মুছে ফেলুন
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">কোনো মেস পাওয়া যায়নি</p>
        )}
      </div>
    </div>
  );
}

/* ============ BOOKINGS TAB ============ */
interface AdminBooking {
  id: string;
  messName: string;
  messCode: string;
  messArea: string;
  messCity: string;
  userName: string;
  userEmail: string | null;
  name: string;
  phone: string;
  message: string | null;
  status: string;
  createdAt: string;
}

function BookingsTab({ refreshKey }: { refreshKey: number }) {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminBooking[]>("/api/admin/bookings");
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = bookings.filter((b) => statusFilter === "ALL" || b.status === statusFilter);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-rose-500" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">সব স্ট্যাটাস</SelectItem>
            <SelectItem value="PENDING">অপেক্ষমাণ</SelectItem>
            <SelectItem value="APPROVED">নিশ্চিত</SelectItem>
            <SelectItem value="REJECTED">বাতিল</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} / {bookings.length} বুকিং
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">আবেদনকারী</th>
              <th className="px-3 py-2 font-medium">মেস</th>
              <th className="px-3 py-2 font-medium">বার্তা</th>
              <th className="px-3 py-2 font-medium">তারিখ</th>
              <th className="px-3 py-2 font-medium">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <p className="font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <Phone className="mr-0.5 inline size-3" />
                    {b.phone}
                  </p>
                  {b.userEmail && (
                    <p className="text-xs text-muted-foreground">
                      <Mail className="mr-0.5 inline size-3" />
                      {b.userEmail}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{b.messName}</p>
                  <p className="text-xs text-muted-foreground">{b.messCode} · {b.messArea}</p>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px]">
                  {b.message || "—"}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(b.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-3 py-2">{bookingBadge(b.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">কোনো বুকিং পাওয়া যায়নি</p>
        )}
      </div>
    </div>
  );
}

/* ============ INVOICES TAB ============ */
interface AdminInvoice {
  id: string;
  messName: string;
  messCode: string;
  userName: string;
  userPhone: string;
  seatNumber: string | null;
  month: number;
  year: number;
  total: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

function InvoicesTab({ refreshKey }: { refreshKey: number }) {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminInvoice[]>("/api/admin/invoices");
      setInvoices(data);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = invoices.filter((i) => statusFilter === "ALL" || i.status === statusFilter);
  const totalCollected = filtered.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const totalOutstanding = filtered.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-rose-500" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">সব স্ট্যাটাস</SelectItem>
            <SelectItem value="PAID">পরিশোধিত</SelectItem>
            <SelectItem value="PENDING">বকেয়া</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
            কালেক্টেড: {formatBDT(totalCollected)}
          </Badge>
          <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">
            বকেয়া: {formatBDT(totalOutstanding)}
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">মেস / মেম্বার</th>
              <th className="px-3 py-2 font-medium">মাস</th>
              <th className="px-3 py-2 font-medium">টোটাল</th>
              <th className="px-3 py-2 font-medium">স্ট্যাটাস</th>
              <th className="px-3 py-2 font-medium">পরিশোধের তারিখ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{inv.messName}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.messCode} · {inv.userName} · {inv.seatNumber || "—"}
                  </p>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {bengaliMonth(inv.month)} {inv.year}
                </td>
                <td className="px-3 py-2 font-medium text-foreground">
                  {formatBDT(inv.total)}
                </td>
                <td className="px-3 py-2">
                  {inv.status === "PAID" ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
                      <CheckCircle2 className="mr-1 size-3" /> পরিশোধিত
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">
                      <Clock className="mr-1 size-3" /> বকেয়া
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">কোনো ইনভয়েস পাওয়া যায়নি</p>
        )}
      </div>
    </div>
  );
}
