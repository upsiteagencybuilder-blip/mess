import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatar } = body as {
      name?: string;
      phone?: string;
      avatar?: string;
    };

    const data: { name?: string; phone?: string | null; avatar?: string | null } = {};
    if (name && name.trim()) data.name = name.trim();
    if (phone !== undefined) data.phone = phone.trim() || null;
    if (avatar !== undefined) data.avatar = avatar.trim() || null;

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true, avatar: true },
    });

    return Response.json({ user: updated });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
