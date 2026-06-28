"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore, type SessionUser } from "@/store/app-store";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function TenantHeader({ user }: { user: SessionUser }) {
  const setView = useAppStore((s) => s.setView);
  const setUser = useAppStore((s) => s.setUser);
  const { toast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — clear local state regardless
    } finally {
      setUser(null);
      setView("landing");
      toast({
        title: "লগআউট সম্পন্ন",
        description: "আবার দেখা হবে।",
      });
      setLoggingOut(false);
    }
  };

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-30 border-b border-white/10 bg-[#0f1623]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/15">
            <span className="text-base font-bold text-teal-300">মে</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-white sm:text-base">
              মেস সেটল
            </span>
            <span className="text-[10px] font-medium text-teal-300/80 sm:text-[11px]">
              মেম্বার ড্যাশবোর্ড
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("landing")}
            className="gap-1.5 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <Compass className="size-4 text-teal-300" />
            <span className="hidden sm:inline">এক্সপ্লোরে ফিরুন</span>
            <span className="sm:hidden">এক্সপ্লোর</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 transition hover:border-teal-500/40 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                aria-label="অ্যাকাউন্ট মেনু"
              >
                <Avatar className="size-7 border border-teal-500/30">
                  <AvatarFallback className="bg-teal-500/20 text-[11px] font-bold text-teal-200">
                    {initials || <UserIcon className="size-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs font-medium text-slate-100 sm:inline">
                  {user.name}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={loggingOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" />
                লগআউট
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
