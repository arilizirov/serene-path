// Public surface of the scheduling feature — the read-only availability engine.
// Transactional booking (subtracting exceptions + existing appointments) lands
// in Stage 6; today this exposes the next-available computation that intake
// matching uses to attach a real slot to each proposed therapist (APP_SPEC §9).

export { getNextAvailable, getBookableSlots } from "./service";
export { computeNextAvailable } from "./next-available";
export type { WeeklySlot } from "./next-available";
export { generateSlots } from "./generate-slots";
export type { SlotRule } from "./generate-slots";
