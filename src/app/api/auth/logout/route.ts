import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
