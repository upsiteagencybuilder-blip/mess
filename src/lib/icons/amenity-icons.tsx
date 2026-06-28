"use client";

import {
  Wifi,
  Droplets,
  Zap,
  ShieldCheck,
  Camera,
  Car,
  ArrowUpDown,
  ChefHat,
  WashingMachine,
  Flame,
  UtensilsCrossed,
  Building2,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the 12 amenity keys defined in src/lib/constants.ts (AMENITIES[].key)
 * to their Lucide icon components. Centralized so MessCard, MessDetailDialog,
 * and any filter UI can render amenity icons consistently.
 */
export const AMENITY_ICON_MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  filteredWater: Droplets,
  generator: Zap,
  security: ShieldCheck,
  cctv: Camera,
  parking: Car,
  lift: ArrowUpDown,
  kitchen: ChefHat,
  washingMachine: WashingMachine,
  geyser: Flame,
  dining: UtensilsCrossed,
  rooftop: Building2,
};

export function getAmenityIcon(key: string): LucideIcon {
  return AMENITY_ICON_MAP[key] ?? HelpCircle;
}
