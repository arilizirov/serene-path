// Public surface of the therapists feature — the only entrypoint other modules
// and the app routes may import. Internals (repository, mapper, service impl)
// stay private to this folder.

// Discovery (read).
export {
  getDiscoverTherapists,
  getTherapistProfile,
  searchTherapists,
} from "./service";
export { TherapistCardView } from "./ui/therapist-card";
export type { TherapistCard, TherapistProfileView } from "./types";

// Admin authoring (write/read).
export {
  createTherapist,
  updateTherapist,
  listTherapistsForAdmin,
  getTherapistForEdit,
} from "./service";
export type { AdminTherapistRow, TherapistForEdit } from "./service";
export { therapistInputSchema } from "./schema";
export type { TherapistInput } from "./schema";
export { TherapistForm } from "./ui/therapist-form";

// Therapist self-onboarding (Stage 5).
export { selfRegisterTherapist } from "./service";
export type { SelfRegisterResult } from "./service";
export { therapistSignupSchema } from "./schema";
export type { TherapistSignupInput } from "./schema";

// Therapist dashboard — own profile (owner-scoped) + completeness.
export { getMyProfileForEdit } from "./service";
export {
  saveMyProfileAction,
  saveMyAvailabilityAction,
  requestVerificationAction,
} from "./actions";
export { profileCompleteness } from "./completeness";
export type { Completeness } from "./completeness";

// Availability rules editing.
export { getAvailabilityRules } from "./service";
export { AvailabilityEditor } from "./ui/availability-editor";
export type { AvailabilityRuleInput } from "./schema";

// Blocked-date editing (whole-day availability exceptions).
export { getBlockedDates } from "./service";
export { BlockedDatesEditor } from "./ui/blocked-dates-editor";

// Scheduling read-model (consumed by the scheduling feature).
export { getSchedulingContext } from "./service";
export type { SchedulingContext } from "./service";

// AI matching catalog (consumed by the intake feature) — no prices/availability.
export { getMatchingCatalog } from "./service";
export type { CatalogEntry } from "./service";

// Verification.
export { setStatusAction } from "./actions";
