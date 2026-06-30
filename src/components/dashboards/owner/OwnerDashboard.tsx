"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  Receipt,
  Inbox,
  Settings2,
  Plus,
  Building2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { apiFetch, type MessDetail, type MessListItem } from "@/lib/api-client";
import { messTypeLabel } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import OwnerHeader from "./OwnerHeader";
import RegisterMessForm from "./RegisterMessForm";
import OverviewTab from "./OverviewTab";
import RoomsSeatsTab from "./RoomsSeatsTab";
import MembersTab from "./MembersTab";
import BillingTab from "./BillingTab";
import BookingsTab from "./BookingsTab";
import SettingsTab from "./SettingsTab";
import MobileBottomNav from "@/components/mess/MobileBottomNav";

type TabKey =
  | "overview"
  | "rooms"
  | "members"
  | "billing"
  | "bookings"
  | "settings";

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "ওভারভিউ", icon: LayoutDashboard },
  { key: "rooms", label: "রুম ও সিট", icon: DoorOpen },
  { key: "members", label: "মেম্বার", icon: Users },
  { key: "billing", label: "বিলিং", icon: Receipt },
  { key: "bookings", label: "বুকিং", icon: Inbox },
  { key: "settings", label: "সেটিংস", icon: Settings2 },
];

export default function OwnerDashboard() {
  const user = useAppStore((s) => s.user);
  const refreshKey = useAppStore((s) => s.refreshKey);
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const { toast } = useToast();

  const [messes, setMesses] = useState<MessListItem[]>([]);
  const [activeMessId, setActiveMessId] = useState<string | null>(null);
  const [activeMess, setActiveMess] = useState<MessDetail | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Fetch owned messes list
  const fetchMesses = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await apiFetch<MessListItem[]>("/api/mess/0/mine");
      setMesses(data);
      if (data.length > 0) {
        // Default to mess with most members (vacantSeats < totalSeats means it has members)
        const messWithMembers = data.find((m) => m.vacantSeats < m.totalSeats);
        setActiveMessId((prev) => prev && data.some((m) => m.id === prev)
          ? prev
          : (messWithMembers?.id ?? data[0].id));
      } else {
        setActiveMessId(null);
        setActiveMess(null);
      }
    } catch (e) {
      setListError(e instanceof Error ? e.message : "মেস লোড করা যায়নি");
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Fetch active mess detail
  const fetchActiveMess = useCallback(async () => {
    if (!activeMessId) {
      setActiveMess(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const data = await apiFetch<MessDetail>(`/api/mess/${activeMessId}`);
      setActiveMess(data);
    } catch (e) {
      toast({
        title: "মেসের বিস্তারিত লোড ব্যর্থ",
        description: e instanceof Error ? e.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [activeMessId, toast]);

  useEffect(() => {
    void fetchMesses();
  }, [fetchMesses, refreshKey]);

  useEffect(() => {
    void fetchActiveMess();
  }, [fetchActiveMess, refreshKey]);

  // Guard: not an owner
  if (!user || user.role !== "OWNER") return null;

  // Loading state
  if (loadingList && messes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background">
        <OwnerHeader user={user} messes={[]} activeMess={null} onSwitchMess={() => {}} />
        <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:p-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (listError && messes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background">
        <OwnerHeader user={user} messes={[]} activeMess={null} onSwitchMess={() => {}} />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 p-12 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-sm text-destructive">{listError}</p>
          <Button variant="outline" onClick={fetchMesses}>
            <RefreshCw className="size-4" />
            আবার চেষ্টা করুন
          </Button>
        </div>
      </div>
    );
  }

  // No messes — full-screen register form
  if (messes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background">
        <OwnerHeader user={user} messes={[]} activeMess={null} onSwitchMess={() => {}} />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-10 sm:px-6 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <Building2 className="size-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              আপনার প্রথম মেস যোগ করুন
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              এখনও আপনার কোনো মেস নিবন্ধিত নেই। নিচের ফর্মটি পূরণ করে আপনার
              মেসের বেসিক তথ্য, রুম ও সিট সংখ্যা যোগ করুন। সিট অটো-তৈরি হয়ে যাবে।
            </p>
          </motion.div>

          <div className="w-full">
            <RegisterMessForm
              onCreated={(m) => {
                setMesses([m]);
                setActiveMessId(m.id);
                toast({
                  title: "মেস তৈরি হয়েছে",
                  description: `${m.name} সফলভাবে নিবন্ধিত।`,
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Get the lightweight active mess list item (for header)
  const activeMessListItem =
    messes.find((m) => m.id === activeMessId) ?? messes[0];

  const handleSwitchMess = (id: string) => {
    setActiveMessId(id);
    setTab("overview");
  };

  const handleMessCreated = (m: MessDetail) => {
    setMesses((prev) => {
      // Avoid dupes
      if (prev.some((x) => x.id === m.id)) return prev;
      return [
        ...prev,
        {
          id: m.id,
          code: m.code,
          name: m.name,
          type: m.type,
          address: m.address,
          area: m.area,
          city: m.city,
          lat: m.lat,
          lng: m.lng,
          rentPerSeat: m.rentPerSeat,
          contactNumber: m.contactNumber,
          photos: m.photos,
          amenities: m.amenities,
          totalSeats: m.totalSeats,
          vacantSeats: m.vacantSeats,
          totalRooms: m.totalRooms,
          description: m.description,
          ownerName: m.ownerName,
        },
      ];
    });
    setActiveMessId(m.id);
    setRegisterOpen(false);
  };

  const handleDeleted = () => {
    setMesses((prev) => prev.filter((m) => m.id !== activeMessId));
    setActiveMessId((prev) => {
      const remaining = messes.filter((m) => m.id !== prev);
      return remaining[0]?.id ?? null;
    });
    setTab("overview");
    triggerRefresh();
  };

  const handleUpdated = () => {
    triggerRefresh();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-background">
      <OwnerHeader
        user={user}
        messes={messes}
        activeMess={activeMessListItem}
        onSwitchMess={handleSwitchMess}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Title row + mess selector + new mess button */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
              {activeMessListItem?.name ?? "মালিক ড্যাশবোর্ড"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeMessListItem
                ? `${messTypeLabel(activeMessListItem.type)} · ${activeMessListItem.area}, ${activeMessListItem.city}`
                : "আপনার মেস পরিচালনা করুন"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {messes.length > 1 && (
              <Select
                value={activeMessId ?? undefined}
                onValueChange={handleSwitchMess}
              >
                <SelectTrigger className="h-10 w-48 sm:w-56">
                  <SelectValue placeholder="মেস নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {messes.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <span className="truncate">{m.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {m.code}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRegisterOpen(true)}
              className="h-10 border-teal-500/30 text-teal-700 hover:bg-teal-500/10 hover:text-teal-700 dark:text-teal-300"
            >
              <Plus className="size-4" />
              নতুন মেস
            </Button>
          </div>
        </div>

        {/* Tabs nav */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
          className="mb-5"
        >
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex h-auto w-max gap-1 bg-card p-1 shadow-sm">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.key;
                return (
                  <TabsTrigger
                    key={t.key}
                    value={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-700 data-[state=active]:shadow-none dark:data-[state=active]:text-teal-300 sm:text-sm",
                      !isActive && "text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </Tabs>

        {/* Active tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "overview" && activeMessId && (
              <OverviewTab
                activeMessId={activeMessId}
                refreshKey={refreshKey}
              />
            )}
            {tab === "rooms" && (
              <>
                {loadingDetail ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <RoomsSeatsTab
                    activeMess={activeMess}
                    onChanged={triggerRefresh}
                    onGoToMembers={() => setTab("members")}
                  />
                )}
              </>
            )}
            {tab === "members" && (
              <MembersTab
                activeMess={activeMess}
                refreshKey={refreshKey}
                onChanged={triggerRefresh}
              />
            )}
            {tab === "billing" && (
              <BillingTab
                activeMess={activeMess}
                refreshKey={refreshKey}
                onChanged={triggerRefresh}
              />
            )}
            {tab === "bookings" && (
              <BookingsTab
                activeMessId={activeMessId}
                messNames={messes.map((m) => ({ id: m.id, name: m.name }))}
                refreshKey={refreshKey}
              />
            )}
            {tab === "settings" && (
              <SettingsTab
                activeMess={activeMess}
                onDeleted={handleDeleted}
                onUpdated={handleUpdated}
              />
            )}
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

      {/* New mess dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b bg-gradient-to-br from-[#0a1420] to-[#0f1623] p-5">
            <DialogTitle className="flex items-center gap-2 text-base text-white">
              <Plus className="size-4 text-teal-300" />
              নতুন মেস নিবন্ধন
            </DialogTitle>
            <DialogDescription className="text-xs text-teal-200/70">
              নতুন মেসের তথ্য পূরণ করুন। রুম ও সিট স্বয়ংক্রিয়ভাবে তৈরি হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-5">
            <RegisterMessForm
              compact
              onCreated={handleMessCreated}
              onCancel={() => setRegisterOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
