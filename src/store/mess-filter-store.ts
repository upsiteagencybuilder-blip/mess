"use client";

import { create } from "zustand";

export interface RefPoint {
  lat: number;
  lng: number;
  label: string;
}

interface MessFilterState {
  search: string;
  setSearch: (s: string) => void;

  type: string | null;
  setType: (t: string | null) => void;

  minRent: number | null;
  maxRent: number | null;
  setRentRange: (min: number | null, max: number | null) => void;

  amenities: string[];
  toggleAmenity: (a: string) => void;
  clearAmenities: () => void;

  onlyVacant: boolean;
  setOnlyVacant: (v: boolean) => void;

  refPoint: RefPoint;
  setRefPoint: (p: RefPoint) => void;

  maxDistance: number | null;
  setMaxDistance: (d: number | null) => void;

  reset: () => void;
}

export const useMessFilter = create<MessFilterState>((set) => ({
  search: "",
  setSearch: (s) => set({ search: s }),
  type: null,
  setType: (t) => set({ type: t }),
  minRent: null,
  maxRent: null,
  setRentRange: (min, max) => set({ minRent: min, maxRent: max }),
  amenities: [],
  toggleAmenity: (a) =>
    set((s) => ({
      amenities: s.amenities.includes(a)
        ? s.amenities.filter((x) => x !== a)
        : [...s.amenities, a],
    })),
  clearAmenities: () => set({ amenities: [] }),
  onlyVacant: false,
  setOnlyVacant: (v) => set({ onlyVacant: v }),
  refPoint: { lat: 24.3636, lng: 88.6241, label: "রাজশাহী বিশ্ববিদ্যালয়" },
  setRefPoint: (p) => set({ refPoint: p }),
  maxDistance: null,
  setMaxDistance: (d) => set({ maxDistance: d }),
  reset: () =>
    set({
      search: "",
      type: null,
      minRent: null,
      maxRent: null,
      amenities: [],
      onlyVacant: false,
      maxDistance: null,
    }),
}));

export interface MessListFilterable {
  id: string;
  code: string;
  name: string;
  type: string;
  area: string;
  city: string;
  rentPerSeat: number;
  amenities: string[];
  vacantSeats: number;
  lat: number;
  lng: number;
}

export function filterMesses(
  list: MessListFilterable[],
  opts: {
    search: string;
    type: string | null;
    minRent: number | null;
    maxRent: number | null;
    amenities: string[];
    onlyVacant: boolean;
    refPoint: RefPoint;
    maxDistance: number | null;
  }
): MessListFilterable[] {
  const q = opts.search.trim().toLowerCase();
  return list.filter((m) => {
    if (opts.type && m.type !== opts.type) return false;
    if (opts.onlyVacant && m.vacantSeats <= 0) return false;
    if (opts.minRent != null && m.rentPerSeat < opts.minRent) return false;
    if (opts.maxRent != null && m.rentPerSeat > opts.maxRent) return false;
    if (opts.amenities.length > 0) {
      const ok = opts.amenities.every((a) => m.amenities.includes(a));
      if (!ok) return false;
    }
    if (opts.maxDistance != null) {
      const d = haversineKm(opts.refPoint.lat, opts.refPoint.lng, m.lat, m.lng);
      if (d > opts.maxDistance) return false;
    }
    if (q) {
      const hay = `${m.name} ${m.area} ${m.city} ${m.code} ${m.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
