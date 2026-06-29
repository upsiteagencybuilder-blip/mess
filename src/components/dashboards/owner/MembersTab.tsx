"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  Phone,
  Mail,
  DoorOpen,
  CalendarDays,
  LogOut,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { apiFetch, type MessDetail } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  messId: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  seatId: string;
  seatNumber: string;
  roomId: string;
  roomNumber: string;
  joinDate: string | null;
  status: string;
}

interface MembersTabProps {
  activeMess: MessDetail | null;
  refreshKey: number;
  onChanged: () => void;
}

export default function MembersTab({
  activeMess,
  refreshKey,
  onChanged,
}: MembersTabProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!activeMess) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Member[]>(
        `/api/member?messId=${activeMess.id}`
      );
      setMembers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "মেম্বার লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [activeMess]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers, refreshKey]);

  const handleLeave = async (member: Member) => {
    setLeavingId(member.id);
    try {
      await apiFetch(`/api/member/${member.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "LEFT" }),
      });
      toast({
        title: "মেম্বার মেস ছেড়েছে",
        description: `${member.name} এর সিট ফাঁকা করা হয়েছে।`,
      });
      onChanged();
      void fetchMembers();
    } catch (e) {
      toast({
        title: "ব্যর্থ",
        description: e instanceof Error ? e.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setLeavingId(null);
    }
  };

  if (!activeMess) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center text-sm text-muted-foreground">
        কোনো মেস নির্বাচিত নেই।
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-teal-500" />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              মেম্বার তালিকা
            </h2>
            <p className="text-xs text-muted-foreground">
              মোট {members.length} জন সক্রিয় মেম্বার
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchMembers()}
          >
            <RefreshCw className="size-4" />
            রিফ্রেশ
          </Button>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            <UserPlus className="size-4" />
            মেম্বার যোগ করুন
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMembers}>
            আবার চেষ্টা করুন
          </Button>
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <Users className="size-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              এই মেসে এখনও কোনো মেম্বার নেই
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              ফাঁকা সিটে মেম্বার অ্যাসাইন করতে "মেম্বার যোগ করুন" বাটনে ক্লিক করুন।
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            <UserPlus className="size-4" />
            প্রথম মেম্বার যোগ করুন
          </Button>
        </div>
      ) : (
        <Card className="bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="min-w-32">নাম</TableHead>
                    <TableHead className="min-w-32">যোগাযোগ</TableHead>
                    <TableHead className="min-w-28">রুম / সিট</TableHead>
                    <TableHead className="min-w-32">যোগ দেওয়ার তারিখ</TableHead>
                    <TableHead className="min-w-24">স্ট্যাটাস</TableHead>
                    <TableHead className="min-w-32 text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {m.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${m.phone}`}
                          className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:underline dark:text-teal-300"
                        >
                          <Phone className="size-3.5" />
                          {m.phone || "—"}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <DoorOpen className="size-3.5 text-muted-foreground" />
                          {m.roomNumber} · {m.seatNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          {m.joinDate
                            ? new Date(m.joinDate).toLocaleDateString("bn-BD", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300"
                          )}
                        >
                          সক্রিয়
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={leavingId === m.id}
                              className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                            >
                              {leavingId === m.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <LogOut className="size-4" />
                              )}
                              মেস ছাড়ান
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                মেম্বার মেস ছাড়বেন?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                <span className="font-medium text-foreground">
                                  {m.name}
                                </span>
                                -কে এই মেস থেকে সরানো হবে। সিট{" "}
                                {m.seatNumber} ফাঁকা হবে। এই কাজটি ফিরিয়ে আনা যাবে না।
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => void handleLeave(m)}
                                className="border-0 bg-rose-600 text-white hover:bg-rose-700"
                              >
                                নিশ্চিত করুন
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        activeMess={activeMess}
        onAdded={() => {
          onChanged();
          void fetchMembers();
        }}
      />
    </motion.div>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  activeMess,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  activeMess: MessDetail;
  onAdded: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [seatId, setSeatId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setSeatId("");
    }
  }, [open]);

  // Group vacant seats by room
  const vacantByRoom = activeMess.rooms
    .map((r) => ({
      room: r,
      seats: r.seats.filter((s) => s.status === "VACANT"),
    }))
    .filter((g) => g.seats.length > 0);

  const totalVacant = vacantByRoom.reduce(
    (sum, g) => sum + g.seats.length,
    0
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !seatId) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "সব ঘর ও সিট নির্বাচন করুন",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiFetch<Member>("/api/member", {
        method: "POST",
        body: JSON.stringify({
          messId: activeMess.id,
          seatId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });
      toast({
        title: "মেম্বার যোগ হয়েছে",
        description: `${created.name} সিট ${created.seatNumber} এ যোগ দিয়েছেন।`,
      });
      onOpenChange(false);
      onAdded();
    } catch (err) {
      toast({
        title: "যোগ করা যায়নি",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b bg-gradient-to-br from-[#0a1420] to-[#0f1623] p-5">
          <DialogTitle className="flex items-center gap-2 text-base text-white">
            <UserPlus className="size-4 text-teal-300" />
            নতুন মেম্বার যোগ করুন
          </DialogTitle>
          <DialogDescription className="text-xs text-teal-200/70">
            ফাঁকা সিটে মেম্বার অ্যাসাইন করুন। নতুন ইমেইল হলে TENANT অ্যাকাউন্ট তৈরি হবে।
          </DialogDescription>
        </DialogHeader>

        {totalVacant === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-amber-500" />
            <p className="text-sm font-medium text-foreground">
              কোনো ফাঁকা সিট নেই
            </p>
            <p className="text-xs text-muted-foreground">
              প্রথমে একটি সিট ফাঁকা করুন অথবা রুম/সিট ট্যাব থেকে স্ট্যাটাস পরিবর্তন করুন।
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mem-seat" className="text-xs">
                সিট নির্বাচন করুন <span className="text-destructive">*</span>
              </Label>
              <Select value={seatId} onValueChange={setSeatId}>
                <SelectTrigger id="mem-seat" className="w-full">
                  <SelectValue placeholder="ফাঁকা সিট বাছুন" />
                </SelectTrigger>
                <SelectContent>
                  {vacantByRoom.map((g) => (
                    <SelectGroup key={g.room.id}>
                      <SelectLabel>রুম {g.room.roomNumber}</SelectLabel>
                      {g.seats.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          সিট {s.seatNumber}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                মোট ফাঁকা সিট: {totalVacant}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="mem-name" className="text-xs">
                  পুরো নাম <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mem-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="মেম্বারের নাম"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mem-email" className="text-xs">
                  ইমেইল <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mem-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mem-phone" className="text-xs">
                  ফোন <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mem-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="mem-pass" className="text-xs">
                  পাসওয়ার্ড <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mem-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="নতুন বা বিদ্যমান অ্যাকাউন্টের পাসওয়ার্ড"
                />
                <p className="text-[10px] text-muted-foreground">
                  <Mail className="mr-1 inline size-3" />
                  এই ইমেইল বিদ্যমান থাকলে পাসওয়ার্ড উপেক্ষা করা হবে।
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    যোগ করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    মেম্বার যোগ করুন
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
