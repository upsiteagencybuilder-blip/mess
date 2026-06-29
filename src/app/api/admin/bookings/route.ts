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
    const status = searchParams.get("status");

    const where = status ? { status } : {};
    const bookings = await db.bookingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        mess: {
          select: { id: true, name: true, code: true, area: true, city: true },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return Response.json(
      bookings.map((b) => ({
        id: b.id,
        messId: b.messId,
        messName: b.mess.name,
        messCode: b.mess.code,
        messArea: b.mess.area,
        messCity: b.mess.city,
        userId: b.userId,
        userName: b.user?.name ?? b.name,
        userEmail: b.user?.email ?? null,
        name: b.name,
        phone: b.phone,
        message: b.message,
        status: b.status,
        createdAt: b.createdAt,
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
