"use server";

import { redirect } from "next/navigation";
import {
  hashPassword,
  startSessionFor,
  normalizeEmail,
} from "@/features/accounts";
import {
  therapistSignupSchema,
  selfRegisterTherapist,
} from "@/features/therapists";

export type TherapistSignupState = { error?: string };

/**
 * Therapist self-signup — app-layer composition: validate, hash (accounts),
 * create the THERAPIST user + DRAFT profile (therapists), then start a session
 * (accounts). Lands on the dashboard; the profile is DRAFT until completed +
 * admin-verified.
 */
export async function registerTherapistAction(
  _prev: TherapistSignupState,
  formData: FormData,
): Promise<TherapistSignupState> {
  const locale = String(formData.get("locale") ?? "en");
  const parsed = therapistSignupSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    title: formData.get("title"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const result = await selfRegisterTherapist({
    email: normalizeEmail(parsed.data.email),
    name: parsed.data.name,
    title: parsed.data.title,
    passwordHash,
  });
  if (!result.ok) return { error: result.error };

  await startSessionFor(result.userId);
  redirect(`/${locale}/dashboard`);
}
