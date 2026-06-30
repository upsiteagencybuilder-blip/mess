"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Loader2,
  MapPin,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import {
  apiFetch,
  type MessDetail,
  type MessListItem,
} from "@/lib/api-client";
import { messTypeLabel } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import StaffHeader from "./StaffHeader";
import StaffOverviewTab from "./StaffOverviewTab";
import StaffMembersTab from "./StaffMembersTab";
import StaffBillingTab from "./StaffBillingTab";
import MobileBottomNav from "@/components/mess/MobileBottomNav";
import { LayoutDashboard, Users, Receipt } from "lucide-react";

export interface StaffMember {
  id: string;
  messId: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string;
  seatId: string;
  seatNumber: string;
  roomId: string;
  roomNumber: string;
  joinDate: string;
  status: string;
}

export interface StaffUtilityBill {
  id: string;
  messId: string;
  month: number;
  year: number;
  electricity: number;
  gas: number;
  internet: number;
  garbage: number;
  caretaker: number;
  createdAt: string;
}

export interface StaffInvoice {
  id: string;
  messId: string;
  memberId: string;
  userId: string;
  month: number;
  year: number;
  rent: number;
  electricityShare: number;
  gasShare: number;
  internetShare: number;
  garbageShare: number;
  caretakerShare: number;
  total: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  userName: string;
  userPhone: string | null;
  seatNumber: string | null;
  roomNumber: string | null;
}

export default function StaffDashboard() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const refreshKey = useAppStore((s) => s.refreshKey);
  const { toast } = useToast();

  const [messes, setMesses] = useState<MessListItem[]>([]);
  const [selectedMessId, setSelectedMessId] = useState<string>("");
  const [mess, setMess] = useState<MessDetail | null>(null);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [utilities, setUtilities] = useState<StaffUtilityBill[]>([]);
  const [invoices, setInvoices] = useState<StaffInvoice[]>([]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffTab, setStaffTab] = useState("overview");

  // 1. Load mess picker list once on mount
  useEffect(() => {
    if (!user || user.role !== "STAFF") return;
    let cancelled = false;
    setLoadingList(true);

    (async () => {
      try {
        const list = await apiFetch<MessListItem[]>(
          "/api/mess?includeFull=true"
        );
        if (cancelled) return;
        setMesses(list);
        if (list.length > 0 && !selectedMessId) {
          setSelectedMessId(list[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "মেস তালিকা লোড ব্যর্থ");
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // 2. Load mess detail + members + utility + invoices whenever selection changes
  useEffect(() => {
    if (!selectedMessId) return;
    let cancelled = false;
    setLoadingDetail(true);
    setError(null);

    (async () => {
      try {
        const [detail, membersRes, utilityRes, invoiceRes] = await Promise.all([
          apiFetch<MessDetail>(`/api/mess/${selectedMessId}`),
          apiFetch<StaffMember[]>(`/api/member?messId=${selectedMessId}`),
          apiFetch<StaffUtilityBill[]>(
            `/api/utility?messId=${selectedMessId}`
          ),
          apiFetch<StaffInvoice[]>(`/api/invoice?messId=${selectedMessId}`),
        ]);

        if (cancelled) return;
        setMess(detail);
        setMembers(membersRes);
        setUtilities(utilityRes);
        setInvoices(invoiceRes);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "তথ্য লোড ব্যর্থ";
          setError(msg);
          toast({
            title: "তথ্য লোড ব্যর্থ",
            description: msg,
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedMessId, refreshKey]);

  if (!user || user.role !== "STAFF") return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <StaffHeader user={user} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Mess picker */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5"
        >
          <Card className="border-teal-500/15 bg-card shadow-sm">
            <CardContent className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
                  <Building2 className="size-4.5 text-teal-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    মেস নির্বাচন করুন
                  </span>
                  <span className="text-sm text-foreground">
                    যে মেসটি পরিদর্শন করতে চান বেছে নিন
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {messes.length > 0 ? (
                  <Select
                    value={selectedMessId}
                    onValueChange={(v) => setSelectedMessId(v)}
                  >
                    <SelectTrigger className="h-10 w-full bg-background sm:w-72">
                      <SelectValue placeholder="মেস নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {messes.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              · {m.code}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    কোনো মেস পাওয়া যায়নি
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Body */}
        {loadingList ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="size-8 animate-spin text-teal-500" />
            <p className="text-sm text-muted-foreground">মেস তালিকা লোড হচ্ছে…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
              <AlertCircle className="size-6 text-rose-500" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">
                তথ্য লোড ব্যর্থ
              </span>
              <span className="text-xs text-muted-foreground">{error}</span>
            </div>
          </div>
        ) : !selectedMessId ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/5">
              <Building2 className="size-6 text-teal-500" />
            </div>
            <span className="text-sm text-muted-foreground">
              পরিদর্শনের জন্য একটি মেস নির্বাচন করুন।
            </span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
          >
            {/* Mess context banner */}
            {mess && (
              <div className="flex flex-col gap-2 rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 className="size-5 text-teal-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {mess.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3 text-teal-500" />
                      {mess.area}, {mess.city} · {messTypeLabel(mess.type)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-md border border-teal-500/20 bg-teal-500/5 px-2 py-1 font-medium text-teal-700 dark:text-teal-300">
                    {mess.code}
                  </span>
                  <span className="text-muted-foreground">
                    ফাঁকা সিট: <span className="font-semibold text-foreground">{mess.vacantSeats}</span>
                  </span>
                </div>
              </div>
            )}

            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="size-7 animate-spin text-teal-500" />
                <p className="text-sm text-muted-foreground">
                  মেসের তথ্য লোড হচ্ছে…
                </p>
              </div>
            ) : (
              <Tabs value={staffTab} onValueChange={setStaffTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/60 sm:w-auto">
                  <TabsTrigger value="overview" className="gap-1.5">
                    পরিদর্শন
                  </TabsTrigger>
                  <TabsTrigger value="members" className="gap-1.5">
                    মেম্বার
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="gap-1.5">
                    বিলিং
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-5">
                  <StaffOverviewTab
                    mess={mess}
                    members={members}
                    invoices={invoices}
                  />
                </TabsContent>

                <TabsContent value="members" className="mt-5">
                  <StaffMembersTab members={members} />
                </TabsContent>

                <TabsContent value="billing" className="mt-5">
                  <StaffBillingTab utilities={utilities} invoices={invoices} />
                </TabsContent>
              </Tabs>
            )}
          </motion.div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav
        tabs={[
          { key: "overview", label: "পরিদর্শন", icon: LayoutDashboard },
          { key: "members", label: "মেম্বার", icon: Users },
          { key: "billing", label: "বিলিং", icon: Receipt },
        ]}
        activeTab={staffTab}
        onTabChange={setStaffTab}
      />
    </div>
  );
}
