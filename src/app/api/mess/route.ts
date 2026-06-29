import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { serializeMess } from "@/lib/serialize";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get("area");
    const type = searchParams.get("type");
    const minRent = searchParams.get("minRent");
    const maxRent = searchParams.get("maxRent");
    const q = searchParams.get("q");
    const amenitiesParam = searchParams.get("amenities");
    const includeFull = searchParams.get("includeFull") === "true";

    const andClauses: Prisma.MessWhereInput[] = [];
    if (!includeFull) andClauses.push({ vacantSeats: { gt: 0 } });
    if (area) andClauses.push({ area: { equals: area } });
    if (type) andClauses.push({ type: { equals: type } });
    if (minRent) andClauses.push({ rentPerSeat: { gte: Number(minRent) } });
    if (maxRent) andClauses.push({ rentPerSeat: { lte: Number(maxRent) } });
    if (q) {
      andClauses.push({
        OR: [
          { name: { contains: q } },
          { area: { contains: q } },
          { city: { contains: q } },
          { address: { contains: q } },
        ],
      });
    }

    const where: Prisma.MessWhereInput = { AND: andClauses };

    const messes = await db.mess.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { vacantSeats: "desc" },
    });

    let result = messes.map(serializeMess);

    // Filter by amenities in-memory (JSON stored as string)
    if (amenitiesParam) {
      const wanted = amenitiesParam.split(",").map((a) => a.trim()).filter(Boolean);
      if (wanted.length > 0) {
        result = result.filter((m) => wanted.every((w) => m.amenities.includes(w)));
      }
    }

    return Response.json(result);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["OWNER"]);
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
      totalRooms,
      perRoomSeats,
    } = body as {
      name?: string;
      description?: string;
      type?: string;
      address?: string;
      area?: string;
      city?: string;
      lat?: number;
      lng?: number;
      rentPerSeat?: number;
      contactNumber?: string;
      photos?: string[];
      amenities?: string[];
      totalRooms?: number;
      perRoomSeats?: number;
    };

    if (!name || !address || !area || !city || !contactNumber || !rentPerSeat) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rooms = Math.max(1, Number(totalRooms ?? 1));
    const perRoom = Math.max(1, Number(perRoomSeats ?? 2));
    const seatsCount = rooms * perRoom;

    // Generate unique code
    const existing = await db.mess.findMany({ select: { code: true } });
    let maxN = 0;
    for (const m of existing) {
      const match = m.code.match(/^MESS-(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxN) maxN = n;
      }
    }
    const nextN = maxN + 1;
    const code = `MESS-${String(nextN).padStart(3, "0")}`;

    const photosArr = Array.isArray(photos) ? photos.filter(Boolean) : [];
    const amenitiesArr = Array.isArray(amenities) ? amenities.filter(Boolean) : [];

    const mess = await db.mess.create({
      data: {
        code,
        name: String(name).trim(),
        description: description ? String(description) : null,
        ownerId: user.id,
        type: type || "STUDENT_MALE",
        address: String(address),
        area: String(area),
        city: String(city),
        lat: Number(lat ?? 0),
        lng: Number(lng ?? 0),
        rentPerSeat: Number(rentPerSeat),
        contactNumber: String(contactNumber),
        photos: JSON.stringify(photosArr),
        amenities: JSON.stringify(amenitiesArr),
        totalRooms: rooms,
        totalSeats: seatsCount,
        vacantSeats: seatsCount,
      },
    });

    // Create rooms + seats in a transaction (Seat requires explicit messId)
    await db.$transaction(async (tx) => {
      for (let i = 0; i < rooms; i++) {
        const room = await tx.room.create({
          data: {
            messId: mess.id,
            roomNumber: `R${i + 1}`,
            capacity: perRoom,
          },
        });
        await tx.seat.createMany({
          data: Array.from({ length: perRoom }).map((_, j) => ({
            messId: mess.id,
            roomId: room.id,
            seatNumber: `R${i + 1}-S${j + 1}`,
            status: "VACANT",
          })),
        });
      }
    });

    const fullMess = await db.mess.findUnique({
      where: { id: mess.id },
      include: {
        owner: { select: { id: true, name: true } },
        rooms: { include: { seats: true }, orderBy: { roomNumber: "asc" } },
      },
    });

    return Response.json({
      ...serializeMess(fullMess!),
      rooms: fullMess!.rooms,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
