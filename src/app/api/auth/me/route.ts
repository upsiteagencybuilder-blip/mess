import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ user });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
