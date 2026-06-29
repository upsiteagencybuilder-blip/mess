import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["OWNER"]);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const messIdQuery = searchParams.get("messId");

    // Determine target mess(es)
    let targetMessIds: string[] = [];
    if (messIdQuery) {
      targetMessIds = [messIdQuery];
    } else if (id && id !== "all") {
      targetMessIds = [id];
    }

    // If no specific mess, aggregate across all messes owned by user
    // (ADMIN gets all messes on the platform)
    if (targetMessIds.length === 0) {
      const owned = await db.mess.findMany({
        where: user.role === "ADMIN" ? {} : { ownerId: user.id },
        select: { id: true },
      });
      targetMessIds = owned.map((m) => m.id);
    }

    // Validate ownership (ADMIN can access any mess's stats)
    if (targetMessIds.length > 0) {
      const where =
        user.role === "ADMIN"
          ? { id: { in: targetMessIds } }
          : { id: { in: targetMessIds }, ownerId: user.id };
      const owned = await db.mess.findMany({
        where,
        select: { id: true },
      });
      if (owned.length === 0) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      targetMessIds = owned.map((m) => m.id);
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const totalSeatsRow = await db.mess.aggregate({
      where: { id: { in: targetMessIds } },
      _sum: { totalSeats: true, vacantSeats: true },
    });

    const totalSeats = totalSeatsRow._sum.totalSeats ?? 0;
    const vacantSeats = totalSeatsRow._sum.vacantSeats ?? 0;
    const occupiedSeats = totalSeats - vacantSeats;

    const activeMembers = await db.member.count({
      where: { messId: { in: targetMessIds }, status: "ACTIVE" },
    });

    const pendingBookings = await db.bookingRequest.count({
      where: { messId: { in: targetMessIds }, status: "PENDING" },
    });

    // Current month invoices
    const monthInvoices = await db.invoice.findMany({
      where: { messId: { in: targetMessIds }, month, year },
      select: { total: true, status: true },
    });
    const totalBilled = monthInvoices.reduce((s, i) => s + i.total, 0);
    const totalCollected = monthInvoices
      .filter((i) => i.status === "PAID")
      .reduce((s, i) => s + i.total, 0);
    const outstanding = monthInvoices
      .filter((i) => i.status === "PENDING")
      .reduce((s, i) => s + i.total, 0);

    // Last 6 months revenue
    const months: { month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }
    const revenue = await Promise.all(
      months.map(async (m) => {
        const inv = await db.invoice.findMany({
          where: { messId: { in: targetMessIds }, month: m.month, year: m.year },
          select: { total: true, status: true },
        });
        return {
          month: m.month,
          year: m.year,
          collected: inv.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0),
          outstanding: inv
            .filter((i) => i.status === "PENDING")
            .reduce((s, i) => s + i.total, 0),
        };
      })
    );

    // Current month utility bill (if exists, for single-mess only)
    let currentUtility: unknown = null;
    if (targetMessIds.length === 1) {
      currentUtility = await db.utilityBill.findUnique({
        where: {
          messId_month_year: {
            messId: targetMessIds[0],
            month,
            year,
          },
        },
      });
    }

    return Response.json({
      messIds: targetMessIds,
      totalSeats,
      vacantSeats,
      occupiedSeats,
      activeMembers,
      pendingBookings,
      month,
      year,
      totalBilled,
      totalCollected,
      outstanding,
      revenue,
      currentUtility,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
