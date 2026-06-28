"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BedDouble,
  DoorOpen,
  Users,
  Clock,
  Wallet,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/constants";
import { bengaliMonth, bengaliMonthShort } from "@/lib/months";
import { apiFetch } from "@/lib/api-client";

interface OwnerStats {
  messIds: string[];
  totalSeats: number;
  vacantSeats: number;
  occupiedSeats: number;
  activeMembers: number;
  pendingBookings: number;
  month: number;
  year: number;
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  revenue: { month: number; year: number; collected: number; outstanding: number }[];
  currentUtility: {
    id: string;
    electricity: number;
    gas: number;
    internet: number;
    garbage: number;
    caretaker: number;
  } | null;
}

interface OverviewTabProps {
  activeMessId: string;
  refreshKey: number;
}

export default function OverviewTab({ activeMessId, refreshKey }: OverviewTabProps) {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OwnerStats>(
        `/api/mess/${activeMessId}/owner-stats`
      );
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "পরিসংখ্যান লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [activeMessId]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats, refreshKey]);

  if (loading) return <OverviewSkeleton />;
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-12 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-destructive">{error ?? "কোনো তথ্য নেই"}</p>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="size-4" />
          আবার চেষ্টা করুন
        </Button>
      </div>
    );
  }

  const occupancyRate =
    stats.totalSeats > 0
      ? Math.round((stats.occupiedSeats / stats.totalSeats) * 100)
      : 0;

  const vacancyData = [
    { name: "বসানো", value: stats.occupiedSeats, color: "#0d9488" },
    { name: "ফাঁকা", value: stats.vacantSeats, color: "#cbd5e1" },
  ].filter((d) => d.value > 0);

  const revenueData = [...stats.revenue]
    .slice(-6)
    .map((r) => ({
      label: bengaliMonthShort(r.month, r.year),
      collected: r.collected,
      outstanding: r.outstanding,
    }));

  const statCards = [
    {
      label: "মোট সিট",
      value: String(stats.totalSeats),
      icon: BedDouble,
      accent: "border-l-slate-400",
      iconColor: "text-slate-600 dark:text-slate-300",
    },
    {
      label: "ফাঁকা সিট",
      value: String(stats.vacantSeats),
      icon: DoorOpen,
      accent: "border-l-teal-500",
      iconColor: "text-teal-600 dark:text-teal-300",
    },
    {
      label: "বসবাসরত মেম্বার",
      value: String(stats.activeMembers),
      icon: Users,
      accent: "border-l-emerald-500",
      iconColor: "text-emerald-600 dark:text-emerald-300",
    },
    {
      label: "অপেক্ষমাণ বুকিং",
      value: String(stats.pendingBookings),
      icon: Clock,
      accent: "border-l-amber-500",
      iconColor: "text-amber-600 dark:text-amber-300",
    },
    {
      label: `এই মাসের বিল (${bengaliMonth(stats.month)})`,
      value: formatBDT(stats.totalBilled),
      icon: Wallet,
      accent: "border-l-teal-500",
      iconColor: "text-teal-600 dark:text-teal-300",
    },
    {
      label: "বাকি / অপরিশোধিত",
      value: formatBDT(stats.outstanding),
      icon: AlertCircle,
      accent: "border-l-rose-500",
      iconColor:
        stats.outstanding > 0
          ? "text-rose-600 dark:text-rose-300"
          : "text-emerald-600 dark:text-emerald-300",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Card
                className={cn(
                  "h-full border-l-4 bg-card shadow-sm",
                  s.accent
                )}
              >
                <CardContent className="flex h-full flex-col justify-between gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                      {s.label}
                    </span>
                    <Icon className={cn("size-4", s.iconColor)} />
                  </div>
                  <div className="text-xl font-bold text-foreground sm:text-2xl">
                    {s.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Collected highlight + occupancy rate */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 sm:col-span-2">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-300">
                <TrendingUp className="size-4" />
                এই মাসে আদায়কৃত
              </div>
              <div className="mt-1 text-3xl font-bold text-foreground">
                {formatBDT(stats.totalCollected)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {bengaliMonth(stats.month)} {stats.year} · মোট বিল{" "}
                {formatBDT(stats.totalBilled)}
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-2 rounded-xl bg-teal-500/15 px-3 py-2 text-teal-700 dark:text-teal-200 sm:flex">
              <CheckCircle2 className="size-5" />
              <div className="text-sm font-semibold">
                {stats.totalBilled > 0
                  ? Math.round(
                      (stats.totalCollected / stats.totalBilled) * 100
                    )
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BedDouble className="size-4 text-teal-500" />
              সিট দখলের হার
            </div>
            <div className="mt-1 text-3xl font-bold text-foreground">
              {occupancyRate}%
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.occupiedSeats}/{stats.totalSeats} সিট বসানো
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue + vacancy charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="size-4 text-teal-500" />
              গত ৬ মাসের রাজস্ব
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 5, right: 5, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outstandingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(v: number, name: string) => [
                      formatBDT(Number(v)),
                      name === "collected" ? "আদায়কৃত" : "বকেয়া",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    fill="url(#collectedFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outstanding"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#outstandingFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-teal-500" />
                আদায়কৃত
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500" />
                বকেয়া
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PieChartIcon className="size-4 text-teal-500" />
              সিট বন্টন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full">
              {vacancyData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  কোনো সিট নেই
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vacancyData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {vacancyData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">
                          {value}
                        </span>
                      )}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v} সিট`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 text-center text-xs">
              <Badge
                variant="outline"
                className="border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300"
              >
                দখল {occupancyRate}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 sm:col-span-2" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
