"use client";

import { deleteUserAction } from "./actions";

/**
 * Per-row "Delete" control for a user (GDPR right-to-erasure). A small client
 * component wrapping a plain form that posts to the (ADMIN-gated) delete action;
 * an onSubmit confirm() guards against an accidental click — a hard delete removes
 * the user, their appointments and (if a therapist) their whole profile cascade,
 * and cannot be undone. The real authorization is the action's
 * requireRole("ADMIN"), and the last-admin lockout lives in the service; this is
 * only UX friction. Mirrors DeleteTherapistButton.
 */
export function DeleteUserButton({
  userId,
  email,
  locale,
}: {
  userId: string;
  email: string;
  locale: string;
}) {
  return (
    <form
      action={deleteUserAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Delete ${email} permanently? This erases their account and all related data and cannot be undone.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" defaultValue={userId} />
      <input type="hidden" name="locale" defaultValue={locale} />
      <button
        type="submit"
        className="rounded-full border border-error px-3 py-1 text-xs font-medium text-error"
      >
        Delete
      </button>
    </form>
  );
}
