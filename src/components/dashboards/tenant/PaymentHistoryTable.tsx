"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  CheckCircle2,
  Clock,
  Inbox,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBDT } from "@/lib/constants";
import { monthYearLabel } from "@/lib/months";
import type { TenantInvoice } from "./CurrentBillCard";

export default function PaymentHistoryTable({
  invoices,
}: {
  invoices: TenantInvoice[];
}) {
  const [selected, setSelected] = useState<TenantInvoice | null>(null);
  // Already sorted desc by API (year desc, month desc). Ensure stable.
  const sorted = [...invoices].sort(
    (a, b) => b.year - a.year || b.month - a.month
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <Card className="flex h-full flex-col border-teal-500/15 bg-card shadow-sm">
        <CardHeader className="gap-2 border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
              <History className="size-4.5 text-teal-600" />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-base leading-tight text-foreground">
                পেমেন্ট ইতিহাস
              </CardTitle>
              <CardDescription className="text-xs">
                আপনার সকল মাসিক চালান
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/5">
                <Inbox className="size-5 text-teal-500" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  কোনো পেমেন্ট রেকর্ড নেই।
                </span>
                <span className="text-xs text-muted-foreground">
                  মালিক আপনার জন্য চালান তৈরি করলে এখানে দেখা যাবে।
                </span>
              </div>
            </div>
          ) : (
            <div className="tenant-scroll max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="pl-6 text-xs">মাস</TableHead>
                    <TableHead className="text-xs">মেস</TableHead>
                    <TableHead className="text-right text-xs">মোট</TableHead>
                    <TableHead className="text-xs">স্ট্যাটাস</TableHead>
                    <TableHead className="text-xs">পরিশোধ</TableHead>
                    <TableHead className="pr-6 text-right text-xs">
                      বিস্তারিত
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    return (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(inv)}
                      >
                        <TableCell className="pl-6 py-2.5 text-sm font-medium text-foreground">
                          {monthYearLabel(inv.month, inv.year)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex flex-col">
                            <span className="line-clamp-1 text-sm text-foreground">
                              {inv.messName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {inv.messCode}
                              {inv.seatNumber ? ` · সিট ${inv.seatNumber}` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-sm font-semibold tabular-nums text-foreground">
                          {formatBDT(inv.total)}
                        </TableCell>
                        <TableCell className="py-2.5">
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
                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                          {isPaid && inv.paidAt
                            ? new Date(inv.paidAt).toLocaleDateString("bn-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="pr-6 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(inv);
                            }}
                            className="h-8 gap-1 px-2 text-teal-700 hover:bg-teal-500/10 hover:text-teal-800 dark:text-teal-300"
                          >
                            <Eye className="size-3.5" />
                            দেখুন
                          </Button>
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

      {/* Detail dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-teal-600" />
              চালানের বিস্তারিত
            </DialogTitle>
            <DialogDescription>
              {selected && monthYearLabel(selected.month, selected.year)} ·{" "}
              {selected?.messName}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge
                  className={
                    selected.status === "PAID"
                      ? "gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  }
                >
                  {selected.status === "PAID" ? "পরিশোধিত" : "অপেক্ষমাণ"}
                </Badge>
                {selected.seatNumber && (
                  <span className="text-xs text-muted-foreground">
                    সিট {selected.seatNumber}
                    {selected.roomNumber ? ` · রুম ${selected.roomNumber}` : ""}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/40 p-3">
                <BreakdownRow label="ভাড়া" value={formatBDT(selected.rent)} />
                <BreakdownRow
                  label="বিদ্যুৎ"
                  value={formatBDT(selected.electricityShare)}
                />
                <BreakdownRow
                  label="গ্যাস"
                  value={formatBDT(selected.gasShare)}
                />
                <BreakdownRow
                  label="ইন্টারনেট"
                  value={formatBDT(selected.internetShare)}
                />
                <BreakdownRow
                  label="ময়লা"
                  value={formatBDT(selected.garbageShare)}
                />
                <BreakdownRow
                  label="কেয়ারটেকার"
                  value={formatBDT(selected.caretakerShare)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-2.5">
                <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                  মোট
                </span>
                <span className="text-lg font-bold text-teal-700 dark:text-teal-200">
                  {formatBDT(selected.total)}
                </span>
              </div>

              {selected.paidAt && (
                <p className="text-xs text-muted-foreground">
                  পরিশোধের তারিখ:{" "}
                  {new Date(selected.paidAt).toLocaleDateString("bn-BD", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
