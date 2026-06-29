"use client";

import { create } from "zustand";

/**
 * Ephemeral (non-persisted) filter state shared between the landing hero
 * search bar, the MessList filter UI, and the page orchestrator that
 * actually filters the mess list before passing it down as props.
 *
 * The selected *area* is kept in the main app-store (`selectedArea`) so the
 * 3D globe can react to it; everything else (text search, type, rent range,
 * amenities, vacancy toggle) lives here.
 */
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
  reset: () =>
    set({
      search: "",
      type: null,
      minRent: null,
      maxRent: null,
      amenities: [],
      onlyVacant: false,
    }),
}));

/** Apply the current filter state + selectedArea to a list of messes. */
export function filterMesses(
  list: MessListFilterable[],
  opts: {
    search: string;
    type: string | null;
    minRent: number | null;
    maxRent: number | null;
    amenities: string[];
    onlyVacant: boolean;
    selectedArea: string | null;
  }
): MessListFilterable[] {
  const q = opts.search.trim().toLowerCase();
  return list.filter((m) => {
    if (opts.selectedArea && m.area !== opts.selectedArea) return false;
    if (opts.type && m.type !== opts.type) return false;
    if (opts.onlyVacant && m.vacantSeats <= 0) return false;
    if (opts.minRent != null && m.rentPerSeat < opts.minRent) return false;
    if (opts.maxRent != null && m.rentPerSeat > opts.maxRent) return false;
    if (opts.amenities.length > 0) {
      const ok = opts.amenities.every((a) => m.amenities.includes(a));
      if (!ok) return false;
    }
    if (q) {
      const hay = `${m.name} ${m.area} ${m.city} ${m.code} ${m.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

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
}
