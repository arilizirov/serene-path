// Public surface of the therapists feature — the only entrypoint other modules
// and the app routes may import. Internals (repository, mapper, service impl)
// stay private to this folder.
export { getDiscoverTherapists } from "./service";
export { TherapistCardView } from "./ui/therapist-card";
export type { TherapistCard } from "./types";
