"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Flame,
  Wifi,
  Trash2,
  FileText,
  Calculator,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  Sparkles,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useToast } from "@/hooks/use-toast";
import { apiFetch, type MessDetail } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/constants";
import {
  BENGALI_MONTHS,
  bengaliMonth,
  currentMonth,
  currentYear,
  yearOptions,
} from "@/lib/months";

interface UtilityBill {
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

interface Invoice {
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
  userPhone: string;
  seatNumber: string;
  roomNumber: string;
}

interface BillingTabProps {
  activeMess: MessDetail | null;
  refreshKey: number;
  onChanged: () => void;
}

const UTILITY_FIELDS = [
  { key: "electricity", label: "বিদ্যুৎ", icon: Zap, color: "text-amber-500" },
  { key: "gas", label: "গ্যাস", icon: Flame, color: "text-orange-500" },
  { key: "internet", label: "ইন্টারনেট", icon: Wifi, color: "text-teal-500" },
  { key: "garbage", label: "ময়লা", icon: Trash2, color: "text-slate-500" },
  { key: "caretaker", label: "কেয়ারটেকার", icon: Receipt, color: "text-emerald-500" },
] as const;

export default function BillingTab({
  activeMess,
  refreshKey,
  onChanged,
}: BillingTabProps) {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [year, setYear] = useState(currentYear());
  const [bills, setBills] = useState<UtilityBill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  // Utility form state
  const [utilityForm, setUtilityForm] = useState({
    electricity: "",
    gas: "",
    internet: "",
    garbage: "",
    caretaker: "",
  });
  const [savingUtility, setSavingUtility] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [togglingInvoiceId, setTogglingInvoiceId] = useState<string | null>(
    null
  );

  const fetchBills = useCallback(async () => {
    if (!activeMess) return;
    setLoadingBills(true);
    setBillsError(null);
    try {
      const data = await apiFetch<UtilityBill[]>(
        `/api/utility?messId=${activeMess.id}`
      );
      setBills(data);
    } catch (e) {
      setBillsError(e instanceof Error ? e.message : "ইউটিলিটি বিল লোড ব্যর্থ");
    } finally {
      setLoadingBills(false);
    }
  }, [activeMess]);

  const fetchInvoices = useCallback(async () => {
    if (!activeMess) return;
    setLoadingInvoices(true);
    setInvoicesError(null);
    try {
      const data = await apiFetch<Invoice[]>(
        `/api/invoice?messId=${activeMess.id}&month=${month}&year=${year}`
      );
      setInvoices(data);
    } catch (e) {
      setInvoicesError(e instanceof Error ? e.message : "ইনভয়েস লোড ব্যর্থ");
    } finally {
      setLoadingInvoices(false);
    }
  }, [activeMess, month, year]);

  useEffect(() => {
    void fetchBills();
  }, [fetchBills, refreshKey]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices, refreshKey]);

  // When month/year changes, try to prefill utility form from existing bill
  useEffect(() => {
    const existing = bills.find((b) => b.month === month && b.year === year);
    if (existing) {
      setUtilityForm({
        electricity: String(existing.electricity),
        gas: String(existing.gas),
        internet: String(existing.internet),
        garbage: String(existing.garbage),
        caretaker: String(existing.caretaker),
      });
    } else {
      setUtilityForm({
        electricity: "",
        gas: "",
        internet: "",
        garbage: "",
        caretaker: "",
      });
    }
  }, [month, year, bills]);

