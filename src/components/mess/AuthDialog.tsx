"use client";

import { useEffect, useState } from "react";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ROLES, roleLabel } from "@/lib/constants";
import { useAppStore, type SessionUser } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

interface AuthResponse {
  user?: SessionUser;
  message?: string;
  error?: string;
}

const DEMO_ACCOUNTS = [
  { email: "rahim@mess.com", label: "মালিক (Owner)" },
  { email: "tanvir@tenant.com", label: "সিট অন্বেষণকারী (Tenant)" },
  { email: "staff@mess.com", label: "স্টাফ (Staff)" },
];
const DEMO_PASS = "123456";

export default function AuthDialog() {
  const open = useAppStore((s) => s.authOpen);
  const mode = useAppStore((s) => s.authMode);
  const setAuthOpen = useAppStore((s) => s.setAuthOpen);
  const setUser = useAppStore((s) => s.setUser);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();

  // Local form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("TENANT");
  const [submitting, setSubmitting] = useState(false);

  // Reset form whenever dialog toggles or mode changes
  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("TENANT");
    }
  }, [open, mode]);

  const switchMode = (m: "login" | "register") => {
    setAuthOpen(true, m);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) setAuthOpen(false);
  };

  const afterAuthSuccess = (u: SessionUser) => {
    setUser(u);
    setAuthOpen(false);
    // Only navigate to dashboard if on landing.
    // If on mess-detail, stay there so user can complete booking.
    const currentView = useAppStore.getState().view;
    if (currentView === "landing") {
      setView(
        u.role === "OWNER"
          ? "owner-dashboard"
          : u.role === "STAFF"
            ? "staff-dashboard"
            : "tenant-dashboard"
      );
    }
    toast({
      title: `স্বাগতম, ${u.name}!`,
      description: `${roleLabel(u.role)} হিসেবে লগইন সম্পন্ন।`,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Basic client-side validation
    if (!email.trim() || !password) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "ইমেইল ও পাসওয়ার্ড প্রয়োজন",
        variant: "destructive",
      });
      return;
    }
    if (mode === "register" && (!name.trim() || !phone.trim())) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "নাম ও ফোন নম্বর প্রয়োজন",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email: email.trim(), password }
          : {
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              password,
              role,
            };

      const res = await apiFetch<AuthResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Prefer the user returned by the auth endpoint; fall back to /api/auth/me
      if (res.user) {
        afterAuthSuccess(res.user);
      } else {
        const meRes = await apiFetch<{ user: SessionUser }>("/api/auth/me");
        afterAuthSuccess(meRes.user);
      }
    } catch (err) {
      toast({
        title: mode === "login" ? "লগইন ব্যর্থ" : "রেজিস্ট্রেশন ব্যর্থ",
        description: err instanceof Error ? err.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const quickFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASS);
    if (mode !== "login") setAuthOpen(true, "login");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {/* Header band */}
        <div className="bg-gradient-to-br from-[#0a1420] via-[#0f1623] to-[#0a1420] p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/15">
            <ShieldCheck className="size-6 text-teal-400" />
          </div>
          <DialogTitle className="text-lg font-bold text-white">
            {mode === "login" ? "লগইন করুন" : "নতুন অ্যাকাউন্ট"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-teal-200/70">
            {mode === "login"
              ? "আপনার অ্যাকাউন্টে প্রবেশ করুন"
              : "MessFinder BD তে যোগ দিন"}
          </DialogDescription>
        </div>

        {/* Mode toggle */}
        <div className="px-6 pt-4">
          <Tabs
            value={mode}
            onValueChange={(v) => switchMode(v as "login" | "register")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-1.5">
                <LogIn className="size-3.5" />
                লগইন
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1.5">
                <UserPlus className="size-3.5" />
                রেজিস্টার
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
          {mode === "register" && (
            <>
              <Field
                id="reg-name"
                label="পুরো নাম"
                icon={<User className="size-4" />}
              >
                <Input
                  id="reg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম"
                  autoComplete="name"
                  className="pl-9"
                />
              </Field>

              <Field
                id="reg-phone"
                label="ফোন নম্বর"
                icon={<Phone className="size-4" />}
              >
                <Input
                  id="reg-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  autoComplete="tel"
                  className="pl-9"
                />
              </Field>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-role" className="text-xs">
                  ভূমিকা
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="reg-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Field
            id="auth-email"
            label="ইমেইল"
            icon={<Mail className="size-4" />}
          >
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-9"
            />
          </Field>

          <Field
            id="auth-pass"
            label="পাসওয়ার্ড"
            icon={<Lock className="size-4" />}
          >
            <Input
              id="auth-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="pl-9"
            />
          </Field>

          <Button
            type="submit"
            disabled={submitting}
            className="mt-2 h-11 w-full bg-teal-600 text-white hover:bg-teal-700"
          >
            {submitting ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                প্রসেসিং...
              </>
            ) : mode === "login" ? (
              <>
                <LogIn className="size-4" />
                লগইন করুন
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                রেজিস্টার করুন
              </>
            )}
          </Button>
        </form>

        {/* Demo accounts */}
        <div className="border-t bg-muted/30 px-6 py-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-teal-500" />
            ডেমো অ্যাকাউন্ট (পাসওয়ার্ড: {DEMO_PASS})
          </div>
          <div className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => quickFillDemo(d.email)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-left transition",
                  "hover:border-teal-500/40 hover:bg-teal-500/5"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {d.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {d.email}
                  </span>
                </div>
                <span className="shrink-0 rounded-md bg-teal-500/10 px-2 py-1 text-[10px] font-medium text-teal-700 dark:text-teal-300">
                  ব্যবহার করুন
                </span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
