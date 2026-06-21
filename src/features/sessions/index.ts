// Public surface of the sessions feature (F7 — per-appointment video room).
// Access to a room is owner-scoped + time-gated here; the actual video transport
// is the server/video VideoProvider (stubbed until the §12 decision lands).
export { joinSession } from "./service";
export type { JoinResult } from "./service";
