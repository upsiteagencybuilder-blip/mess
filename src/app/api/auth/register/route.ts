import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      role?: string;
    };

    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const validRoles = ["TENANT", "OWNER", "STAFF"];
    const finalRole = validRoles.includes(role as string) ? (role as string) : "TENANT";

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashed = hashPassword(String(password));
    const user = await db.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashed,
        phone: phone ? String(phone) : null,
        role: finalRole,
      },
      select: { id: true, email: true, name: true, phone: true, role: true, avatar: true },
    });

    await createSession(user.id);
    return Response.json({ user });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
