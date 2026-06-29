import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Require ADMIN role — returns user or throws. */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Counts by role
    const usersByRole = await db.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });
    const roleCounts: Record<string, number> = {};
    usersByRole.forEach((r) => {
      roleCounts[r.role] = r._count._all;
    });
    const totalUsers = Object.values(roleCounts).reduce((a, b) => a + b, 0);

    // Messes
    const totalMesses = await db.mess.count();
    const messAgg = await db.mess.aggregate({
      _sum: { totalSeats: true, vacantSeats: true },
    });
    const totalSeats = messAgg._sum.totalSeats ?? 0;
    const vacantSeats = messAgg._sum.vacantSeats ?? 0;
    const occupiedSeats = totalSeats - vacantSeats;

    // Messes by type
    const messesByType = await db.mess.groupBy({
      by: ["type"],
      _count: { _all: true },
    });
    const typeCounts: Record<string, number> = {};
    messesByType.forEach((t) => {
      typeCounts[t.type] = t._count._all;
    });

    // Bookings
    const totalBookings = await db.bookingRequest.count();
    const pendingBookings = await db.bookingRequest.count({
      where: { status: "PENDING" },
    });
    const approvedBookings = await db.bookingRequest.count({
      where: { status: "APPROVED" },
    });

    // Members
    const activeMembers = await db.member.count({
      where: { status: "ACTIVE" },
    });

    // Invoices — this month
    const monthInvoices = await db.invoice.findMany({
      where: { month, year },
      select: { total: true, status: true },
    });
    const totalBilled = monthInvoices.reduce((s, i) => s + i.total, 0);
    const totalCollected = monthInvoices
      .filter((i) => i.status === "PAID")
      .reduce((s, i) => s + i.total, 0);
    const outstanding = monthInvoices
      .filter((i) => i.status === "PENDING")
      .reduce((s, i) => s + i.total, 0);

    // All-time revenue (paid invoices)
    const allPaidInvoices = await db.invoice.findMany({
      where: { status: "PAID" },
      select: { total: true },
    });
    const totalRevenueAllTime = allPaidInvoices.reduce(
      (s, i) => s + i.total,
      0
    );

    // Last 6 months revenue
    const months: { month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }
    const revenue = await Promise.all(
      months.map(async (m) => {
        const inv = await db.invoice.findMany({
          where: { month: m.month, year: m.year },
          select: { total: true, status: true },
        });
        return {
          month: m.month,
          year: m.year,
          collected: inv
            .filter((i) => i.status === "PAID")
            .reduce((s, i) => s + i.total, 0),
          outstanding: inv
            .filter((i) => i.status === "PENDING")
            .reduce((s, i) => s + i.total, 0),
        };
      })
    );

    // User growth (last 6 months) — cumulative user count
    const userGrowth = await Promise.all(
      months.map(async (m) => {
        const endOfMonth = new Date(m.year, m.month, 0, 23, 59, 59);
        const count = await db.user.count({
          where: { createdAt: { lte: endOfMonth } },
        });
        return { month: m.month, year: m.year, users: count };
      })
    );

    // Recent users (last 5)
    const recentUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    // Recent bookings (last 5)
    const recentBookings = await db.bookingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        mess: { select: { name: true, code: true } },
      },
    });

    return Response.json({
      totalUsers,
      roleCounts,
      totalMesses,
      totalSeats,
      vacantSeats,
      occupiedSeats,
      occupancyRate: totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0,
      typeCounts,
      totalBookings,
      pendingBookings,
      approvedBookings,
      activeMembers,
      month,
      year,
      totalBilled,
      totalCollected,
      outstanding,
      totalRevenueAllTime,
      revenue,
      userGrowth,
      recentUsers,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        messName: b.mess.name,
        messCode: b.mess.code,
        name: b.name,
        phone: b.phone,
        status: b.status,
        createdAt: b.createdAt,
      })),
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "FORBIDDEN")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    if (msg === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
