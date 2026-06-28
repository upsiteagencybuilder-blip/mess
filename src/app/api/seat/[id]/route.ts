import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { recomputeVacantSeats } from "@/lib/serialize";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["OWNER"]);
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status?: string };

    if (status !== "VACANT" && status !== "OCCUPIED") {
      return Response.json({ error: "status must be VACANT or OCCUPIED" }, { status: 400 });
    }

    const seat = await db.seat.findUnique({
      where: { id },
    });
    if (!seat) return Response.json({ error: "Not found" }, { status: 404 });

    // Seat has no `mess` relation — look up the mess via messId
    const mess = await db.mess.findUnique({
      where: { id: seat.messId },
      select: { ownerId: true },
    });
    if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });
    if (mess.ownerId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.seat.update({
      where: { id },
      data: { status },
    });

    // Recompute mess vacancy counts
    await recomputeVacantSeats(seat.messId);

    return Response.json({
      id: updated.id,
      roomId: updated.roomId,
      messId: updated.messId,
      seatNumber: updated.seatNumber,
      status: updated.status,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
