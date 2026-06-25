// Pure parsing/validation for the admin "download selected" route's `?ids=a,b,c`
// query. Kept tiny and DB-free so it's unit-testable, and so the route boundary
// never issues an unbounded `id: { in: [...] }` query: split → trim → drop empties
// → dedupe (preserving first-seen order) → reject empty → cap the count.

/** Hard ceiling on how many transcript ids one request may select. */
export const MAX_SELECTED_IDS = 500;

export type ParseIdsResult =
  | { ok: true; ids: string[] }
  | { ok: false; error: string };

/**
 * Parse the raw `ids` query value (comma-separated) into a validated id list.
 * `null`/`undefined` (param absent) is treated as empty. Returns `ok: false`
 * with a message when the result is empty or exceeds {@link MAX_SELECTED_IDS}.
 */
export function parseSelectedIds(
  raw: string | null | undefined,
): ParseIdsResult {
  const ids = Array.from(
    new Set(
      (raw ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  );
  if (ids.length === 0) {
    return { ok: false, error: "No conversation ids selected." };
  }
  if (ids.length > MAX_SELECTED_IDS) {
    return {
      ok: false,
      error: `Too many conversations selected (max ${MAX_SELECTED_IDS}).`,
    };
  }
  return { ok: true, ids };
}
