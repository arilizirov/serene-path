import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/accounts";
import { getThreads } from "@/features/messaging";

// GET /api/messaging/threads — the signed-in user's conversation list (one row
// per other party, with last message + unread count). Outside [locale] so the
// next-intl middleware doesn't rewrite it; the session cookie carries identity.
export async function GET(): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const threads = await getThreads(user.id);
  return NextResponse.json({ threads });
}
