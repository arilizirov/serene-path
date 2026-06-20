import { z } from "zod";

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

// Verification lifecycle (matches Prisma's TherapistStatus enum).
export const therapistStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "VERIFIED",
  "SUSPENDED",
]);
export type TherapistStatusValue = z.infer<typeof therapistStatusSchema>;
