import { db } from "@/lib/db";
import { requireUser, canMutateMess } from "@/lib/auth";
import { serializeMess } from "@/lib/serialize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mess = await db.mess.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        rooms: {
          orderBy: { roomNumber: "asc" },
          include: {
            seats: {
              orderBy: { seatNumber: "asc" },
              include: {
                member: {
                  include: { user: { select: { name: true } } },
                },
              },
            },
          },
        },
        bookings: { where: { status: "PENDING" }, select: { id: true } },
      },
    });

    if (!mess) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const base = serializeMess(mess);
    return Response.json({
      ...base,
      rooms: mess.rooms.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        capacity: r.capacity,
        seats: r.seats.map((s) => ({
          id: s.id,
          seatNumber: s.seatNumber,
          status: s.status,
          memberName: s.member?.user?.name ?? null,
        })),
      })),
      bookingsCount: mess.bookings.length,
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["OWNER"]);
    const { id } = await params;
    const mess = await db.mess.findUnique({ where: { id }, select: { ownerId: true } });
    if (!mess) return Response.json({ error: "Not found" }, { status: 404 });
    if (!canMutateMess(user, mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      address,
      area,
      city,
      lat,
      lng,
      rentPerSeat,
      contactNumber,
      photos,
      amenities,
    } = body as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    if (typeof name === "string") data.name = name;
    if (description !== undefined) data.description = description ? String(description) : null;
    if (typeof type === "string") data.type = type;
    if (typeof address === "string") data.address = address;
    if (typeof area === "string") data.area = area;
    if (typeof city === "string") data.city = city;
    if (lat !== undefined) data.lat = Number(lat);
    if (lng !== undefined) data.lng = Number(lng);
    if (rentPerSeat !== undefined) data.rentPerSeat = Number(rentPerSeat);
    if (typeof contactNumber === "string") data.contactNumber = contactNumber;
    if (Array.isArray(photos)) data.photos = JSON.stringify(photos.filter(Boolean));
    if (Array.isArray(amenities)) data.amenities = JSON.stringify(amenities.filter(Boolean));

    const updated = await db.mess.update({
      where: { id },
      data,
      include: { owner: { select: { id: true, name: true } } },
    });

    return Response.json(serializeMess(updated));
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["OWNER"]);
    const { id } = await params;
    const mess = await db.mess.findUnique({ where: { id }, select: { ownerId: true } });
    if (!mess) return Response.json({ error: "Not found" }, { status: 404 });
    if (!canMutateMess(user, mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    await db.mess.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
