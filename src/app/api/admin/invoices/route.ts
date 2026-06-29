import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};
    const invoices = await db.invoice.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        mess: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, phone: true } },
        member: {
          select: {
            seat: {
              select: { seatNumber: true, room: { select: { roomNumber: true } } },
            },
          },
        },
      },
    });

    return Response.json(
      invoices.map((inv) => ({
        id: inv.id,
        messId: inv.messId,
        messName: inv.mess.name,
        messCode: inv.mess.code,
        userId: inv.userId,
        userName: inv.user.name,
        userPhone: inv.user.phone,
        seatNumber: inv.member?.seat?.seatNumber ?? null,
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
      }))
    );
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "FORBIDDEN")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    if (msg === "UNAUTHORIZED")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
