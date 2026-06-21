import { NextResponse } from "next/server";
import { intakeRequestSchema, runIntakeTurn } from "@/features/intake";

// POST /api/intake — one anonymous intake turn (APP_SPEC §5). The locale travels
// in the (validated) body, so this lives OUTSIDE the [locale] segment to stay
// clear of the next-intl middleware (which would rewrite a locale-prefixed path).
//
// Anonymous by design (no auth) — F1 intake precedes sign-in. Abuse/rate-limiting
// is a Stage-9 hardening concern, noted there.
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = intakeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const result = await runIntakeTurn(parsed.data);
    return NextResponse.json(result);
  } catch {
    // The engine awaits the model + DB + scheduling; on any failure return a clean
    // JSON error (never an opaque framework 500) — the client shows a retry bubble.
    return NextResponse.json({ error: "intake_failed" }, { status: 502 });
  }
}
