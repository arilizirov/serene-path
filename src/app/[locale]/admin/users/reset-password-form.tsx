"use client";

import { useActionState } from "react";
import { resetPasswordAction, type UsersActionState } from "./actions";

// Per-row reset-password control. A small client component wrapping a form that
// posts to the ADMIN-gated resetPasswordAction; the onSubmit confirm() is only UX
// friction — the real authorization is the action's requireRole("ADMIN"). The new
// password must meet the registration strength rule (enforced in the action via
// passwordSchema); a validation failure is surfaced here as state.error.
export function ResetPasswordForm({
  userId,
  locale,
}: {
  userId: string;
  locale: string;
}) {
  const [state, action] = useActionState<UsersActionState, FormData>(
    resetPasswordAction,
    {},
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Reset this user's password to the value entered?")) {
          e.preventDefault();
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="locale" defaultValue={locale} />
      <input type="hidden" name="userId" defaultValue={userId} />
      <div className="flex items-center gap-2">
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="New password"
          aria-label="New password"
          className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs text-on-surface"
        />
        <button type="submit" className="text-xs text-primary underline">
          Reset
        </button>
      </div>
      {state.error ? (
        <span className="text-xs text-error">{state.error}</span>
      ) : null}
    </form>
  );
}
