import { db } from "@/lib/db";
import { requireUser, getCurrentUser, canManageMess } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        member: {
          select: {
            id: true,
            seat: { select: { seatNumber: true, room: { select: { roomNumber: true } } } },
          },
        },
        mess: { select: { id: true, name: true, code: true, ownerId: true } },
      },
    });
    if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });

    const currentUser = await getCurrentUser();
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const isOwner = currentUser.role === "OWNER" && invoice.mess.ownerId === currentUser.id;
    const isStaff = currentUser.role === "STAFF";
    const isSelf = currentUser.id === invoice.userId;
    if (!isOwner && !isStaff && !isSelf) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({
      id: invoice.id,
      messId: invoice.messId,
      messName: invoice.mess.name,
      messCode: invoice.mess.code,
      memberId: invoice.memberId,
      userId: invoice.userId,
      userName: invoice.user.name,
      userPhone: invoice.user.phone,
      userEmail: invoice.user.email,
      seatNumber: invoice.member?.seat?.seatNumber ?? null,
      roomNumber: invoice.member?.seat?.room?.roomNumber ?? null,
      month: invoice.month,
      year: invoice.year,
      rent: invoice.rent,
      electricityShare: invoice.electricityShare,
      gasShare: invoice.gasShare,
      internetShare: invoice.internetShare,
      garbageShare: invoice.garbageShare,
      caretakerShare: invoice.caretakerShare,
      total: invoice.total,
      status: invoice.status,
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt,
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
    const user = await requireUser(["OWNER", "STAFF"]);
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status?: string };

    if (status !== "PAID" && status !== "PENDING") {
      return Response.json({ error: "status must be PAID or PENDING" }, { status: 400 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { mess: { select: { ownerId: true } } },
    });
    if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });
    // OWNER must own the mess; STAFF (collects payments) + ADMIN may update any.
    if (user.role === "OWNER" && !canManageMess(user, invoice.mess.ownerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: { status: string; paidAt?: Date | null } = { status };
    if (status === "PAID" && !invoice.paidAt) {
      data.paidAt = new Date();
    } else if (status === "PENDING") {
      data.paidAt = null;
    }

    const updated = await db.invoice.update({ where: { id }, data });
    return Response.json(updated);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
