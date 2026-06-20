/** Public contract: a therapist as shown on a discovery card. */
export type TherapistCard = {
  id: string;
  name: string;
  title: string;
  tagline: string;
  skills: string[];
};

/** A weekly availability slot, times as HH:MM. */
export type AvailabilitySlot = { weekday: number; start: string; end: string };

/** Public contract: the full therapist profile page (verified therapists only). */
export type TherapistProfileView = {
  id: string;
  name: string;
  title: string;
  bio: string;
  skills: string[];
  modalities: string[];
  languages: string[];
  credentials: string | null;
  photoUrl: string | null;
  sessionPrice: number;
  rating: number;
  reviewCount: number;
  availability: AvailabilitySlot[];
};
