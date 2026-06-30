"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  ArrowLeft,
  Loader2,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Wallet,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { apiFetch, type MessDetail } from "@/lib/api-client";
import { formatBDT } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import TenantHeader from "./TenantHeader";
import MessInfoCard, { type TenantMembership } from "./MessInfoCard";
import CurrentBillCard, { type TenantInvoice } from "./CurrentBillCard";
import PaymentHistoryTable from "./PaymentHistoryTable";
import MobileBottomNav from "@/components/mess/MobileBottomNav";
import { Receipt } from "lucide-react";

interface MineResponse {
  members?: TenantMembership[];
  member?: TenantMembership | null;
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

export default function TenantDashboard() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const setProfileOpen = useAppStore((s) => s.setProfileOpen);
  const refreshKey = useAppStore((s) => s.refreshKey);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<TenantMembership | null>(null);
  const [mess, setMess] = useState<MessDetail | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  useEffect(() => {
    if (!user || user.role !== "TENANT") return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [mineRes, invRes, bookRes] = await Promise.all([
          apiFetch<MineResponse>("/api/member/mine"),
          apiFetch<TenantInvoice[]>("/api/invoice"),
          apiFetch<BookingItem[]>("/api/booking"),
        ]);

        if (cancelled) return;

        const list = mineRes.members ?? [];
        const first = list[0] ?? null;
        setMember(first);
        setInvoices(invRes);
        setBookings(bookRes || []);

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
          <EmptyMembershipState
            bookings={bookings}
            onExplore={() => setView("landing")}
            onOpenProfile={() => setProfileOpen(true)}
          />
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

      {/* Mobile bottom nav */}
      <MobileBottomNav
        tabs={[
          { key: "mess", label: "মেস", icon: Building2 },
          { key: "bill", label: "বিল", icon: Wallet },
          { key: "history", label: "ইতিহাস", icon: Receipt },
          { key: "profile", label: "প্রোফাইল", icon: UserCircle },
        ]}
        activeTab="mess"
        onTabChange={() => {
          /* scroll to relevant section */
        }}
      />
    </div>
  );
}

function bookingStatusBadge(status: string) {
  switch (status) {
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

function EmptyMembershipState({
  bookings,
  onExplore,
  onOpenProfile,
}: {
  bookings: BookingItem[];
  onExplore: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl space-y-5"
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

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={onExplore}
              className="h-12 gap-2 bg-teal-600 px-6 text-white shadow-md hover:bg-teal-700"
            >
              <Search className="size-5" />
              মেস খুঁজুন
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onOpenProfile}
              className="h-12 gap-2 border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <UserCircle className="size-5" />
              প্রোফাইল দেখুন
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-lg border border-teal-500/15 bg-teal-500/5 px-4 py-3 text-left">
            <span className="text-[11px] leading-relaxed text-muted-foreground">
              💡 এক্সপ্লোর পেজ থেকে পছন্দের মেস বেছে নিন, বুকিং অনুরোধ পাঠান,
              এবং মালিক অনুমোদন করলে আপনি এখানে আপনার সিট ও বিল দেখতে পাবেন।
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Booking requests */}
      {bookings.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="px-6 py-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="size-5 text-teal-600" />
              <h3 className="text-base font-semibold text-foreground">
                আপনার বুকিং রিকোয়েস্ট ({bookings.length})
              </h3>
            </div>
            <div className="space-y-2">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {b.messName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {b.messArea}, {b.messCity}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="size-3" />
                        {formatBDT(b.rentPerSeat)}/সিট
                      </span>
                      <span>{b.messCode}</span>
                    </div>
                    {b.message && (
                      <p className="mt-1 truncate text-xs italic text-slate-400">
                        &ldquo;{b.message}&rdquo;
                      </p>
                    )}
                  </div>
                  {bookingStatusBadge(b.status)}
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              মালিক অনুমোদন করলে আপনার সিট স্বয়ংক্রিয়ভাবে বরাদ্দ হবে এবং এই ড্যাশবোর্ডে দেখা যাবে।
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
