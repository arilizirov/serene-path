// Video vendor adapter (APP_SPEC §10, F7). The platform defines its own
// VideoProvider interface; a real SDK (LiveKit / Jitsi) lives ONLY behind this
// adapter and is a gated §12 decision — until it's locked, the implementation is
// a stub. Callers (the sessions feature) issue room credentials through this
// seam and never touch a provider SDK.

export type VideoRole = "CLIENT" | "THERAPIST";

/** What a participant needs to join a room. With a real provider, `token` is a
 *  short-lived client join credential (meant to be handed to that one client). */
export type VideoCredentials = {
  provider: string;
  roomName: string;
  token: string;
  identity: string;
  role: VideoRole;
};

export interface VideoProvider {
  /** Idempotent: create-or-get the room. */
  createRoom(roomName: string): Promise<{ roomName: string }>;
  /** A join token scoped to one identity + room. */
  issueToken(
    roomName: string,
    identity: string,
    role: VideoRole,
  ): Promise<string>;
}

// Dev stub — NO real provider is wired. The room name is deterministic from the
// appointment; the token is a clearly-fake, non-functional placeholder so nothing
// downstream mistakes it for a live credential. Swap this object for a LiveKit /
// Jitsi implementation when the decision lands — callers don't change.
const stubProvider: VideoProvider = {
  async createRoom(roomName) {
    return { roomName };
  },
  async issueToken(roomName, identity, role) {
    return `stub-token.${roomName}.${identity}.${role}`;
  },
};

export function videoProvider(): VideoProvider {
  return stubProvider;
}

/** Deterministic room name for an appointment — same appointment → same room,
 *  so the two parties land in the SAME room. */
export function roomNameForAppointment(appointmentId: string): string {
  return `appt-${appointmentId}`;
}

/**
 * Create-or-get the appointment's room and mint a join credential for one
 * participant. Access control (who/when) is the caller's responsibility — this
 * only mints once that's decided.
 */
export async function issueRoomCredentials(
  appointmentId: string,
  identity: string,
  role: VideoRole,
): Promise<VideoCredentials> {
  const provider = videoProvider();
  const roomName = roomNameForAppointment(appointmentId);
  await provider.createRoom(roomName);
  const token = await provider.issueToken(roomName, identity, role);
  return { provider: "stub", roomName, token, identity, role };
}
