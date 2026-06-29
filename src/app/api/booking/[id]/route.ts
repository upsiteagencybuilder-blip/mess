import { db } from "@/lib/db";
import { requireUser, canManageMess } from "@/lib/auth";
import { recomputeVacantSeats } from "@/lib/serialize";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["OWNER"]);
    const { id } = await params;
    const body = await request.json();
    const { status, seatId } = body as { status?: string; seatId?: string };

    if (status !== "APPROVED" && status !== "REJECTED") {
      return Response.json(
        { error: "status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const booking = await db.bookingRequest.findUnique({
      where: { id },
      include: { mess: { select: { ownerId: true } } },
    });
    if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
    if (!canManageMess(user, booking.mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.bookingRequest.update({
      where: { id },
      data: { status },
    });

    // On APPROVED with a seatId + a linked tenant user, auto-assign the seat.
    if (status === "APPROVED" && booking.userId && seatId) {
      const seat = await db.seat.findUnique({
        where: { id: seatId },
        select: { id: true, messId: true, status: true },
      });
      if (seat && seat.messId === booking.messId && seat.status === "VACANT") {
        // Check no existing active membership for this user in this mess
        const existing = await db.member.findFirst({
          where: { userId: booking.userId, messId: booking.messId, status: "ACTIVE" },
        });
        if (!existing) {
          await db.member.create({
            data: {
              messId: booking.messId,
              userId: booking.userId,
              seatId: seat.id,
              joinDate: new Date(),
            },
          });
          await db.seat.update({
            where: { id: seat.id },
            data: { status: "OCCUPIED" },
          });
          await recomputeVacantSeats(booking.messId);
        }
      }
    }

    return Response.json(updated);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
