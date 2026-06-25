import type { IntakeEngine } from "./types";

// Pure intake-stats aggregation helpers (Phase 2). No DB, no I/O — the repository
// supplies the raw rows and these reduce them, so the math is unit-testable
// without a database. Keeping the engine sniff here (rather than in the page)
// mirrors repository.engineFromConstraints and keeps the page a thin renderer.

/** The engine recorded for a session, sniffed from its stored `constraints` blob:
 *  an explicit `engine`, or a `flow` blob (the chip-driven deterministic engine),
 *  else null (never chosen). Same rule as the conversations read model. */
export function engineOf(constraints: unknown): IntakeEngine | null {
  const c =
    (constraints as { engine?: IntakeEngine; flow?: unknown } | null) ?? null;
  if (c?.engine) return c.engine;
  if (c?.flow) return "scripted";
  return null;
}

/** Tally sessions by engine across their `constraints` blobs. Sessions with no
 *  engine are counted under "none" so the breakdown always sums to the total. */
export function tallyEngines(
  rows: { constraints: unknown }[],
): { ai: number; scripted: number; none: number } {
  const out = { ai: 0, scripted: 0, none: 0 };
  for (const r of rows) {
    const e = engineOf(r.constraints);
    if (e === "ai") out.ai += 1;
    else if (e === "scripted") out.scripted += 1;
    else out.none += 1;
  }
  return out;
}

/** Match rate = matched / total, as a 0..1 fraction (0 when there are no
 *  sessions, never NaN). "Matched" = sessions with ≥1 suggested therapist. */
export function matchRate(matched: number, total: number): number {
  if (total <= 0) return 0;
  return matched / total;
}
