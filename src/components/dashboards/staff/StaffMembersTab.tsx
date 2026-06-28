"use client";

import { motion } from "framer-motion";
import {
  Users,
  Phone,
  Mail,
  BedDouble,
  DoorOpen,
  Inbox,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StaffMember } from "./StaffDashboard";

export default function StaffMembersTab({
  members,
}: {
  members: StaffMember[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="border-teal-500/15 bg-card shadow-sm">
        <CardHeader className="gap-2 border-b pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
                <Users className="size-4.5 text-teal-600" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base leading-tight text-foreground">
                  সক্রিয় মেম্বার
                </CardTitle>
                <CardDescription className="text-xs">
                  মোট {members.length} জন মেম্বার বর্তমানে যুক্ত
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="gap-1 border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-300"
            >
              <UserPlus className="size-3" />
              শুধু পরিদর্শন
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/5">
                <Inbox className="size-5 text-teal-500" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  এই মেসে এখনো কোনো মেম্বার নেই।
                </span>
                <span className="text-xs text-muted-foreground">
                  মালিক মেম্বার যোগ করলে এখানে দেখা যাবে।
                </span>
              </div>
            </div>
          ) : (
            <div className="staff-scroll max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="pl-6 text-xs">নাম</TableHead>
                    <TableHead className="text-xs">যোগাযোগ</TableHead>
                    <TableHead className="text-xs">সিট / রুম</TableHead>
                    <TableHead className="text-xs">যোগদান</TableHead>
                    <TableHead className="pr-6 text-xs">স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="pl-6 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                            {m.name
                              .split(" ")
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {m.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        {m.phone ? (
                          <a
                            href={`tel:${m.phone}`}
                            className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:underline dark:text-teal-300"
                          >
                            <Phone className="size-3.5" />
                            {m.phone}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3.5" />
                            ফোন নেই
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                            <BedDouble className="size-3.5 text-teal-500" />
                            {m.seatNumber ?? "—"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <DoorOpen className="size-3" />
                            রুম {m.roomNumber ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground">
                        {new Date(m.joinDate).toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="pr-6 py-2.5">
                        <Badge
                          className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        >
                          সক্রিয়
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
