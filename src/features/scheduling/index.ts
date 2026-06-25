// Public surface of the scheduling feature — the read-only availability engine.
// Transactional booking (subtracting exceptions + existing appointments) lands
// in Stage 6; today this exposes the next-available computation that intake
// matching uses to attach a real slot to each proposed therapist (APP_SPEC §9).

export {
  getNextAvailable,
  getBookableSlots,
  createBooking,
  getMyAppointments,
  cancelAppointment,
  getAppointmentForParty,
} from "./service";
export type {
  BookingResult,
  MyAppointment,
  AppointmentParty,
} from "./service";
export { computeNextAvailable } from "./next-available";
export type { WeeklySlot } from "./next-available";
export { generateSlots } from "./generate-slots";
export type { SlotRule } from "./generate-slots";

// Admin (Phase 2) — all-therapist schedule overview, appointment management,
// and DB-derived counts. The admin-scoped status writes are gated by
// requireRole("ADMIN") in the app-layer action; the service just runs the query.
export {
  getAllTherapistsSchedules,
  getAllAppointments,
  countAllAppointments,
  getAppointmentStatusCounts,
  adminSetStatus,
} from "./service";
export type { TherapistSchedule, AdminAppointment } from "./service";
export { appointmentStatusSchema } from "./schema";
export type { AppointmentStatusValue } from "./schema";
