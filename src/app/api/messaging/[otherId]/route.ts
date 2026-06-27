import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/accounts";
import { getThread } from "@/features/messaging";

// GET /api/messaging/[otherId]?since=ISO — the thread between the signed-in user
// and `otherId`, oldest-first; `since` returns only newer rows (3s polling).
// Gated in the service by a shared appointment (403 if not). Fetching also marks
// the incoming messages read.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ otherId: string }> },
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { otherId } = await params;
  const since = new URL(request.url).searchParams.get("since") ?? undefined;
  const res = await getThread(user.id, otherId, since);
  if (!res.ok) {
    return NextResponse.json(
      { error: res.error },
      { status: res.error === "not_allowed" ? 403 : 400 },
    );
  }
  return NextResponse.json({ messages: res.messages });
}
