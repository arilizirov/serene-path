import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/accounts";
import { sendMessage, sendMessageSchema } from "@/features/messaging";

// POST /api/messaging/send — send a message as the signed-in user. The sender is
// the session id (never the body); the recipient + body are validated here and
// the send is gated in the service by a shared appointment (403 if not).
export async function POST(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const res = await sendMessage(user.id, parsed.data);
  if (!res.ok) {
    return NextResponse.json(
      { error: res.error },
      { status: res.error === "not_allowed" ? 403 : 400 },
    );
  }
  return NextResponse.json({ message: res.message });
}
