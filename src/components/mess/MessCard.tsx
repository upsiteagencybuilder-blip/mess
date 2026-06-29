"use client";

import { motion } from "framer-motion";
import { MapPin, BedDouble, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AMENITIES,
  formatBDT,
  messTypeLabel,
} from "@/lib/constants";
import { getAmenityIcon } from "@/lib/icons/amenity-icons";
import type { MessListItem } from "@/lib/api-client";

export interface MessCardProps {
  mess: MessListItem;
  onSelect?: (id: string) => void;
  index?: number;
}

export default function MessCard({ mess, onSelect, index = 0 }: MessCardProps) {
  const photo =
    mess.photos && mess.photos.length > 0
      ? mess.photos[0]
      : "/placeholder-mess.svg";
  const hasVacant = mess.vacantSeats > 0;
  const amenityList = AMENITIES.filter((a) => mess.amenities.includes(a.key));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -4 }}
    >
      <Card
        onClick={() => onSelect?.(mess.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(mess.id);
          }
        }}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl border bg-card p-0 transition-all",
          "hover:border-teal-500/60 hover:ring-2 hover:ring-teal-500/20",
          "focus-visible:border-teal-500/60 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:outline-none"
        )}
      >
        {/* Photo */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <img
            src={photo}
            alt={mess.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/placeholder-mess.svg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Type badge (top-left) */}
          <div className="absolute top-3 left-3">
            <Badge className="border-teal-500/30 bg-teal-500/90 text-white shadow-sm backdrop-blur-sm hover:bg-teal-500">
              {messTypeLabel(mess.type)}
            </Badge>
          </div>

          {/* Mess code badge (top-right) */}
          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className="border-white/20 bg-black/40 text-white backdrop-blur-sm"
            >
              <Tag className="size-3" />
              {mess.code}
            </Badge>
          </div>

          {/* Rent (bottom-left) */}
          <div className="absolute bottom-3 left-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">
                {formatBDT(mess.rentPerSeat)}
              </span>
              <span className="text-[11px] text-slate-300">/সিট · মাসিক</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-4">
          <div>
            <h3 className="line-clamp-1 text-base font-semibold text-foreground">
              {mess.name}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-teal-500" />
              <span className="line-clamp-1">
                {mess.area}, {mess.city}
              </span>
            </div>
          </div>

          {/* Vacant seats badge */}
          <div className="flex items-center justify-between gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                hasVacant
                  ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <BedDouble className="size-3.5" />
              ফাঁকা সিট: {mess.vacantSeats}
            </div>
            <div className="text-[11px] text-muted-foreground">
              মোট {mess.totalSeats} সিট
            </div>
          </div>

          {/* Amenities row (first 5) */}
          {amenityList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
              {amenityList.slice(0, 5).map((a) => {
                const Icon = getAmenityIcon(a.key);
                return (
                  <div
                    key={a.key}
                    title={a.label}
                    className="flex size-7 items-center justify-center rounded-md border border-teal-500/20 bg-teal-500/5 text-teal-600 dark:text-teal-300"
                  >
                    <Icon className="size-3.5" />
                  </div>
                );
              })}
              {amenityList.length > 5 && (
                <span className="text-[11px] font-medium text-muted-foreground">
                  +{amenityList.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
