"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, LogOut, User as UserIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { MessListItem } from "@/lib/api-client";

interface OwnerHeaderProps {
  user: SessionUser;
  activeMess?: MessListItem | null;
  messes: MessListItem[];
  onSwitchMess: (id: string) => void;
}

export default function OwnerHeader({
  user,
  activeMess,
  messes,
  onSwitchMess,
}: OwnerHeaderProps) {
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
        {/* Brand + active mess */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/15">
            <span className="text-base font-bold text-teal-300">মে</span>
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm font-bold text-white sm:text-base">
              মেস সেটল
            </span>
            <span className="text-[10px] font-medium text-teal-300/80 sm:text-[11px]">
              মালিক ড্যাশবোর্ড
            </span>
          </div>

          {activeMess && messes.length > 0 && (
            <>
              <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />
              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                {messes.length === 1 ? (
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-semibold text-white">
                      {activeMess.name}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-teal-300/80">
                      <Tag className="size-2.5" />
                      {activeMess.code}
                    </span>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex max-w-56 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-left transition hover:border-teal-500/40 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                        aria-label="মেস পরিবর্তন করুন"
                      >
                        <div className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate text-xs font-semibold text-white">
                            {activeMess.name}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-teal-300/80">
                            <Tag className="size-2.5" />
                            {activeMess.code}
                          </span>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuLabel>আপনার মেসসমূহ</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {messes.map((m) => (
                        <DropdownMenuItem
                          key={m.id}
                          onClick={() => onSwitchMess(m.id)}
                          className={
                            m.id === activeMess.id
                              ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                              : ""
                          }
                        >
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {m.code} · {m.area}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </>
          )}
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
                <span className="mt-0.5 inline-flex w-fit rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:text-teal-300">
                  মালিক
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
