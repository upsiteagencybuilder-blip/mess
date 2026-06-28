"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  BedDouble,
  DoorOpen,
  CalendarDays,
  Copy,
  Check,
  Info,
  Tag,
  Wallet,
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
import { AMENITIES, formatBDT, messTypeLabel } from "@/lib/constants";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import type { MessDetail } from "@/lib/api-client";

export interface TenantMembership {
  id: string;
  messId: string;
  messName: string;
  messCode: string;
  area: string;
  city: string;
  rentPerSeat: number;
  seatId: string;
  seatNumber: string;
  roomId: string;
  roomNumber: string;
  joinDate: string;
  status: string;
}

export default function MessInfoCard({
  member,
  mess,
}: {
  member: TenantMembership;
  mess: MessDetail | null;
}) {
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const amenities = mess
    ? AMENITIES.filter((a) => mess.amenities.includes(a.key))
    : [];
  const address = mess?.address ?? `${member.area}, ${member.city}`;
  const contact = mess?.contactNumber ?? "";
  const joinDate = new Date(member.joinDate);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(member.messCode);
      setCopied(true);
      toast({ title: "কপি হয়েছে", description: `মেস কোড: ${member.messCode}` });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "কপি ব্যর্থ", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="overflow-hidden border-teal-500/15 bg-card shadow-sm">
        <CardHeader className="gap-2 border-b bg-gradient-to-br from-teal-500/5 to-transparent pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
                  <Building2 className="size-4.5 text-teal-600" />
                </div>
                <CardTitle className="text-lg leading-tight text-foreground">
                  {member.messName}
                </CardTitle>
              </div>
              <CardDescription className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="cursor-pointer gap-1 border-teal-500/30 bg-teal-500/5 text-teal-700 transition hover:bg-teal-500/15 dark:text-teal-300"
                  onClick={copyCode}
                >
                  <Tag className="size-3" />
                  {member.messCode}
                  {copied ? (
                    <Check className="size-3 text-teal-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Badge>
                {mess && (
                  <Badge
                    variant="outline"
                    className="border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {messTypeLabel(mess.type)}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-5">
          {/* Address */}
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-teal-500" />
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                ঠিকানা
              </span>
              <span className="text-sm text-foreground">{address}</span>
              <span className="text-xs text-muted-foreground">
                {member.area}, {member.city}
              </span>
            </div>
          </div>

          {/* Seat / Room / Rent grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <InfoTile
              icon={<BedDouble className="size-4 text-teal-600" />}
              label="আপনার সিট"
              value={member.seatNumber}
            />
            <InfoTile
              icon={<DoorOpen className="size-4 text-teal-600" />}
              label="রুম"
              value={`রুম ${member.roomNumber}`}
            />
            <InfoTile
              icon={<Wallet className="size-4 text-teal-600" />}
              label="ভাড়া (প্রতি সিট)"
              value={formatBDT(member.rentPerSeat)}
            />
          </div>

          {/* Join date */}
          <div className="flex items-center gap-2.5 rounded-lg border border-teal-500/15 bg-teal-500/5 px-3 py-2">
            <CalendarDays className="size-4 text-teal-600" />
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                যোগদানের তারিখ
              </span>
              <span className="text-sm font-medium text-foreground">
                {joinDate.toLocaleDateString("bn-BD", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Contact */}
          {contact && (
            <a
              href={`tel:${contact}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-teal-500/40 hover:bg-teal-500/5 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-teal-600" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    যোগাযোগ
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {contact}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-medium text-teal-600">
                কল করুন
              </span>
            </a>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                সুযোগ-সুবিধা
              </span>
              <div className="flex flex-wrap gap-1.5">
                {amenities.map((a) => {
                  const Icon = getAmenityIcon(a.key);
                  return (
                    <span
                      key={a.key}
                      className="inline-flex items-center gap-1.5 rounded-md border border-teal-500/20 bg-teal-500/5 px-2 py-1 text-xs font-medium text-teal-700 dark:text-teal-300"
                    >
                      <Icon className="size-3.5" />
                      {a.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action: open detail dialog */}
          <Button
            variant="outline"
            onClick={() => setSelectedMessId(member.messId)}
            className="mt-1 w-full gap-2 border-teal-500/30 text-teal-700 hover:bg-teal-500/5 hover:text-teal-800 dark:text-teal-300 dark:hover:bg-teal-500/10"
          >
            <Info className="size-4" />
            মেসের বিস্তারিত
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
