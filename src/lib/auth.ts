import { db } from "./db";
import { cookies } from "next/headers";
import crypto from "crypto";

// Simple scrypt-based password hashing (no external deps)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
}

// Simple signed session token: base64(userId).signature
const SESSION_SECRET = process.env.SESSION_SECRET || "mess-platform-secret-key-2026";

function sign(payload: string): string {
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  return Buffer.from(payload, "base64url").toString("utf8");
}

export async function createSession(userId: string) {
  const payload = Buffer.from(userId, "utf8").toString("base64url");
  const token = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set("mess_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("mess_session");
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mess_session")?.value;
    if (!token) return null;
    const userId = verifyToken(token);
    if (!userId) return null;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, role: true, avatar: true },
    });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(roles?: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (roles && !roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
