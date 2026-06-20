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

// Availability rules editing.
export { getAvailabilityRules } from "./service";
export { AvailabilityEditor } from "./ui/availability-editor";
export type { AvailabilityRuleInput } from "./schema";

// Scheduling read-model (consumed by the scheduling feature).
export { getSchedulingContext } from "./service";
export type { SchedulingContext } from "./service";

// Verification.
export { setStatusAction } from "./actions";
