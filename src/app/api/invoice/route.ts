import { db } from "@/lib/db";
import { requireUser, canManageMess } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["OWNER", "STAFF", "TENANT"]);
    const { searchParams } = new URL(request.url);
    const messId = searchParams.get("messId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (user.role === "TENANT") {
      // Return only own invoices
      const where: { userId: string; month?: number; year?: number } = { userId: user.id };
      if (month) where.month = Number(month);
      if (year) where.year = Number(year);
      const invoices = await db.invoice.findMany({
        where,
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: {
          mess: { select: { id: true, name: true, code: true } },
          member: {
            select: {
              seat: { select: { seatNumber: true, room: { select: { roomNumber: true } } } },
            },
          },
        },
      });
      return Response.json(
        invoices.map((inv) => ({
          id: inv.id,
          messId: inv.messId,
          memberId: inv.memberId,
          userId: inv.userId,
          month: inv.month,
          year: inv.year,
          rent: inv.rent,
          electricityShare: inv.electricityShare,
          gasShare: inv.gasShare,
          internetShare: inv.internetShare,
          garbageShare: inv.garbageShare,
          caretakerShare: inv.caretakerShare,
          total: inv.total,
          status: inv.status,
          createdAt: inv.createdAt,
          paidAt: inv.paidAt,
          messName: inv.mess.name,
          messCode: inv.mess.code,
          seatNumber: inv.member?.seat?.seatNumber ?? null,
          roomNumber: inv.member?.seat?.room?.roomNumber ?? null,
        }))
      );
    }

    // OWNER / STAFF
    if (!messId) {
      return Response.json({ error: "messId query param required" }, { status: 400 });
    }
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

    const where: { messId: string; month?: number; year?: number } = { messId };
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const invoices = await db.invoice.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        member: {
          select: {
            id: true,
            seat: { select: { seatNumber: true, room: { select: { roomNumber: true } } } },
          },
        },
      },
    });

    return Response.json(
      invoices.map((inv) => ({
        id: inv.id,
        messId: inv.messId,
        memberId: inv.memberId,
        userId: inv.userId,
        month: inv.month,
        year: inv.year,
        rent: inv.rent,
        electricityShare: inv.electricityShare,
        gasShare: inv.gasShare,
        internetShare: inv.internetShare,
        garbageShare: inv.garbageShare,
        caretakerShare: inv.caretakerShare,
        total: inv.total,
        status: inv.status,
        createdAt: inv.createdAt,
        paidAt: inv.paidAt,
        userName: inv.user.name,
        userPhone: inv.user.phone,
        seatNumber: inv.member?.seat?.seatNumber ?? null,
        roomNumber: inv.member?.seat?.room?.roomNumber ?? null,
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
    const { messId, month, year } = body as {
      messId?: string;
      month?: number;
      year?: number;
    };

    if (!messId || !month || !year) {
      return Response.json({ error: "messId, month, year are required" }, { status: 400 });
    }

    const m = Number(month);
    const y = Number(year);

    const mess = await db.mess.findUnique({
      where: { id: messId },
      select: { ownerId: true, rentPerSeat: true },
    });
    if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });
    if (!canManageMess(user, mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Need utility bill first
    const utility = await db.utilityBill.findUnique({
      where: { messId_month_year: { messId, month: m, year: y } },
    });
    if (!utility) {
      return Response.json(
        { error: "Utility bill for this month/year not found. Create utility bill first." },
        { status: 404 }
      );
    }

    const members = await db.member.findMany({
      where: { messId, status: "ACTIVE" },
    });

    if (members.length === 0) {
      return Response.json({ generated: 0, invoices: [] });
    }

    const memberCount = members.length;
    const share = (n: number) => Math.ceil(n / memberCount);
    const electricityShare = share(utility.electricity);
    const gasShare = share(utility.gas);
    const internetShare = share(utility.internet);
    const garbageShare = share(utility.garbage);
    const caretakerShare = share(utility.caretaker);

    const rent = mess.rentPerSeat;
    const total =
      rent + electricityShare + gasShare + internetShare + garbageShare + caretakerShare;

    const created: unknown[] = [];
    for (const member of members) {
      const inv = await db.invoice.upsert({
        where: { memberId_month_year: { memberId: member.id, month: m, year: y } },
        create: {
          messId,
          memberId: member.id,
          userId: member.userId,
          month: m,
          year: y,
          rent,
          electricityShare,
          gasShare,
          internetShare,
          garbageShare,
          caretakerShare,
          total,
          status: "PENDING",
        },
        update: {
          rent,
          electricityShare,
          gasShare,
          internetShare,
          garbageShare,
          caretakerShare,
          total,
        },
      });
      created.push(inv);
    }

    return Response.json({ generated: created.length, invoices: created });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
