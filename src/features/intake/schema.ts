import { z } from "zod";

/** Inbound request to the intake endpoint (§5). Validated at the route boundary. */
export const intakeRequestSchema = z.object({
  sessionId: z.string().min(1).optional(),
  message: z.string().min(1).max(4000),
  locale: z.enum(["he", "en", "fr"]),
});
export type IntakeRequestInput = z.infer<typeof intakeRequestSchema>;

const STATES = [
  "GREETING",
  "GATHER",
  "MIRROR",
  "CONFIRM",
  "MATCH",
  "CLARIFY",
  "PRESENT_OPTIONS",
  "FOLLOWUP",
] as const;

/**
 * The model's raw output (§5) — UNTRUSTED. The service validates with this and
 * then enforces its own rules on top (matches only in MATCH/PRESENT_OPTIONS,
 * unknown therapist ids dropped, nextAvailable always server-resolved). `matches`
 * is tolerated-but-defaulted so a model that omits it doesn't fail the turn.
 */
export const modelOutputSchema = z.object({
  state: z.enum(STATES),
  reply: z.string().min(1),
  matches: z
    .array(
      z.object({
        therapist_id: z.string().min(1),
        rationale: z.string().min(1),
      }),
    )
    // Defensive cap on untrusted output — independent of the provider's
    // max-output-tokens. The service further filters to catalog ids + dedupes.
    .max(20)
    .default([]),
});
export type ModelOutput = z.infer<typeof modelOutputSchema>;
