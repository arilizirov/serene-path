import { NextResponse } from "next/server";
import { chipIntakeRequestSchema, getIntakeProvider } from "@/features/intake";
import { rateLimit, clientIp } from "./rate-limit";

// POST /api/intake — one anonymous intake turn (APP_SPEC §5; INTAKE_BUILD_SPEC).
// The locale travels in the (validated) body, so this lives OUTSIDE the [locale]
// segment to stay clear of the next-intl middleware (which would rewrite a
// locale-prefixed path).
//
// The flow is selected per-request via the IntakeProvider seam: the body's
// `provider` ("chip" | "api") picks the chip-driven pre-choice intake (this spec,
// the DEFAULT) or the full-LLM conversational flow. The UI's mode toggle sends the
// matching value; both speak the same IntakeTurn, so dispatch is one argument. The
// chip flow's happy path is $0 except the one step-6 call, and the AI flow is fully
// paid, so the IP rate-limit (which guards the paid model call) applies to both.

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
    const result = await getIntakeProvider(parsed.data.provider ?? "chip").handle(parsed.data);
    return NextResponse.json(result);
  } catch {
    // The provider awaits the model + DB + scheduling; on any failure return a clean
    // JSON error (never an opaque framework 500) — the client shows a retry bubble.
    return NextResponse.json({ error: "intake_failed" }, { status: 502 });
  }
}
