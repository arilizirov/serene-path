import type { ZodError } from "zod";

// Pure FormData helpers, kept out of the "use server" actions file (whose
// exports must all be async functions) so they're unit-testable.

function csv(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Shape raw admin-form FormData into the object therapistInputSchema expects. */
export function formDataToTherapistInput(
  formData: FormData,
): Record<string, unknown> {
  const str = (k: string) => String(formData.get(k) ?? "");
  const opt = (k: string) => str(k) || undefined;
  return {
    email: str("email"),
    name: str("name"),
    title: str("title"),
    bio: { en: str("bioEn"), he: str("bioHe"), fr: str("bioFr") },
    skills: csv(formData.get("skills")),
    modalities: csv(formData.get("modalities")),
    languages: csv(formData.get("languages")),
    credentials: opt("credentials"),
    photoUrl: opt("photoUrl"),
    sessionPrice: str("sessionPrice"),
  };
}

/** Flatten a ZodError into a { fieldPath: firstMessage } map for the form. */
export function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
