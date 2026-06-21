"use client";

import { useActionState } from "react";
import {
  registerTherapistAction,
  type TherapistSignupState,
} from "./actions";

const inputClass =
  "rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface";

export function TherapistSignupForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState<
    TherapistSignupState,
    FormData
  >(registerTherapistAction, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" defaultValue={locale} />

      {state.error ? (
        <p className="rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm text-on-surface-variant">
        Full name
        <input name="name" required autoComplete="name" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-on-surface-variant">
        Professional title
        <input
          name="title"
          required
          placeholder="e.g. Clinical Psychologist"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-on-surface-variant">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-on-surface-variant">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-5 py-2 font-medium text-on-primary disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create therapist account"}
      </button>
    </form>
  );
}
