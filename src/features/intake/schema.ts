import { z } from "zod";

/** Inbound request to the intake endpoint (§5). Validated at the route boundary. */
export const intakeRequestSchema = z.object({
  sessionId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(4000),
  locale: z.enum(["he", "en", "fr"]),
  /** Which intake engine to use (lets the UI compare). Sticky per session;
   *  "ai" only takes effect when an OpenAI key is configured, else "scripted". */
  engine: z.enum(["ai", "scripted"]).optional(),
});
export type IntakeRequestInput = z.infer<typeof intakeRequestSchema>;

/** Inbound request for the chip-driven flow (INTAKE_BUILD_SPEC). One of text /
 *  choice / action carries the turn's input; a bare {locale} starts the flow. */
export const chipIntakeRequestSchema = z.object({
  sessionId: z.string().min(1).optional(),
  locale: z.enum(["he", "en", "fr"]),
  text: z.string().trim().min(1).max(4000).optional(),
  choice: z.string().min(1).max(64).optional(),
  action: z.enum(["browse_all", "human_followup", "get_help_now"]).optional(),
});
export type ChipIntakeRequestInput = z.infer<typeof chipIntakeRequestSchema>;

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
