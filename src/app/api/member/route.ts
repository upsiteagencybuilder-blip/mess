import { db } from "@/lib/db";
import { requireUser, hashPassword, canManageMess } from "@/lib/auth";
import { recomputeVacantSeats } from "@/lib/serialize";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["OWNER", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const messId = searchParams.get("messId");

    if (!messId) {
      return Response.json({ error: "messId query param required" }, { status: 400 });
    }

    // OWNER must own the mess; STAFF + ADMIN may view any.
    if (user.role === "OWNER") {
      const mess = await db.mess.findUnique({
        where: { id: messId },
        select: { ownerId: true },
      });
      if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });
      if (!canManageMess(user, mess.ownerId)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const members = await db.member.findMany({
      where: { messId, status: "ACTIVE" },
      orderBy: { joinDate: "desc" },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        seat: {
          select: { id: true, seatNumber: true, room: { select: { id: true, roomNumber: true } } },
        },
      },
    });

    return Response.json(
      members.map((m) => ({
        id: m.id,
        messId: m.messId,
        userId: m.userId,
        name: m.user.name,
        phone: m.user.phone,
        email: m.user.email,
        seatId: m.seatId,
        seatNumber: m.seat.seatNumber,
        roomId: m.seat.room.id,
        roomNumber: m.seat.room.roomNumber,
        joinDate: m.joinDate,
        status: m.status,
      }))
    );
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["OWNER"]);
    const body = await request.json();
    const { messId, seatId, name, email, phone, password } = body as {
      messId?: string;
      seatId?: string;
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!messId || !seatId || !name || !email) {
      return Response.json(
        { error: "messId, seatId, name, email are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const mess = await db.mess.findUnique({
      where: { id: messId },
      select: { ownerId: true },
    });
    if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });
    if (!canManageMess(user, mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify seat belongs to mess and is vacant
    const seat = await db.seat.findUnique({
      where: { id: seatId },
      include: { room: { select: { id: true } } },
    });
    if (!seat || seat.messId !== messId) {
      return Response.json({ error: "Seat does not belong to this mess" }, { status: 400 });
    }
    if (seat.status !== "VACANT") {
      return Response.json({ error: "Seat is already occupied" }, { status: 400 });
    }

    // Find or create user
    const normalizedEmail = String(email).toLowerCase().trim();
    let dbUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!dbUser) {
      const pass = password ? String(password) : "123456";
      dbUser = await db.user.create({
        data: {
          name: String(name),
          email: normalizedEmail,
          password: hashPassword(pass),
          phone: phone ? String(phone) : null,
          role: "TENANT",
        },
      });
    }

    // Create member, occupy seat, recompute vacant
    const member = await db.member.create({
      data: {
        messId,
        userId: dbUser.id,
        seatId,
        status: "ACTIVE",
      },
    });

    await db.seat.update({ where: { id: seatId }, data: { status: "OCCUPIED" } });
    await recomputeVacantSeats(messId);

    return Response.json(member);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
