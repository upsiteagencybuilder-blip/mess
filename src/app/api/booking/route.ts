import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["OWNER", "STAFF", "TENANT"]);
    const { searchParams } = new URL(request.url);
    const messId = searchParams.get("messId");
    const status = searchParams.get("status");

    // TENANT: return only their own booking requests
    if (user.role === "TENANT") {
      const where: Prisma.BookingRequestWhereInput = { userId: user.id };
      if (status) where.status = status;
      const bookings = await db.bookingRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { mess: { select: { name: true, code: true, area: true, city: true, rentPerSeat: true } } },
      });
      return Response.json(
        bookings.map((b) => ({
          id: b.id,
          messId: b.messId,
          messName: b.mess.name,
          messCode: b.mess.code,
          messArea: b.mess.area,
          messCity: b.mess.city,
          rentPerSeat: b.mess.rentPerSeat,
          userId: b.userId,
          name: b.name,
          phone: b.phone,
          message: b.message,
          status: b.status,
          createdAt: b.createdAt,
        }))
      );
    }

    // OWNER / STAFF: return bookings for their messes
    const ownedMesses =
      user.role === "OWNER"
        ? await db.mess.findMany({
            where: { ownerId: user.id },
            select: { id: true },
          })
        : await db.mess.findMany({ select: { id: true } });

    const ownedIds = ownedMesses.map((m) => m.id);

    if (ownedIds.length === 0) {
      return Response.json([]);
    }

    const andClauses: Prisma.BookingRequestWhereInput[] = [
      { messId: { in: ownedIds } },
    ];
    if (messId) andClauses.push({ messId });
    if (status) andClauses.push({ status });

    const where: Prisma.BookingRequestWhereInput = { AND: andClauses };

    const bookings = await db.bookingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { mess: { select: { name: true, code: true } } },
    });

    return Response.json(
      bookings.map((b) => ({
        id: b.id,
        messId: b.messId,
        messName: b.mess.name,
        messCode: b.mess.code,
        userId: b.userId,
        name: b.name,
        phone: b.phone,
        message: b.message,
        status: b.status,
        createdAt: b.createdAt,
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
    // Logged-in user is optional (public booking). If present, attach userId.
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { messId, name, phone, message, seatId } = body as {
      messId?: string;
      name?: string;
      phone?: string;
      message?: string;
      seatId?: string;
    };

    if (!messId || !name || !phone) {
      return Response.json({ error: "messId, name, phone are required" }, { status: 400 });
    }

    const mess = await db.mess.findUnique({ where: { id: messId }, select: { id: true } });
    if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });

    // If seatId provided, validate it belongs to the mess and is vacant
    let seatInfo = "";
    if (seatId) {
      const seat = await db.seat.findUnique({
        where: { id: seatId },
        include: { room: { select: { roomNumber: true } } },
      });
      if (seat && seat.messId === messId && seat.status === "VACANT") {
        seatInfo = `[অনুরোধকৃত সিট: ${seat.room.roomNumber} - ${seat.seatNumber}]`;
      }
    }

    // Combine seat info with user message
    const fullMessage = [seatInfo, message ? String(message) : ""]
      .filter(Boolean)
      .join(" ");

    const booking = await db.bookingRequest.create({
      data: {
        messId,
        userId: currentUser?.id ?? null,
        name: String(name),
        phone: String(phone),
        message: fullMessage || null,
        status: "PENDING",
      },
    });

    return Response.json(booking);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
