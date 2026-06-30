import { db } from "@/lib/db";
import { requireUser, canMutateMess } from "@/lib/auth";
import { recomputeVacantSeats } from "@/lib/serialize";

// DELETE: Remove a room (and all its seats) from a mess
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["OWNER"]);
    const { id } = await params;

    const room = await db.room.findUnique({
      where: { id },
      include: {
        mess: { select: { ownerId: true, id: true, totalRooms: true, totalSeats: true } },
        seats: { select: { id: true, status: true } },
      },
    });
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    if (!canMutateMess(user, room.mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow deleting a room that has occupied seats
    const hasOccupied = room.seats.some((s) => s.status === "OCCUPIED");
    if (hasOccupied) {
      return Response.json(
        { error: "এই রুমে বসবাসরত মেম্বার আছে। প্রথমে মেম্বারদের অন্য রুমে সরান বা মেস ছাড়ান।" },
        { status: 400 }
      );
    }

    const seatCount = room.seats.length;

    // Delete room (cascades to seats)
    await db.room.delete({ where: { id } });

    // Update mess totals
    await db.mess.update({
      where: { id: room.mess.id },
      data: {
        totalRooms: Math.max(0, room.mess.totalRooms - 1),
        totalSeats: Math.max(0, room.mess.totalSeats - seatCount),
      },
    });
    await recomputeVacantSeats(room.mess.id);

    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
