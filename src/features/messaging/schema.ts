import { z } from "zod";

/** Inbound validation for a message send. recipientId is a User id; the SERVICE
 *  still gates eligibility (a shared appointment) — the id is never trusted as
 *  proof the pair may talk. Body is trimmed + length-capped at the boundary. */
export const sendMessageSchema = z.object({
  recipientId: z.string().min(1).max(64),
  body: z.string().trim().min(1).max(4000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