  const saveUtility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingUtility || !activeMess) return;
    const payload = {
      messId: activeMess.id,
      month,
      year,
      electricity: Number(utilityForm.electricity || 0),
      gas: Number(utilityForm.gas || 0),
      internet: Number(utilityForm.internet || 0),
      garbage: Number(utilityForm.garbage || 0),
      caretaker: Number(utilityForm.caretaker || 0),
    };
    setSavingUtility(true);
    try {
      await apiFetch<UtilityBill>("/api/utility", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast({
        title: "ইউটিলিটি বিল সংরক্ষিত",
        description: `${bengaliMonth(month)} ${year} এর বিল আপডেট হয়েছে।`,
      });
      await fetchBills();
      onChanged();
    } catch (err) {
      toast({
        title: "সংরক্ষণ ব্যর্থ",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setSavingUtility(false);
    }
  };

  const deleteBill = async (id: string) => {
    try {
      await apiFetch(`/api/utility/${id}`, { method: "DELETE" });
      toast({
        title: "ইউটিলিটি বিল মুছে ফেলা হয়েছে",
      });
      await fetchBills();
      onChanged();
    } catch (err) {
      toast({
        title: "মুছতে ব্যর্থ",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    }
  };

  const generateInvoices = async () => {
    if (generating || !activeMess) return;
    setGenerating(true);
    try {
      const res = await apiFetch<{ generated: number; invoices: Invoice[] }>(
        "/api/invoice",
        {
          method: "POST",
          body: JSON.stringify({
            messId: activeMess.id,
            month,
            year,
          }),
        }
      );
      toast({
        title: "ইনভয়েস তৈরি সম্পন্ন",
        description: `${res.generated} টি ইনভয়েস ${bengaliMonth(month)} ${year} এর জন্য তৈরি হয়েছে।`,
      });
      await fetchInvoices();
      onChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "আবার চেষ্টা করুন";
      toast({
        title: "ইনভয়েস তৈরি ব্যর্থ",
        description: msg.includes("utility")
          ? "প্রথমে এই মাসের ইউটিলিটি বিল এন্ট্রি করুন।"
          : msg,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleInvoice = async (inv: Invoice) => {
    setTogglingInvoiceId(inv.id);
    const next = inv.status === "PAID" ? "PENDING" : "PAID";
    try {
      await apiFetch(`/api/invoice/${inv.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      toast({
        title: next === "PAID" ? "পরিশোধিত" : "বাকিতে রূপান্তর",
        description: `${inv.userName} এর ইনভয়েস ${next === "PAID" ? "পরিশোধিত" : "বাকি"} হিসেবে চিহ্নিত।`,
      });
      await fetchInvoices();
      onChanged();
    } catch (err) {
      toast({
        title: "আপডেট ব্যর্থ",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setTogglingInvoiceId(null);
    }
  };

  if (!activeMess) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center text-sm text-muted-foreground">
        কোনো মেস নির্বাচিত নেই।
      </div>
    );
  }

  // Compute totals for selected month
  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total, 0);
  const outstanding = totalBilled - totalCollected;
  const activeMemberCount = activeMess.totalSeats - activeMess.vacantSeats;
  const currentBill = bills.find((b) => b.month === month && b.year === year);
  const totalUtility = currentBill
    ? currentBill.electricity +
      currentBill.gas +
      currentBill.internet +
      currentBill.garbage +
      currentBill.caretaker
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      {/* Month/Year selector */}
      <Card className="border-teal-500/20 bg-card shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-month" className="text-xs">
              মাস
            </Label>
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger id="b-month" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BENGALI_MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-year" className="text-xs">
              বছর
            </Label>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger id="b-year" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions().map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300"
            >
              <Calculator className="size-3" />
              {bengaliMonth(month)} {year}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-teal-500/10 hover:text-teal-700">
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-left">
                  প্রতিটি ইউটিলিটি বিল সমানভাবে সকল সক্রিয় মেম্বারের মাঝে ভাগ হয়
                  (ceil)। সক্রিয় মেম্বার: {activeMemberCount}।
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Utility section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <Zap className="size-4" />
            </span>
            ইউটিলিটি বিল
            {currentBill && (
              <Badge
                variant="outline"
                className="ml-1 border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
              >
                <CheckCircle2 className="size-3" />
                এই মাসের বিল আছে
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={saveUtility}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {UTILITY_FIELDS.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`u-${f.key}`} className="flex items-center gap-1.5 text-xs">
                    <Icon className={cn("size-3.5", f.color)} />
                    {f.label} (৳)
                  </Label>
                  <Input
                    id={`u-${f.key}`}
                    type="number"
                    min={0}
                    value={utilityForm[f.key]}
                    onChange={(e) =>
                      setUtilityForm((s) => ({ ...s, [f.key]: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
              );
            })}
            <div className="flex items-end sm:col-span-2 lg:col-span-5">
              <Button
                type="submit"
                disabled={savingUtility}
                className="h-10 w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
              >
                {savingUtility ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    {currentBill ? "বিল আপডেট করুন" : "বিল সংরক্ষণ করুন"}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Existing bills list */}
          {loadingBills ? (
            <Skeleton className="h-32 w-full" />
          ) : billsError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="size-4" />
              {billsError}
            </div>
          ) : bills.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-xs text-muted-foreground">
              এখনও কোনো ইউটিলিটি বিল এন্ট্রি করা হয়নি।
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="min-w-32">মাস / বছর</TableHead>
                    <TableHead className="min-w-20 text-right">বিদ্যুৎ</TableHead>
                    <TableHead className="min-w-20 text-right">গ্যাস</TableHead>
                    <TableHead className="min-w-20 text-right">নেট</TableHead>
                    <TableHead className="min-w-20 text-right">ময়লা</TableHead>
                    <TableHead className="min-w-24 text-right">কেয়ারটেকার</TableHead>
                    <TableHead className="min-w-24 text-right">মোট</TableHead>
                    <TableHead className="min-w-20 text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills
                    .slice()
                    .sort((a, b) => b.year - a.year || b.month - a.month)
                    .map((b) => {
                      const total =
                        b.electricity +
                        b.gas +
                        b.internet +
                        b.garbage +
                        b.caretaker;
                      const isCurrent =
                        b.month === month && b.year === year;
                      return (
                        <TableRow
                          key={b.id}
                          className={cn(
                            isCurrent && "bg-teal-500/5",
                            "hover:bg-muted/30"
                          )}
                        >
                          <TableCell className="font-medium">
                            {bengaliMonth(b.month)} {b.year}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatBDT(b.electricity)}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatBDT(b.gas)}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatBDT(b.internet)}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatBDT(b.garbage)}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatBDT(b.caretaker)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold">
                            {formatBDT(total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    বিল মুছবেন?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {bengaliMonth(b.month)} {b.year} এর
                                    ইউটিলিটি বিল মুছে যাবে। এই মাসের ইনভয়েস
                                    থাকলে সেগুলো পুনরায় তৈরি করতে হবে।
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => void deleteBill(b.id)}
                                    className="border-0 bg-rose-600 text-white hover:bg-rose-700"
                                  >
                                    মুছে ফেলুন
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Invoices section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <FileText className="size-4" />
              </span>
              ইনভয়েস
              <span className="text-xs font-normal text-muted-foreground">
                ({bengaliMonth(month)} {year})
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchInvoices()}
                disabled={loadingInvoices}
              >
                <RefreshCw className={cn("size-4", loadingInvoices && "animate-spin")} />
                রিফ্রেশ
              </Button>
              <Button
                size="sm"
                onClick={() => void generateInvoices()}
                disabled={generating}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    ইনভয়েস জেনারেট করুন
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Quick summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile
              label="মোট ইনভয়েস"
              value={String(invoices.length)}
              icon={<FileText className="size-4 text-slate-500" />}
            />
            <SummaryTile
              label="মোট বিল"
              value={formatBDT(totalBilled)}
              icon={<Receipt className="size-4 text-teal-500" />}
            />
            <SummaryTile
              label="আদায়কৃত"
              value={formatBDT(totalCollected)}
              icon={<CheckCircle2 className="size-4 text-emerald-500" />}
              tone="teal"
            />
            <SummaryTile
              label="বকেয়া"
              value={formatBDT(outstanding)}
              icon={<Clock className="size-4 text-amber-500" />}
              tone={outstanding > 0 ? "amber" : "teal"}
            />
          </div>

          {/* Helper note */}
          <div className="flex items-start gap-2 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-teal-700 dark:text-teal-300">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              ইউটিলিটি বিল মোট <strong>{formatBDT(totalUtility)}</strong> ·{" "}
              সক্রিয় মেম্বার <strong>{activeMemberCount}</strong> · প্রতি মেম্বারের
              ইউটিলিটি শেয়ার (ceil) ≈{" "}
              <strong>
                {formatBDT(
                  activeMemberCount > 0
                    ? Math.ceil(totalUtility / activeMemberCount)
                    : 0
                )}
              </strong>
              {activeMess && (
                <>
                  {" "}+ ভাড়া <strong>{formatBDT(activeMess.rentPerSeat)}</strong>
                </>
              )}
            </span>
          </div>

          {/* Invoices table */}
          {loadingInvoices ? (
            <Skeleton className="h-64 w-full" />
          ) : invoicesError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="size-4" />
              {invoicesError}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  এই মাসের কোনো ইনভয়েস নেই
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  প্রথমে ইউটিলিটি বিল এন্ট্রি করুন, তারপর "ইনভয়েস জেনারেট করুন" বাটনে ক্লিক করুন।
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => void generateInvoices()}
                disabled={generating}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                <Sparkles className="size-4" />
                ইনভয়েস জেনারেট করুন
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="min-w-32">মেম্বার</TableHead>
                    <TableHead className="min-w-24">রুম / সিট</TableHead>
                    <TableHead className="min-w-20 text-right">ভাড়া</TableHead>
                    <TableHead className="min-w-20 text-right">বিদ্যুৎ</TableHead>
                    <TableHead className="min-w-20 text-right">গ্যাস</TableHead>
                    <TableHead className="min-w-20 text-right">নেট</TableHead>
                    <TableHead className="min-w-20 text-right">ময়লা</TableHead>
                    <TableHead className="min-w-24 text-right">কেয়ারটেকার</TableHead>
                    <TableHead className="min-w-24 text-right">মোট</TableHead>
                    <TableHead className="min-w-28">স্ট্যাটাস</TableHead>
                    <TableHead className="min-w-28 text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const paid = inv.status === "PAID";
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{inv.userName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {inv.userPhone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {inv.roomNumber} · {inv.seatNumber}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatBDT(inv.rent)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatBDT(inv.electricityShare)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatBDT(inv.gasShare)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatBDT(inv.internetShare)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatBDT(inv.garbageShare)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatBDT(inv.caretakerShare)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold">
                          {formatBDT(inv.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              paid
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            )}
                          >
                            {paid ? (
                              <>
                                <CheckCircle2 className="size-3" />
                                পরিশোধিত
                              </>
                            ) : (
                              <>
                                <Clock className="size-3" />
                                বাকি
                              </>
                            )}
                          </Badge>
                          {paid && inv.paidAt && (
                            <div className="mt-0.5 text-[10px] text-muted-foreground">
                              {new Date(inv.paidAt).toLocaleDateString("bn-BD", {
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={togglingInvoiceId === inv.id}
                            onClick={() => void toggleInvoice(inv)}
                            className={cn(
                              paid
                                ? "border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
                                : "border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                            )}
                          >
                            {togglingInvoiceId === inv.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : paid ? (
                              "বাকি করুন"
                            ) : (
                              "পরিশোধিত করুন"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals row */}
          {invoices.length > 0 && (
            <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  মোট বিল
                </div>
                <div className="text-sm font-bold text-foreground">
                  {formatBDT(totalBilled)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  আদায়কৃত
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBDT(totalCollected)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  বকেয়া
                </div>
                <div
                  className={cn(
                    "text-sm font-bold",
                    outstanding > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {formatBDT(outstanding)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "teal" | "amber";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm",
        tone === "teal" && "border-teal-500/30",
        tone === "amber" && "border-amber-500/30"
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          tone === "teal"
            ? "bg-teal-500/15"
            : tone === "amber"
              ? "bg-amber-500/15"
              : "bg-muted"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-foreground">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
