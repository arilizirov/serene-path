"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/features/accounts";
import {
  therapistInputSchema,
  availabilityRulesSchema,
  availabilityExceptionSchema,
  therapistStatusSchema,
} from "./schema";
import {
  createTherapist,
  updateTherapist,
  saveAvailabilityRules,
  setTherapistStatus,
  addBlockedDate,
  removeBlockedDate,
  saveMyProfile,
  requestVerification,
  getMyProfileForEdit,
} from "./service";
import { profileCompleteness } from "./completeness";
import { formDataToTherapistInput, fieldErrorsFromZod } from "./form-parsing";

export type TherapistFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Every mutating admin action re-checks requireRole("ADMIN") at the action
// boundary. Server Actions compile to independent POST endpoints dispatched
// before/independent of page + layout rendering, so the middleware gate and the
// admin layout's requireRole do NOT protect them — the action itself is the real
// trust boundary and must fail closed.

/**
 * Admin form submit: create (no `id`) or update (with `id`) a therapist.
 * Validates the untrusted form input at the boundary (§11) and, on success,
 * redirects back to the admin list.
 */
export async function saveTherapistAction(
  _prev: TherapistFormState,
  formData: FormData,
): Promise<TherapistFormState> {
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);

  const parsed = therapistInputSchema.safeParse(
    formDataToTherapistInput(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  if (id) {
    await updateTherapist(id, parsed.data);
  } else {
    await createTherapist(parsed.data);
  }

  redirect(`/${locale}/admin/therapists`);
}

export type AvailabilityFormState = { ok: boolean; error?: string };

/** Replace a therapist's weekly availability rules from the editor. */
export async function saveAvailabilityAction(
  _prev: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  const id = String(formData.get("therapistId") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("rules") ?? "[]"));
  } catch {
    return { ok: false, error: "Invalid availability data." };
  }

  const parsed = availabilityRulesSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid availability.",
    };
  }

  await saveAvailabilityRules(id, parsed.data);
  redirect(`/${locale}/admin/therapists/${id}`);
}

/** Quick verification status change from the admin list (plain form action). */
export async function setStatusAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);
  const status = therapistStatusSchema.safeParse(formData.get("status"));
  if (status.success) {
    await setTherapistStatus(id, status.data);
  }
  redirect(`/${locale}/admin/therapists`);
}

/** Block a date for a therapist (plain form action). Invalid dates are ignored. */
export async function addBlockedDateAction(formData: FormData): Promise<void> {
  const therapistId = String(formData.get("therapistId") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);
  const parsed = availabilityExceptionSchema.safeParse({
    date: formData.get("date"),
  });
  if (parsed.success) {
    await addBlockedDate(therapistId, parsed.data.date);
  }
  redirect(`/${locale}/admin/therapists/${therapistId}`);
}

/** Remove a blocked date by id (plain form action). */
export async function removeBlockedDateAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const therapistId = String(formData.get("therapistId") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  await requireRole("ADMIN", locale);
  await removeBlockedDate(id, therapistId);
  redirect(`/${locale}/admin/therapists/${therapistId}`);
}

// --- Therapist self-service (dashboard) — owner-scoped to the session user ---

/** Therapist saves their OWN profile. The target is resolved from the session
 *  user id, never a form-supplied id, so a therapist can't edit another's. */
export async function saveMyProfileAction(
  _prev: TherapistFormState,
  formData: FormData,
): Promise<TherapistFormState> {
  const locale = String(formData.get("locale") ?? "en");
  const { id: userId } = await requireRole("THERAPIST", locale);
  const parsed = therapistInputSchema.safeParse(
    formDataToTherapistInput(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  await saveMyProfile(userId, parsed.data);
  redirect(`/${locale}/dashboard`);
}

/** Therapist requests verification of their OWN profile — only when complete
 *  (server-side guard, not just the UI). */
export async function requestVerificationAction(
  formData: FormData,
): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const { id: userId } = await requireRole("THERAPIST", locale);
  const profile = await getMyProfileForEdit(userId);
  if (profile && profileCompleteness(profile).isComplete) {
    await requestVerification(userId);
  }
  redirect(`/${locale}/dashboard`);
}
