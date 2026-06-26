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

/** Inbound request to /api/intake — permissive enough for BOTH interchangeable
 *  flows behind the IntakeProvider seam (the route dispatches on `provider`, each
 *  provider then parses its own shape):
 *    - chip flow (default): one of text / choice / action carries the turn; a bare
 *      {locale} starts the flow.
 *    - AI conversational flow: free-text `message` (+ optional `engine`).
 *  `provider` selects the flow (default "chip"). All fields stay validated at the
 *  boundary — locale enum, length caps — so neither flow trusts raw input. */
export const chipIntakeRequestSchema = z.object({
  sessionId: z.string().min(1).optional(),
  locale: z.enum(["he", "en", "fr"]),
  // chip-flow inputs
  text: z.string().trim().min(1).max(4000).optional(),
  choice: z.string().min(1).max(64).optional(),
  action: z.enum(["browse_all", "human_followup", "get_help_now"]).optional(),
  // AI conversational-flow inputs
  message: z.string().trim().min(1).max(4000).optional(),
  engine: z.enum(["ai", "scripted"]).optional(),
  // which flow handles this turn (default chip — the canonical pre-choice intake)
  provider: z.enum(["chip", "api"]).optional(),
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
