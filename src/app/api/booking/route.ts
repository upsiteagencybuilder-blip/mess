import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["OWNER", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const messId = searchParams.get("messId");
    const status = searchParams.get("status");

    // Get messes owned by this user
    const ownedMesses = await db.mess.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
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
    const { messId, name, phone, message } = body as {
      messId?: string;
      name?: string;
      phone?: string;
      message?: string;
    };

    if (!messId || !name || !phone) {
      return Response.json({ error: "messId, name, phone are required" }, { status: 400 });
    }

    const mess = await db.mess.findUnique({ where: { id: messId }, select: { id: true } });
    if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });

    const booking = await db.bookingRequest.create({
      data: {
        messId,
        userId: currentUser?.id ?? null,
        name: String(name),
        phone: String(phone),
        message: message ? String(message) : null,
        status: "PENDING",
      },
    });

    return Response.json(booking);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
