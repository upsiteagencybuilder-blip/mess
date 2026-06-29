"use client";

import { motion } from "framer-motion";
import {
  Receipt,
  CheckCircle2,
  Clock,
  Zap,
  Flame,
  Wifi,
  Trash2,
  HeartHandshake,
  Home,
  CalendarCheck,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/lib/constants";
import { monthYearLabel } from "@/lib/months";

export interface TenantInvoice {
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
  messName: string;
  messCode: string;
  seatNumber: string | null;
  roomNumber: string | null;
}

function pickCurrentInvoice(invoices: TenantInvoice[]): TenantInvoice | null {
  if (invoices.length === 0) return null;
  const now = new Date();
  const cm = now.getMonth() + 1;
  const cy = now.getFullYear();
  // 1. current month/year exact match
  const current = invoices.find((i) => i.month === cm && i.year === cy);
  if (current) return current;
  // 2. latest unpaid
  const unpaid = invoices.find((i) => i.status !== "PAID");
  if (unpaid) return unpaid;
  // 3. latest overall
  return invoices[0];
}

export default function CurrentBillCard({
  invoices,
}: {
  invoices: TenantInvoice[];
}) {
  const inv = pickCurrentInvoice(invoices);
  const isPaid = inv?.status === "PAID";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
    >
      <Card className="overflow-hidden border-teal-500/15 bg-card shadow-sm">
        <CardHeader className="gap-2 border-b bg-gradient-to-br from-teal-500/5 to-transparent pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
                <Receipt className="size-4.5 text-teal-600" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base leading-tight text-foreground">
                  চলতি মাসের বিল
                </CardTitle>
                <CardDescription className="text-xs">
                  {inv
                    ? monthYearLabel(inv.month, inv.year)
                    : "এই মাসের বিল এখনো তৈরি হয়নি"}
                </CardDescription>
              </div>
            </div>
            {inv && (
              <Badge
                className={
                  isPaid
                    ? "gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                }
              >
                {isPaid ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <Clock className="size-3.5" />
                )}
                {isPaid ? "পরিশোধিত" : "অপেক্ষমাণ"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {!inv ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/5">
                <Info className="size-5 text-teal-500" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  এই মাসের বিল এখনো তৈরি হয়নি।
                </span>
                <span className="text-xs text-muted-foreground">
                  মালিক ইউটিলিটি বিল যোগ করে চালান তৈরি করলে এখানে দেখা যাবে।
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Breakdown */}
              <div className="flex flex-col gap-2">
                <LineItem
                  icon={<Home className="size-4 text-teal-600" />}
                  label="ভাড়া"
                  value={formatBDT(inv.rent)}
                />
                <LineItem
                  icon={<Zap className="size-4 text-amber-500" />}
                  label="বিদ্যুৎ"
                  value={formatBDT(inv.electricityShare)}
                />
                <LineItem
                  icon={<Flame className="size-4 text-orange-500" />}
                  label="গ্যাস"
                  value={formatBDT(inv.gasShare)}
                />
                <LineItem
                  icon={<Wifi className="size-4 text-sky-500" />}
                  label="ইন্টারনেট"
                  value={formatBDT(inv.internetShare)}
                />
                <LineItem
                  icon={<Trash2 className="size-4 text-emerald-600" />}
                  label="ময়লা"
                  value={formatBDT(inv.garbageShare)}
                />
                <LineItem
                  icon={<HeartHandshake className="size-4 text-rose-500" />}
                  label="কেয়ারটেকার"
                  value={formatBDT(inv.caretakerShare)}
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3">
                <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                  মোট
                </span>
                <span className="text-xl font-bold text-teal-700 dark:text-teal-200">
                  {formatBDT(inv.total)}
                </span>
              </div>

              {/* Paid date */}
              {isPaid && inv.paidAt && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <CalendarCheck className="size-4 text-emerald-600" />
                  <span className="text-xs text-emerald-800 dark:text-emerald-200">
                    পরিশোধের তারিখ:{" "}
                    <span className="font-medium">
                      {new Date(inv.paidAt).toLocaleDateString("bn-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </span>
                </div>
              )}

              {/* Explainer */}
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                ইউটিলিটি বিল সমানভাবে ভাগ হয়েছে। কোনো ভুল থাকলে মেস মালিকের সাথে
                যোগাযোগ করুন।
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LineItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-md bg-muted">
          {icon}
        </span>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
