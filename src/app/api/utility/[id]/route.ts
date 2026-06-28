import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(["OWNER"]);
    const { id } = await params;

    const bill = await db.utilityBill.findUnique({
      where: { id },
      include: { mess: { select: { ownerId: true } } },
    });
    if (!bill) return Response.json({ error: "Not found" }, { status: 404 });
    if (bill.mess.ownerId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.utilityBill.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
