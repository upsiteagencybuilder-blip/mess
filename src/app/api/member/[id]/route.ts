import { db } from "@/lib/db";
import { requireUser, getCurrentUser, canManageMess } from "@/lib/auth";
import { recomputeVacantSeats } from "@/lib/serialize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await db.member.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        seat: {
          select: {
            id: true,
            seatNumber: true,
            room: { select: { id: true, roomNumber: true } },
          },
        },
        mess: { select: { id: true, name: true, code: true, ownerId: true } },
      },
    });
    if (!member) return Response.json({ error: "Not found" }, { status: 404 });

    // Allow OWNER (must own mess), STAFF, or the member's own user
    const currentUser = await getCurrentUser();
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const isOwner = currentUser.role === "OWNER" && member.mess.ownerId === currentUser.id;
    const isStaff = currentUser.role === "STAFF";
    const isSelf = currentUser.id === member.userId;
    if (!isOwner && !isStaff && !isSelf) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({
      id: member.id,
      messId: member.messId,
      messName: member.mess.name,
      messCode: member.mess.code,
      userId: member.userId,
      name: member.user.name,
      phone: member.user.phone,
      email: member.user.email,
      seatId: member.seatId,
      seatNumber: member.seat.seatNumber,
      roomId: member.seat.room.id,
      roomNumber: member.seat.room.roomNumber,
      joinDate: member.joinDate,
      leaveDate: member.leaveDate,
      status: member.status,
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
    const body = await request.json();
    const { status } = body as { status?: string };

    const member = await db.member.findUnique({
      where: { id },
      include: { mess: { select: { ownerId: true, id: true } } },
    });
    if (!member) return Response.json({ error: "Not found" }, { status: 404 });
    if (!canManageMess(user, member.mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (status === "LEFT") {
      const updated = await db.member.update({
        where: { id },
        data: { status: "LEFT", leaveDate: new Date() },
      });
      await db.seat.update({
        where: { id: member.seatId },
        data: { status: "VACANT" },
      });
      await recomputeVacantSeats(member.mess.id);
      return Response.json(updated);
    }

    return Response.json({ error: "Only status=LEFT is supported" }, { status: 400 });
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
    const member = await db.member.findUnique({
      where: { id },
      include: { mess: { select: { ownerId: true, id: true } } },
    });
    if (!member) return Response.json({ error: "Not found" }, { status: 404 });
    if (!canManageMess(user, member.mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const messId = member.mess.id;
    const seatId = member.seatId;
    await db.member.delete({ where: { id } });
    // Free seat (if not already)
    await db.seat.updateMany({
      where: { id: seatId, status: "OCCUPIED" },
      data: { status: "VACANT" },
    });
    await recomputeVacantSeats(messId);

    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
