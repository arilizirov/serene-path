import { getAppointmentForParty } from "@/features/scheduling";
import { issueRoomCredentials, type VideoCredentials } from "@/server/video";

// A participant may enter the room from this many minutes before the start, and
// up to the scheduled end. (F7: the room is time-gated.)
const JOIN_EARLY_MINUTES = 10;

export type JoinResult =
  | {
      ok: true;
      credentials: VideoCredentials;
      startIso: string;
      endIso: string;
    }
  | { ok: false; reason: "not_found" | "too_early" | "ended" };

/**
 * Resolve a join for one user into an appointment's video room. Two gates, both
 * required:
 *  1. ownership — getAppointmentForParty is owner-scoped (the user must be the
 *     appointment's client or therapist; no other id is trusted), so a stranger
 *     or a forged id yields `not_found`.
 *  2. time — only within [start − JOIN_EARLY_MINUTES, end].
 * Only when both pass are room credentials minted (via the VideoProvider seam).
 * The user id comes from the caller's SESSION, never from client input.
 */
export async function joinSession(
  appointmentId: string,
  userId: string,
): Promise<JoinResult> {
  const appt = await getAppointmentForParty(appointmentId, userId);
  if (!appt) return { ok: false, reason: "not_found" };

  const now = Date.now();
  const start = new Date(appt.startIso).getTime();
  const end = new Date(appt.endIso).getTime();
  if (now < start - JOIN_EARLY_MINUTES * 60_000) {
    return { ok: false, reason: "too_early" };
  }
  if (now > end) return { ok: false, reason: "ended" };

  const credentials = await issueRoomCredentials(appt.id, userId, appt.party);
  return { ok: true, credentials, startIso: appt.startIso, endIso: appt.endIso };
}
