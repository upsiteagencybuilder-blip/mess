"use client";

import { motion } from "framer-motion";
import {
  Receipt,
  Zap,
  CheckCircle2,
  Clock,
  Inbox,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBDT } from "@/lib/constants";
import { monthYearLabel } from "@/lib/months";
import type { StaffInvoice, StaffUtilityBill } from "./StaffDashboard";

export default function StaffBillingTab({
  utilities,
  invoices,
}: {
  utilities: StaffUtilityBill[];
  invoices: StaffInvoice[];
}) {
  const now = new Date();
  const cm = now.getMonth() + 1;
  const cy = now.getFullYear();

  const currentInvoices = invoices.filter(
    (i) => i.month === cm && i.year === cy
  );
  const currentBilled = currentInvoices.reduce((s, i) => s + i.total, 0);
  const currentOutstanding = currentInvoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + i.total, 0);

  const sortedInvoices = [...invoices].sort(
    (a, b) => b.year - a.year || b.month - a.month
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5"
    >
      {/* Current month summary banner */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryBanner
          icon={<FileText className="size-4 text-teal-600" />}
          label={`${monthYearLabel(cm, cy)} মোট বিল`}
          value={formatBDT(currentBilled)}
          tone="teal"
        />
        <SummaryBanner
          icon={<AlertCircle className="size-4 text-amber-500" />}
          label="বকেয়া"
          value={formatBDT(currentOutstanding)}
          tone="amber"
        />
        <SummaryBanner
          icon={<CheckCircle2 className="size-4 text-emerald-600" />}
          label="চালান সংখ্যা"
          value={`${currentInvoices.length} টি`}
          tone="emerald"
        />
      </div>

      {/* Utility bills (read-only) */}
      <Card className="border-teal-500/15 bg-card shadow-sm">
        <CardHeader className="gap-2 border-b pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
                <Zap className="size-4.5 text-teal-600" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base leading-tight text-foreground">
                  ইউটিলিটি বিল
                </CardTitle>
                <CardDescription className="text-xs">
                  মেসের মাসিক ইউটিলিটি খরচ (শুধু পরিদর্শন)
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="gap-1 border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300"
            >
              রিড-অনলি
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {utilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/5">
                <Inbox className="size-5 text-teal-500" />
              </div>
              <span className="text-sm text-muted-foreground">
                কোনো ইউটিলিটি বিল রেকর্ড নেই।
              </span>
            </div>
          ) : (
            <div className="staff-scroll max-h-80 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="pl-6 text-xs">মাস</TableHead>
                    <TableHead className="text-right text-xs">বিদ্যুৎ</TableHead>
                    <TableHead className="text-right text-xs">গ্যাস</TableHead>
                    <TableHead className="text-right text-xs">নেট</TableHead>
                    <TableHead className="text-right text-xs">ময়লা</TableHead>
                    <TableHead className="text-right text-xs">কেয়ার</TableHead>
                    <TableHead className="pr-6 text-right text-xs">মোট</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utilities.map((u) => {
                    const total =
                      u.electricity + u.gas + u.internet + u.garbage + u.caretaker;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="pl-6 py-2.5 text-sm font-medium text-foreground">
                          {monthYearLabel(u.month, u.year)}
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-xs tabular-nums text-foreground">
                          {formatBDT(u.electricity)}
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-xs tabular-nums text-foreground">
                          {formatBDT(u.gas)}
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-xs tabular-nums text-foreground">
                          {formatBDT(u.internet)}
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-xs tabular-nums text-foreground">
                          {formatBDT(u.garbage)}
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-xs tabular-nums text-foreground">
                          {formatBDT(u.caretaker)}
                        </TableCell>
                        <TableCell className="pr-6 py-2.5 text-right text-sm font-bold tabular-nums text-teal-700 dark:text-teal-300">
                          {formatBDT(total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices (read-only) */}
      <Card className="border-teal-500/15 bg-card shadow-sm">
        <CardHeader className="gap-2 border-b pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
                <Receipt className="size-4.5 text-teal-600" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base leading-tight text-foreground">
                  মেম্বার চালান
                </CardTitle>
                <CardDescription className="text-xs">
                  প্রতি মেম্বারের মাসিক বিল ও স্ট্যাটাস
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              শুধুমাত্র মালিক স্ট্যাটাস আপডেট করতে পারেন
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/5">
                <Inbox className="size-5 text-teal-500" />
              </div>
              <span className="text-sm text-muted-foreground">
                কোনো চালান তৈরি হয়নি।
              </span>
            </div>
          ) : (
            <div className="staff-scroll max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="pl-6 text-xs">মাস</TableHead>
                    <TableHead className="text-xs">মেম্বার</TableHead>
                    <TableHead className="text-xs">সিট</TableHead>
                    <TableHead className="text-right text-xs">মোট</TableHead>
                    <TableHead className="pr-6 text-xs">স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 py-2.5 text-sm font-medium text-foreground">
                          {monthYearLabel(inv.month, inv.year)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex flex-col">
                            <span className="text-sm text-foreground">
                              {inv.userName}
                            </span>
                            {inv.userPhone && (
                              <span className="text-[10px] text-muted-foreground">
                                {inv.userPhone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                          {inv.seatNumber ?? "—"}
                          {inv.roomNumber ? ` · রুম ${inv.roomNumber}` : ""}
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-sm font-semibold tabular-nums text-foreground">
                          {formatBDT(inv.total)}
                        </TableCell>
                        <TableCell className="pr-6 py-2.5">
                          <Badge
                            className={
                              isPaid
                                ? "gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            }
                          >
                            {isPaid ? (
                              <CheckCircle2 className="size-3" />
                            ) : (
                              <Clock className="size-3" />
                            )}
                            {isPaid ? "পরিশোধিত" : "অপেক্ষমাণ"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryBanner({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "teal" | "amber" | "emerald";
}) {
  const cls = {
    teal: "border-teal-500/25 bg-teal-500/5",
    amber: "border-amber-500/25 bg-amber-500/5",
    emerald: "border-emerald-500/25 bg-emerald-500/5",
  }[tone];
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${cls}`}>
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-background/60">
          {icon}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-base font-bold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
