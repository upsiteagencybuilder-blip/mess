import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode =
  | "landing"
  | "owner-dashboard"
  | "tenant-dashboard"
  | "staff-dashboard";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: "TENANT" | "OWNER" | "STAFF";
  avatar?: string | null;
}

interface AppState {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  landingTab: "explore" | "list" | "map";
  setLandingTab: (t: "explore" | "list" | "map") => void;
  selectedMessId: string | null;
  setSelectedMessId: (id: string | null) => void;
  authOpen: boolean;
  authMode: "login" | "register";
  setAuthOpen: (open: boolean, mode?: "login" | "register") => void;
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  selectedArea: string | null;
  setSelectedArea: (a: string | null) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      view: "landing",
      setView: (v) => set({ view: v }),
      landingTab: "explore",
      setLandingTab: (t) => set({ landingTab: t }),
      selectedMessId: null,
      setSelectedMessId: (id) => set({ selectedMessId: id }),
      authOpen: false,
      authMode: "login",
      setAuthOpen: (open, mode) =>
        set({ authOpen: open, authMode: mode ?? "login" }),
      profileOpen: false,
      setProfileOpen: (open) => set({ profileOpen: open }),
      selectedArea: null,
      setSelectedArea: (a) => set({ selectedArea: a }),
      refreshKey: 0,
      triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
    }),
    {
      name: "mess-app-store",
      partialize: (s) => ({ user: s.user, view: s.view }),
    }
  )
);
