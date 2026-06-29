import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = verifyPassword(String(password), user.password);
    if (!ok) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession(user.id);
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
