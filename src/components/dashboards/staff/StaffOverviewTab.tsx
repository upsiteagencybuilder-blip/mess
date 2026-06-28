"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from "recharts";
import {
  BedDouble,
  DoorOpen,
  Users,
  Wallet,
  AlertCircle,
  Info,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBDT } from "@/lib/constants";
import { monthYearLabel } from "@/lib/months";
import type { MessDetail } from "@/lib/api-client";
import type { StaffMember, StaffInvoice } from "./StaffDashboard";

export default function StaffOverviewTab({
  mess,
  members,
  invoices,
}: {
  mess: MessDetail | null;
  members: StaffMember[];
  invoices: StaffInvoice[];
}) {
  const totalSeats = mess?.totalSeats ?? 0;
  const vacantSeats = mess?.vacantSeats ?? 0;
  const occupiedSeats = Math.max(0, totalSeats - vacantSeats);
  const activeMembers = members.length;

  const now = new Date();
  const cm = now.getMonth() + 1;
  const cy = now.getFullYear();

  const currentInvoices = invoices.filter(
    (i) => i.month === cm && i.year === cy
  );
  const totalBilled = currentInvoices.reduce((s, i) => s + i.total, 0);
  const outstanding = currentInvoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + i.total, 0);

  const donutData = [
    { name: "বসানো", value: occupiedSeats, color: "#0d9488" },
    { name: "ফাঁকা", value: vacantSeats, color: "#5eead4" },
  ].filter((d) => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5"
    >
      {/* Read-only notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
            স্টাফ হিসেবে আপনি শুধু দেখতে পারেন।
          </span>
          <span className="text-xs text-amber-800/80 dark:text-amber-200/70">
            পরিবর্তনের জন্য মালিকের সাথে যোগাযোগ করুন। সকল তথ্য এখানে শুধু
            পরিদর্শনের জন্য।
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<BedDouble className="size-4 text-teal-600" />}
          label="মোট সিট"
          value={String(totalSeats)}
          tone="teal"
        />
        <StatCard
          icon={<DoorOpen className="size-4 text-emerald-600" />}
          label="ফাঁকা"
          value={String(vacantSeats)}
          tone="emerald"
        />
        <StatCard
          icon={<BedDouble className="size-4 text-slate-500" />}
          label="বসানো"
          value={String(occupiedSeats)}
          tone="slate"
        />
        <StatCard
          icon={<Users className="size-4 text-teal-600" />}
          label="সক্রিয় মেম্বার"
          value={String(activeMembers)}
          tone="teal"
        />
        <StatCard
          icon={<Wallet className="size-4 text-teal-600" />}
          label={`${monthYearLabel(cm, cy).split(" ")[0]} বিল`}
          value={formatBDT(totalBilled)}
          tone="teal"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Vacancy donut */}
        <Card className="border-teal-500/15 bg-card shadow-sm">
          <CardHeader className="gap-1 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon />
              সিট বিন্যাস
            </CardTitle>
            <CardDescription className="text-xs">
              মোট {totalSeats} সিটের মধ্যে বর্তমান অবস্থা
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {totalSeats === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                কোনো সিট তথ্য নেই
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <div className="relative h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        activeShape={renderActiveShape}
                        stroke="none"
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                      {totalSeats}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      মোট সিট
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2.5">
                  <LegendRow
                    color="#0d9488"
                    label="বসানো"
                    value={occupiedSeats}
                    total={totalSeats}
                  />
                  <LegendRow
                    color="#5eead4"
                    label="ফাঁকা"
                    value={vacantSeats}
                    total={totalSeats}
                  />
                  <div className="mt-1 rounded-lg border border-teal-500/15 bg-teal-500/5 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">ফাঁকা হার</span>
                      <span className="font-semibold text-teal-700 dark:text-teal-300">
                        {totalSeats > 0
                          ? Math.round((vacantSeats / totalSeats) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing summary */}
        <Card className="border-teal-500/15 bg-card shadow-sm">
          <CardHeader className="gap-1 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4 text-teal-600" />
              {monthYearLabel(cm, cy)} বিলিং
            </CardTitle>
            <CardDescription className="text-xs">
              চলতি মাসের চালান সারসংক্ষেপ
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-5">
            <SummaryRow
              label="মোট বিল তৈরি"
              value={formatBDT(totalBilled)}
              icon={<Info className="size-4 text-teal-600" />}
            />
            <SummaryRow
              label="বকেয়া (অপেক্ষমাণ)"
              value={formatBDT(outstanding)}
              icon={<AlertCircle className="size-4 text-amber-500" />}
              highlight="amber"
            />
            <SummaryRow
              label="পরিশোধিত"
              value={formatBDT(Math.max(0, totalBilled - outstanding))}
              icon={<Wallet className="size-4 text-emerald-600" />}
              highlight="emerald"
            />
            <SummaryRow
              label="চালান সংখ্যা"
              value={`${currentInvoices.length} টি`}
              icon={<Info className="size-4 text-slate-500" />}
            />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function PieChartIcon() {
  return (
    <span className="flex size-7 items-center justify-center rounded-md border border-teal-500/30 bg-teal-500/10">
      <BedDouble className="size-4 text-teal-600" />
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "teal" | "emerald" | "slate";
}) {
  const toneClass = {
    teal: "border-teal-500/20 bg-teal-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    slate: "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50",
  }[tone];

  return (
    <Card className={`${toneClass} gap-0 border py-3 shadow-sm`}>
      <CardContent className="flex flex-col gap-1 px-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="line-clamp-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        <span className="text-lg font-bold text-foreground">{value}</span>
      </CardContent>
    </Card>
  );
}

function LegendRow({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span
          className="size-3 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {value}
        </span>
        <span className="text-[11px] text-muted-foreground">({pct}%)</span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: "amber" | "emerald";
}) {
  const cls = highlight
    ? highlight === "amber"
      ? "border-amber-500/25 bg-amber-500/5"
      : "border-emerald-500/25 bg-emerald-500/5"
    : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40";
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${cls}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span
        className={`text-sm font-bold tabular-nums ${
          highlight === "amber"
            ? "text-amber-700 dark:text-amber-300"
            : highlight === "emerald"
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// Recharts active shape for the donut hover state
function renderActiveShape(props: {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
}) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = "",
  } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}
