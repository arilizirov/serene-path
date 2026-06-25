"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/features/accounts";
import { deleteSession, purgeSessionsOlderThan } from "@/features/intake";

// Admin manual data deletion actions (Phase 5, retention & GDPR). These are
// DESTRUCTIVE and admin-triggered ONLY — there is no scheduled auto-purge (the
// owner chose KEEP-INDEFINITELY). Server Actions compile to independent POST
// endpoints dispatched before/independent of the admin layout's requireRole, so
// each action MUST re-check requireRole("ADMIN") as its FIRST statement and touch
// no data before that gate passes. The intake transcripts are sensitive (§11);
// the gate is the load-bearing control — fail closed.

/** Delete one conversation (intake transcript). Per-row, confirm-on-submit plain
 *  form action; the id comes from the form. IntakeSession has no child rows, so
 *  the repository delete is FK-safe and a missing id is a no-op. */
export async function deleteConversationAction(
  formData: FormData,
): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);

  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteSession(id);
  }

  redirect(`/${locale}/admin/conversations`);
}

// `days` must be a positive integer — coerced from the form string, then bounded.
// Capped at ~27 years to keep the cutoff arithmetic sane; the real intent is just
// "a sensible positive whole number of days".
const purgeSchema = z.object({
  days: z.coerce.number().int().positive().max(10_000),
});

/**
 * Manual bulk purge (on-demand, NOT scheduled): delete every conversation older
 * than `days` days. `days` is validated as a positive integer here at the
 * boundary; the deletion count is reported back to the page via the redirect
 * query string. Confirm-on-submit in the UI.
 */
export async function purgeOldConversationsAction(
  formData: FormData,
): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);

  const parsed = purgeSchema.safeParse({ days: formData.get("days") });
  if (!parsed.success) {
    redirect(
      `/${locale}/admin/conversations?error=${encodeURIComponent(
        "Enter a positive whole number of days.",
      )}`,
    );
  }

  const deleted = await purgeSessionsOlderThan(parsed.data.days);
  redirect(
    `/${locale}/admin/conversations?purged=${deleted}&days=${parsed.data.days}`,
  );
}
