import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["OWNER"]);
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status?: string };

    if (status !== "APPROVED" && status !== "REJECTED") {
      return Response.json({ error: "status must be APPROVED or REJECTED" }, { status: 400 });
    }

    const booking = await db.bookingRequest.findUnique({
      where: { id },
      include: { mess: { select: { ownerId: true } } },
    });
    if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
    if (booking.mess.ownerId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.bookingRequest.update({
      where: { id },
      data: { status },
    });

    return Response.json(updated);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
