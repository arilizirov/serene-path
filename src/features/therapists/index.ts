// Public surface of the therapists feature — the only entrypoint other modules
// and the app routes may import. Internals (repository, mapper, service impl)
// stay private to this folder.

// Discovery (read).
export { getDiscoverTherapists } from "./service";
export { TherapistCardView } from "./ui/therapist-card";
export type { TherapistCard } from "./types";

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
