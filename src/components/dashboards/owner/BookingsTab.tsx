"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  Building2,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  messId: string;
  messName: string;
  name: string;
  phone: string;
  message: string | null;
  status: string;
  createdAt: string;
  userId: string | null;
}

interface BookingsTabProps {
  /** Active mess id (used for filter). If multiple messes, all are shown. */
  activeMessId: string | null;
  messNames: { id: string; name: string }[];
  refreshKey: number;
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function BookingsTab({
  activeMessId,
  messNames,
  refreshKey,
}: BookingsTabProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [messFilter, setMessFilter] = useState<string>("ALL");
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Booking[]>("/api/booking");
      setBookings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "বুকিং লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings, refreshKey]);

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => (statusFilter === "ALL" ? true : b.status === statusFilter))
      .filter((b) =>
        messFilter === "ALL"
          ? true
          : activeMessId && messFilter === "ACTIVE"
            ? b.messId === activeMessId
            : b.messId === messFilter
      )
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [bookings, statusFilter, messFilter, activeMessId]);

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActingId(id);
    try {
      await apiFetch(`/api/booking/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast({
        title: status === "APPROVED" ? "অনুমোদিত" : "প্রত্যাখ্যাত",
        description:
          status === "APPROVED"
            ? "বুকিং রিকোয়েস্ট অনুমোদিত হয়েছে।"
            : "বুকিং রিকোয়েস্ট প্রত্যাখ্যাত হয়েছে।",
      });
      await fetchBookings();
    } catch (err) {
      toast({
        title: "আপডেট ব্যর্থ",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Inbox className="size-5 text-teal-500" />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              বুকিং রিকোয়েস্ট
            </h2>
            <p className="text-xs text-muted-foreground">
              মোট {bookings.length} টি · {pendingCount} টি অপেক্ষমাণ
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchBookings()}
          disabled={loading}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          রিফ্রেশ
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground">স্ট্যাটাস</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">সব</SelectItem>
              <SelectItem value="PENDING">অপেক্ষমাণ</SelectItem>
              <SelectItem value="APPROVED">অনুমোদিত</SelectItem>
              <SelectItem value="REJECTED">প্রত্যাখ্যাত</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {messNames.length > 1 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">মেস</span>
            <Select value={messFilter} onValueChange={setMessFilter}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">সব মেস</SelectItem>
                {activeMessId && (
                  <SelectItem value="ACTIVE">শুধু সক্রিয় মেস</SelectItem>
                )}
                {messNames.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchBookings}>
            আবার চেষ্টা করুন
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <Inbox className="size-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              কোনো বুকিং রিকোয়েস্ট নেই
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              সিট অন্বেষণকারীরা বুকিং পাঠালে এখানে দেখা যাবে।
            </p>
          </div>
        </div>
      ) : (
        <Card className="bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    {messNames.length > 1 && (
                      <TableHead className="min-w-32">মেস</TableHead>
                    )}
                    <TableHead className="min-w-32">নাম</TableHead>
                    <TableHead className="min-w-32">ফোন</TableHead>
                    <TableHead className="min-w-48">বার্তা</TableHead>
                    <TableHead className="min-w-28">তারিখ</TableHead>
                    <TableHead className="min-w-28">স্ট্যাটাস</TableHead>
                    <TableHead className="min-w-40 text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/30">
                      {messNames.length > 1 && (
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Building2 className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">{b.messName}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {b.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${b.phone}`}
                          className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:underline dark:text-teal-300"
                        >
                          <Phone className="size-3.5" />
                          {b.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-xs items-start gap-1.5 text-xs text-muted-foreground">
                          <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
                          <span className="line-clamp-2">
                            {b.message || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          {new Date(b.createdAt).toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {b.status === "PENDING" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actingId === b.id}
                              onClick={() => void updateStatus(b.id, "REJECTED")}
                              className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                            >
                              {actingId === b.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <XCircle className="size-3.5" />
                              )}
                              প্রত্যাখ্যান
                            </Button>
                            <Button
                              size="sm"
                              disabled={actingId === b.id}
                              onClick={() => void updateStatus(b.id, "APPROVED")}
                              className="bg-teal-600 text-white hover:bg-teal-700"
                            >
                              <CheckCircle2 className="size-3.5" />
                              অনুমোদন
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            সম্পন্ন
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      >
        <CheckCircle2 className="size-3" />
        অনুমোদিত
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge
        variant="outline"
        className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      >
        <XCircle className="size-3" />
        প্রত্যাখ্যাত
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    >
      <Clock className="size-3" />
      অপেক্ষমাণ
    </Badge>
  );
}
