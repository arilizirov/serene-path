"use client";

import { useActionState } from "react";
import { saveTherapistAction, type TherapistFormState } from "../actions";
import type { TherapistForEdit } from "../service";

const inputClass =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface";
const labelClass = "flex flex-col gap-1 text-sm font-medium text-on-surface-variant";

function Field({
  name,
  label,
  defaultValue,
  error,
  type = "text",
  textarea = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} rows={2} className={inputClass} />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} className={inputClass} />
      )}
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </label>
  );
}

export function TherapistForm({
  locale,
  initial,
}: {
  locale: string;
  initial?: TherapistForEdit;
}) {
  const [state, action, pending] = useActionState<TherapistFormState, FormData>(
    saveTherapistAction,
    { ok: false },
  );
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-4">
      {initial?.id ? <input type="hidden" name="id" defaultValue={initial.id} /> : null}
      <input type="hidden" name="locale" defaultValue={locale} />

      {state.error ? (
        <p className="rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      ) : null}

      <Field name="name" label="Display name" defaultValue={initial?.name} error={e.name} />
      <Field name="email" label="Email" type="email" defaultValue={initial?.email} error={e.email} />
      <Field name="title" label="Title / specialty" defaultValue={initial?.title} error={e.title} />

      <Field name="bioEn" label="Bio (English)" textarea defaultValue={initial?.bio.en} error={e["bio.en"]} />
      <Field name="bioHe" label="Bio (עברית)" textarea defaultValue={initial?.bio.he} error={e["bio.he"]} />
      <Field name="bioFr" label="Bio (Français)" textarea defaultValue={initial?.bio.fr} error={e["bio.fr"]} />

      <Field name="skills" label="Skills (comma-separated)" defaultValue={initial?.skills.join(", ")} error={e.skills} />
      <Field name="modalities" label="Modalities (comma-separated)" defaultValue={initial?.modalities.join(", ")} error={e.modalities} />
      <Field name="languages" label="Languages (comma-separated)" defaultValue={initial?.languages.join(", ")} error={e.languages} />

      <Field name="credentials" label="Credentials (optional)" defaultValue={initial?.credentials} error={e.credentials} />
      <Field name="photoUrl" label="Photo URL (optional)" defaultValue={initial?.photoUrl} error={e.photoUrl} />
      <Field name="sessionPrice" label="Session price (ILS)" type="number" defaultValue={initial?.sessionPrice?.toString()} error={e.sessionPrice} />

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-primary px-5 py-2 font-medium text-on-primary disabled:opacity-60"
      >
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create therapist"}
      </button>
    </form>
  );
}
