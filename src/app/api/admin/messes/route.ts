import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJSON } from "@/lib/api-client";

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
    const area = searchParams.get("area");
    const type = searchParams.get("type");

    const where: { area?: string; type?: string } = {};
    if (area) where.area = area;
    if (type) where.type = type;

    const messes = await db.mess.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        _count: {
          select: { members: true, bookings: true },
        },
      },
    });

    return Response.json(
      messes.map((m) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        type: m.type,
        area: m.area,
        city: m.city,
        address: m.address,
        rentPerSeat: m.rentPerSeat,
        totalSeats: m.totalSeats,
        vacantSeats: m.vacantSeats,
        occupiedSeats: m.totalSeats - m.vacantSeats,
        totalRooms: m.totalRooms,
        amenities: parseJSON<string[]>(m.amenities, []),
        photos: parseJSON<string[]>(m.photos, []),
        contactNumber: m.contactNumber,
        createdAt: m.createdAt,
        owner: m.owner,
        memberCount: m._count.members,
        bookingCount: m._count.bookings,
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
