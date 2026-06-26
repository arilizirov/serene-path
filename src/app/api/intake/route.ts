import { NextResponse } from "next/server";
import { intakeTurnRequestSchema, getIntakeProvider } from "@/features/intake";
import { rateLimit, clientIp } from "./rate-limit";

// POST /api/intake — one anonymous intake turn (APP_SPEC §5; INTAKE_BUILD_SPEC §5).
// The locale travels in the (validated) body, so this lives OUTSIDE the [locale]
// segment to stay clear of the next-intl middleware (which would rewrite a
// locale-prefixed path).
//
// ONE live flow behind the IntakeProvider seam: the prompted conversation → fit form
// → deterministic match. A turn carries free text (a probe answer), a chip tap (its
// id), or a persistent secondary action. The happy path is ~2 probes + the one
// mirror/confirm model call (the fit form + match are $0), and the IP rate-limit
// guards the paid model calls.

export async function POST(request: Request): Promise<Response> {
  const gate = rateLimit(clientIp(request), Date.now());
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = intakeTurnRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const result = await getIntakeProvider().handle(parsed.data);
    return NextResponse.json(result);
  } catch {
    // The provider awaits the model + DB + scheduling; on any failure return a clean
    // JSON error (never an opaque framework 500) — the client shows a retry bubble.
    return NextResponse.json({ error: "intake_failed" }, { status: 502 });
  }
}
