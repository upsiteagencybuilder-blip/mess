import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const where = role ? { role } : {};
    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            messes: true,
            memberships: true,
            bookings: true,
          },
        },
      },
    });

    return Response.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatar: u.avatar,
        createdAt: u.createdAt,
        ownedMesses: u._count.messes,
        memberships: u._count.memberships,
        bookings: u._count.bookings,
      }))
    );
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "FORBIDDEN")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    if (msg === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
