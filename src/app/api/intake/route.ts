import { NextResponse } from "next/server";
import { chipIntakeRequestSchema, runChipTurn } from "@/features/intake";
import { rateLimit, clientIp } from "./rate-limit";

// POST /api/intake — one anonymous intake turn (APP_SPEC §5). The locale travels
// in the (validated) body, so this lives OUTSIDE the [locale] segment to stay
// clear of the next-intl middleware (which would rewrite a locale-prefixed path).
//
// Anonymous by design (no auth) — F1 intake precedes sign-in. Each turn makes a
// paid model call, so we IP-rate-limit to stop a loop draining the key.
export async function POST(request: Request): Promise<Response> {
  const gate = rateLimit(clientIp(request), Date.now());
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = chipIntakeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const result = await runChipTurn(parsed.data);
    return NextResponse.json(result);
  } catch {
    // The engine awaits the model + DB + scheduling; on any failure return a clean
    // JSON error (never an opaque framework 500) — the client shows a retry bubble.
    return NextResponse.json({ error: "intake_failed" }, { status: 502 });
  }
}
