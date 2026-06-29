"use client";

import { useEffect, useState, useCallback } from "react";
import LandingHero from "@/components/mess/LandingHero";
import MessList from "@/components/mess/MessList";
import MessDetailDialog from "@/components/mess/MessDetailDialog";
import AuthDialog from "@/components/mess/AuthDialog";
import ProfileDialog from "@/components/mess/ProfileDialog";
import Footer from "@/components/Footer";
import OwnerDashboard from "@/components/dashboards/owner/OwnerDashboard";
import TenantDashboard from "@/components/dashboards/tenant/TenantDashboard";
import StaffDashboard from "@/components/dashboards/staff/StaffDashboard";
import { useAppStore, type SessionUser, type ViewMode } from "@/store/app-store";
import { apiFetch, type MessListItem } from "@/lib/api-client";

function viewForRole(role: string): ViewMode {
  if (role === "OWNER") return "owner-dashboard";
  if (role === "STAFF") return "staff-dashboard";
  return "tenant-dashboard";
}

export default function Home() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const setAuthOpen = useAppStore((s) => s.setAuthOpen);
  const landingTab = useAppStore((s) => s.landingTab);
  const setSelectedMessId = useAppStore((s) => s.setSelectedMessId);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [messes, setMesses] = useState<MessListItem[]>([]);

  // Restore session on first mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ user: SessionUser }>("/api/auth/me");
        const me = res?.user;
        if (!cancelled && me) {
          setUser(me);
          // Only jump to dashboard if we're still on landing (avoid
          // clobbering an explicit view choice from persisted store)
          const current = useAppStore.getState().view;
          if (current === "landing") {
            setView(viewForRole(me.role));
          }
        }
      } catch {
        // not logged in — stay on landing
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser, setView]);

  // Fetch all messes for the globe/hero/list
  const loadMesses = useCallback(async () => {
    try {
      const list = await apiFetch<MessListItem[]>(
        "/api/mess?includeFull=true"
      );
      setMesses(list);
    } catch (e) {
      console.error("Failed to load messes", e);
    }
  }, []);

  useEffect(() => {
    loadMesses();
  }, [loadMesses]);

  // If a dashboard view is active but the user is not logged in, bounce to landing
  useEffect(() => {
    if (bootstrapped && view !== "landing" && !user) {
      setView("landing");
      setAuthOpen(true, "login");
    }
  }, [bootstrapped, view, user, setView, setAuthOpen]);

  const handleSelectMess = useCallback(
    (id: string) => setSelectedMessId(id),
    [setSelectedMessId]
  );

  // Loading splash while we restore the session
  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-400" />
          <p className="text-sm text-slate-400">মেস সেটল লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  // Dashboard views
  if (view === "owner-dashboard") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <OwnerDashboard />
        <Footer />
        <MessDetailDialog />
        <AuthDialog />
        <ProfileDialog />
      </div>
    );
  }
  if (view === "tenant-dashboard") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <TenantDashboard />
        <Footer />
        <MessDetailDialog />
        <AuthDialog />
        <ProfileDialog />
      </div>
    );
  }
  if (view === "staff-dashboard") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <StaffDashboard />
        <Footer />
        <MessDetailDialog />
        <AuthDialog />
        <ProfileDialog />
      </div>
    );
  }

  // Landing (public) view
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <LandingHero messes={messes} />
      {landingTab === "list" && (
        <section className="mx-auto w-full max-w-7xl px-4 py-10">
          <MessList messes={messes} onSelect={handleSelectMess} />
        </section>
      )}
      <Footer />
      <MessDetailDialog />
      <AuthDialog />
      <ProfileDialog />
    </div>
  );
}
