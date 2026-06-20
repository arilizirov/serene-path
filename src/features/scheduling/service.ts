import { getSchedulingContext } from "@/features/therapists";
import { computeNextAvailable } from "./next-available";

/**
 * The next available slot start for a therapist, at or after `fromIso`, as a
 * UTC ISO-8601 string. Null if the therapist has no rules (or doesn't exist).
 *
 * This is the only sanctioned source of a proposed appointment time: callers
 * (e.g. intake matching) resolve real slots here rather than letting the model
 * invent them (APP_SPEC §5).
 */
export async function getNextAvailable(
  therapistId: string,
  fromIso: string,
): Promise<string | null> {
  const ctx = await getSchedulingContext(therapistId);
  if (!ctx) return null;
  return computeNextAvailable(ctx.rules, ctx.timezone, fromIso);
}
