import { z } from "zod";
import { isIsoDate } from "./exceptions";

// Validation contract for authoring a therapist (APP_SPEC §8 / §11: validate at
// the boundary). The admin action parses untrusted form input through this.
const localizedText = z.object({
  en: z.string().min(1),
  he: z.string().min(1),
  fr: z.string().min(1),
});

export const therapistInputSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  title: z.string().min(1),
  bio: localizedText,
  skills: z.array(z.string().min(1)).min(1),
  modalities: z.array(z.string().min(1)).min(1),
  languages: z.array(z.string().min(1)).min(1),
  credentials: z.string().optional(),
  photoUrl: z.url().optional(),
  // Form fields arrive as strings; coerce, then require a positive amount.
  sessionPrice: z.coerce.number().positive(),
});

export type TherapistInput = z.infer<typeof therapistInputSchema>;

// A weekly availability rule, as edited in the admin UI (times as HH:MM).
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

export const availabilityRuleSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    start: time,
    end: time,
  })
  .refine((r) => r.start < r.end, {
    message: "End must be after start",
    path: ["end"],
  });

export const availabilityRulesSchema = z.array(availabilityRuleSchema);
export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;

// A blocked date (availability exception): a whole-day block as YYYY-MM-DD.
// Partial-day blocks (startMinute/endMinute on the model) are deferred.
export const availabilityExceptionSchema = z.object({
  date: z.string().refine(isIsoDate, "Use a real calendar date (YYYY-MM-DD)"),
});
export type AvailabilityExceptionInput = z.infer<
  typeof availabilityExceptionSchema
>;

// Verification lifecycle (matches Prisma's TherapistStatus enum).
export const therapistStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "VERIFIED",
  "SUSPENDED",
]);
export type TherapistStatusValue = z.infer<typeof therapistStatusSchema>;

// Therapist self-signup (Stage 5): account fields + a starting title. The full
// profile is completed in the dashboard before requesting verification. The
// password rule mirrors accounts' registration (bcrypt truncates beyond 72
// BYTES; TextEncoder keeps it runtime-portable).
export const therapistSignupSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .refine(
      (p) => new TextEncoder().encode(p).length <= 72,
      "Password is too long",
    ),
});
export type TherapistSignupInput = z.infer<typeof therapistSignupSchema>;
