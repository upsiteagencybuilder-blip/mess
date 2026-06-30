"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DoorOpen,
  BedDouble,
  Users,
  RefreshCw,
  Loader2,
  CheckCircle2,
  CircleDashed,
  UserPlus,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, type MessDetail } from "@/lib/api-client";

interface RoomsSeatsTabProps {
  /** Full mess detail (with rooms & seats). */
  activeMess: MessDetail | null;
  /** Called after a seat toggle so the parent can refetch. */
  onChanged: () => void;
  /** Optional callback to jump to the members tab to assign a vacant seat. */
  onGoToMembers?: () => void;
}

interface Seat {
  id: string;
  seatNumber: string;
  status: string;
  memberName: string | null;
}

export default function RoomsSeatsTab({
  activeMess,
  onChanged,
  onGoToMembers,
}: RoomsSeatsTabProps) {
  const { toast } = useToast();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Seat | null>(null);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomCapacity, setNewRoomCapacity] = useState("2");
  const [addingRoom, setAddingRoom] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const handleAddRoom = async () => {
    if (!activeMess) return;
    if (!newRoomNumber.trim()) {
      toast({ title: "রুম নম্বর দিন", variant: "destructive" });
      return;
    }
    setAddingRoom(true);
    try {
      await apiFetch("/api/room", {
        method: "POST",
        body: JSON.stringify({
          messId: activeMess.id,
          roomNumber: newRoomNumber.trim(),
          capacity: Number(newRoomCapacity),
        }),
      });
      toast({ title: "রুম যোগ হয়েছে", description: `${newRoomNumber} — ${newRoomCapacity} সিট` });
      setAddRoomOpen(false);
      setNewRoomNumber("");
      setNewRoomCapacity("2");
      onChanged();
    } catch (e) {
      toast({
        title: "রুম যোগ ব্যর্থ",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setAddingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    setDeletingRoomId(roomId);
    try {
      await apiFetch(`/api/room/${roomId}`, { method: "DELETE" });
      toast({ title: "রুম মুছে ফেলা হয়েছে" });
      onChanged();
    } catch (e) {
      toast({
        title: "রুম মুছতে ব্যর্থ",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setDeletingRoomId(null);
    }
  };

  if (!activeMess) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center text-sm text-muted-foreground">
        কোনো মেস নির্বাচিত নেই।
      </div>
    );
  }

  const totalSeats = activeMess.totalSeats;
  const occupied = activeMess.rooms.reduce(
    (sum, r) => sum + r.seats.filter((s) => s.status === "OCCUPIED").length,
    0
  );
  const vacant = totalSeats - occupied;

  const toggleSeat = async (seat: Seat) => {
    setTogglingId(seat.id);
    setPendingToggle(null);
    const next = seat.status === "OCCUPIED" ? "VACANT" : "OCCUPIED";
    try {
      await apiFetch(`/api/seat/${seat.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      toast({
        title: "সিট আপডেট হয়েছে",
        description: `${seat.seatNumber} এখন ${
          next === "OCCUPIED" ? "বসানো" : "ফাঁকা"
        }।`,
      });
      onChanged();
    } catch (e) {
      toast({
        title: "আপডেট ব্যর্থ",
        description: e instanceof Error ? e.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat
          icon={<BedDouble className="size-4 text-slate-500" />}
          label="মোট সিট"
          value={totalSeats}
        />
        <SummaryStat
          icon={<CheckCircle2 className="size-4 text-teal-500" />}
          label="বসানো"
          value={occupied}
          highlight="teal"
        />
        <SummaryStat
          icon={<CircleDashed className="size-4 text-amber-500" />}
          label="ফাঁকা"
          value={vacant}
          highlight="amber"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded border border-teal-500/40 bg-teal-500/20" />
            বসানো (OCCUPIED)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded border border-dashed border-teal-500/50 bg-teal-500/5" />
            ফাঁকা (VACANT)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-teal-500/30 text-teal-700 hover:bg-teal-500/10"
              >
                <Plus className="size-4" />
                রুম যোগ করুন
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>নতুন রুম যোগ করুন</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label className="mb-1 text-xs">রুম নম্বর / নাম *</Label>
                  <Input
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="যেমন: 101, 102, বা 'বড় রুম'"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="mb-1 text-xs">সিট সংখ্যা *</Label>
                  <Select value={newRoomCapacity} onValueChange={setNewRoomCapacity}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} সিট
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddRoom}
                  disabled={addingRoom}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {addingRoom ? (
                    <>
                      <Loader2 className="mr-1 size-4 animate-spin" />
                      যোগ হচ্ছে…
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 size-4" />
                      রুম যোগ করুন
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {onGoToMembers && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToMembers}
              className="border-teal-500/30 text-teal-700 hover:bg-teal-500/10 hover:text-teal-700"
            >
              <UserPlus className="size-4" />
              <span className="hidden sm:inline">মেম্বার ট্যাবে যান</span>
              <span className="sm:hidden">মেম্বার</span>
            </Button>
          )}
        </div>
      </div>

      {/* Rooms grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeMess.rooms.map((room, idx) => {
          const roomOccupied = room.seats.filter(
            (s) => s.status === "OCCUPIED"
          ).length;
          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
            >
              <Card className="h-full bg-card shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300">
                        <DoorOpen className="size-4" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          রুম {room.roomNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ধারণক্ষমতা {room.capacity}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium",
                        roomOccupied === room.seats.length
                          ? "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300"
                          : "border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300"
                      )}
                    >
                      {roomOccupied}/{room.seats.length} বসানো
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                    {room.seats.map((seat) => {
                      const isOccupied = seat.status === "OCCUPIED";
                      return (
                        <AlertDialog
                          key={seat.id}
                          open={pendingToggle?.id === seat.id}
                          onOpenChange={(o) =>
                            setPendingToggle(o ? seat : null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={togglingId === seat.id}
                              title={
                                isOccupied
                                  ? `${seat.seatNumber} — ${seat.memberName ?? "বসানো"}`
                                  : `${seat.seatNumber} — ফাঁকা`
                              }
                              className={cn(
                                "group relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1.5 text-[11px] font-medium transition",
                                isOccupied
                                  ? "border-teal-500/40 bg-teal-500/15 text-teal-700 hover:bg-teal-500/25 dark:text-teal-200"
                                  : "border-dashed border-teal-500/50 bg-teal-500/5 text-teal-600 hover:bg-teal-500/15 dark:text-teal-300"
                              )}
                            >
                              {togglingId === seat.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : isOccupied ? (
                                <CheckCircle2 className="size-3.5" />
                              ) : (
                                <CircleDashed className="size-3.5" />
                              )}
                              <span className="leading-none">
                                {seat.seatNumber}
                              </span>
                              {!isOccupied && (
                                <span className="text-[8px] text-teal-600/70 dark:text-teal-300/70">
                                  অ্যাসাইন
                                </span>
                              )}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                সিট স্ট্যাটাস পরিবর্তন
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {isOccupied
                                  ? `সিট ${seat.seatNumber} (${seat.memberName ?? "বসানো"}) কে ফাঁকা করতে চান? সরাসরি স্ট্যাটাস টগল করলে মেম্বার রেকর্ড আপডেট হবে না — মেম্বারকে সরাতে মেম্বার ট্যাব ব্যবহার করুন।`
                                  : `সিট ${seat.seatNumber} কে "বসানো" হিসেবে চিহ্নিত করতে চান? সাধারণত মেম্বার যোগ করার সময় সিট অটো-বসানো হয়।`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => toggleSeat(seat)}
                                className={cn(
                                  "border-0",
                                  isOccupied
                                    ? "bg-amber-600 text-white hover:bg-amber-700"
                                    : "bg-teal-600 text-white hover:bg-teal-700"
                                )}
                              >
                                নিশ্চিত করুন
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {activeMess.rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            এই মেসে কোনো রুম নেই।
          </p>
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onChanged}
          className="text-muted-foreground"
        >
          <RefreshCw className="size-4" />
          রিফ্রেশ
        </Button>
      </div>
    </motion.div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: "teal" | "amber";
}) {
  return (
    <Card
      className={cn(
        "bg-card shadow-sm",
        highlight === "teal" && "border-teal-500/30",
        highlight === "amber" && "border-amber-500/30"
      )}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            highlight === "teal"
              ? "bg-teal-500/15"
              : highlight === "amber"
                ? "bg-amber-500/15"
                : "bg-muted"
          )}
        >
          {icon}
        </span>
        <div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
