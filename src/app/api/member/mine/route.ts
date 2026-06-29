import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser(["TENANT"]);

    const members = await db.member.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        mess: {
          select: {
            id: true,
            name: true,
            code: true,
            area: true,
            city: true,
            rentPerSeat: true,
            ownerId: true,
          },
        },
        seat: {
          select: {
            id: true,
            seatNumber: true,
            room: { select: { id: true, roomNumber: true } },
          },
        },
      },
    });

    if (members.length === 0) {
      return Response.json({ member: null });
    }

    return Response.json({
      members: members.map((m) => ({
        id: m.id,
        messId: m.messId,
        messName: m.mess.name,
        messCode: m.mess.code,
        area: m.mess.area,
        city: m.mess.city,
        rentPerSeat: m.mess.rentPerSeat,
        seatId: m.seatId,
        seatNumber: m.seat.seatNumber,
        roomId: m.seat.room.id,
        roomNumber: m.seat.room.roomNumber,
        joinDate: m.joinDate,
        status: m.status,
      })),
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
