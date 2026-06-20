"use server";

import { redirect } from "next/navigation";
import { therapistInputSchema } from "./schema";
import { createTherapist, updateTherapist } from "./service";
import { formDataToTherapistInput, fieldErrorsFromZod } from "./form-parsing";

export type TherapistFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Admin form submit: create (no `id`) or update (with `id`) a therapist.
 * Validates the untrusted form input at the boundary (§11) and, on success,
 * redirects back to the admin list. Authz is added in Stage 4 (until then the
 * admin routes are unprotected — see BUILD_PLAN dependency chain).
 */
export async function saveTherapistAction(
  _prev: TherapistFormState,
  formData: FormData,
): Promise<TherapistFormState> {
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "en");

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
