import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { serializeMess } from "@/lib/serialize";

/**
 * For an OWNER, return all messes they own (MessListItem shape).
 * For TENANT/STAFF, return 403.
 *
 * The [id] in the path is ignored (kept for route structure consistency);
 * we resolve ownership from the authenticated user.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    void params; // ignored
    const user = await requireUser(["OWNER"]);
    const messes = await db.mess.findMany({
      where: { ownerId: user.id },
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(messes.map(serializeMess));
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: msg }, { status: 500 });
  }
}
