import { db } from "@/lib/db";
import { requireUser, canManageMess } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["OWNER", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const messId = searchParams.get("messId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

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

    const where: { messId: string; month?: number; year?: number } = { messId };
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const bills = await db.utilityBill.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return Response.json(bills);
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
    const {
      messId,
      month,
      year,
      electricity,
      gas,
      internet,
      garbage,
      caretaker,
    } = body as {
      messId?: string;
      month?: number;
      year?: number;
      electricity?: number;
      gas?: number;
      internet?: number;
      garbage?: number;
      caretaker?: number;
    };

    if (!messId || !month || !year) {
      return Response.json({ error: "messId, month, year are required" }, { status: 400 });
    }

    const mess = await db.mess.findUnique({
      where: { id: messId },
      select: { ownerId: true },
    });
    if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });
    if (!canManageMess(user, mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const m = Number(month);
    const y = Number(year);

    const data = {
      electricity: Number(electricity ?? 0),
      gas: Number(gas ?? 0),
      internet: Number(internet ?? 0),
      garbage: Number(garbage ?? 0),
      caretaker: Number(caretaker ?? 0),
    };

    const bill = await db.utilityBill.upsert({
      where: { messId_month_year: { messId, month: m, year: y } },
      create: { messId, month: m, year: y, ...data },
      update: data,
    });

    return Response.json(bill);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
