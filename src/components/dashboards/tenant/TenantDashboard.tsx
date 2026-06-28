"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Building2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";
import { apiFetch, type MessDetail } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import TenantHeader from "./TenantHeader";
import MessInfoCard, { type TenantMembership } from "./MessInfoCard";
import CurrentBillCard, { type TenantInvoice } from "./CurrentBillCard";
import PaymentHistoryTable from "./PaymentHistoryTable";

interface MineResponse {
  members?: TenantMembership[];
  member?: TenantMembership | null;
}

export default function TenantDashboard() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const refreshKey = useAppStore((s) => s.refreshKey);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<TenantMembership | null>(null);
  const [mess, setMess] = useState<MessDetail | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);

  useEffect(() => {
    if (!user || user.role !== "TENANT") return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [mineRes, invRes] = await Promise.all([
          apiFetch<MineResponse>("/api/member/mine"),
          apiFetch<TenantInvoice[]>("/api/invoice"),
        ]);

        if (cancelled) return;

        // API returns { members: [...] } when there are active memberships,
        // or { member: null } when none. Handle both.
        const list = mineRes.members ?? [];
        const first = list[0] ?? null;
        setMember(first);
        setInvoices(invRes);

        if (first) {
          try {
            const detail = await apiFetch<MessDetail>(
              `/api/mess/${first.messId}`
            );
            if (!cancelled) setMess(detail);
          } catch {
            // Mess detail fetch failed — keep showing member info
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "তথ্য লোড ব্যর্থ",
            description:
              err instanceof Error ? err.message : "আবার চেষ্টা করুন",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, refreshKey]);

  if (!user || user.role !== "TENANT") return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <TenantHeader user={user} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="size-8 animate-spin text-teal-500" />
            <p className="text-sm text-muted-foreground">
              আপনার তথ্য লোড হচ্ছে…
            </p>
          </div>
        ) : !member ? (
          <EmptyMembershipState onExplore={() => setView("landing")} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-5 lg:grid-cols-2"
          >
            {/* Left column */}
            <div className="flex flex-col gap-5">
              <MessInfoCard member={member} mess={mess} />
              <CurrentBillCard invoices={invoices} />
            </div>
            {/* Right column */}
            <div className="flex flex-col">
              <PaymentHistoryTable invoices={invoices} />
            </div>
          </motion.div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <span className="text-[11px] text-muted-foreground">
            মেস সেটল · মেম্বার প্যানেল
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("landing")}
            className="gap-1.5 text-xs text-muted-foreground hover:text-teal-600"
          >
            <ArrowLeft className="size-3.5" />
            এক্সপ্লোরে ফিরুন
          </Button>
        </div>
      </footer>
    </div>
  );
}

function EmptyMembershipState({
  onExplore,
}: {
  onExplore: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl"
    >
      <Card className="overflow-hidden border-teal-500/20 bg-card shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:py-16">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex size-16 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10"
          >
            <Building2 className="size-8 text-teal-600" />
          </motion.div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              আপনি বর্তমানে কোনো মেসে যুক্ত নন।
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              একবার কোনো মেসের মালিক আপনাকে একটি সিট বরাদ্দ করলে, আপনার
              মাসিক চালান, পেমেন্ট ইতিহাস এবং মেসের বিস্তারিত এই
              ড্যাশবোর্ডে দেখা যাবে। এখন ফাঁকা সিট খুঁজে বুকিং অনুরোধ
              পাঠান।
            </p>
          </div>

          <Button
            size="lg"
            onClick={onExplore}
            className="mt-2 h-12 gap-2 bg-teal-600 px-6 text-white shadow-md hover:bg-teal-700"
          >
            <Search className="size-5" />
            মেস খুঁজুন
          </Button>

          <div className="mt-2 flex items-center gap-2 rounded-lg border border-teal-500/15 bg-teal-500/5 px-4 py-3 text-left">
            <span className="text-[11px] leading-relaxed text-muted-foreground">
              💡 এক্সপ্লোর পেজ থেকে পছন্দের মেস বেছে নিন, বুকিং অনুরোধ পাঠান,
              এবং মালিক অনুমোদন করলে আপনি এখানে আপনার সিট ও বিল দেখতে পাবেন।
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
