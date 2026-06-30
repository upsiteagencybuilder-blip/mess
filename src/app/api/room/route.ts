import { db } from "@/lib/db";
import { requireUser, canMutateMess } from "@/lib/auth";
import { recomputeVacantSeats } from "@/lib/serialize";

// POST: Add a room (with seats) to an existing mess
export async function POST(request: Request) {
  try {
    const user = await requireUser(["OWNER"]);
    const body = await request.json();
    const { messId, roomNumber, capacity } = body as {
      messId?: string;
      roomNumber?: string;
      capacity?: number;
    };

    if (!messId || !roomNumber || !capacity) {
      return Response.json(
        { error: "messId, roomNumber, capacity are required" },
        { status: 400 }
      );
    }

    const mess = await db.mess.findUnique({
      where: { id: messId },
      select: { ownerId: true, totalRooms: true, totalSeats: true },
    });
    if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });
    if (!canMutateMess(user, mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const cap = Number(capacity);
    if (cap < 1 || cap > 10) {
      return Response.json(
        { error: "Capacity must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Create room
    const room = await db.room.create({
      data: {
        messId,
        roomNumber: String(roomNumber).trim(),
        capacity: cap,
      },
    });

    // Create seats for the room
    const seatPromises = [];
    for (let i = 1; i <= cap; i++) {
      const seatNumber = `R${room.roomNumber}-S${i}`.replace(/\s/g, "");
      seatPromises.push(
        db.seat.create({
          data: {
            roomId: room.id,
            messId,
            seatNumber,
            status: "VACANT",
          },
        })
      );
    }
    await Promise.all(seatPromises);

    // Update mess totals
    await db.mess.update({
      where: { id: messId },
      data: {
        totalRooms: mess.totalRooms + 1,
        totalSeats: mess.totalSeats + cap,
      },
    });
    await recomputeVacantSeats(messId);

    return Response.json({
      id: room.id,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      messId: room.messId,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
