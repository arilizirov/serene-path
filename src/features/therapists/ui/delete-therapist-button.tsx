"use client";

import { deleteTherapistAction } from "../actions";

/**
 * Admin "Delete therapist" control. A small client component wrapping a plain
 * form that posts to the (ADMIN-gated) delete action; an onSubmit confirm()
 * guards against an accidental click — a hard delete removes the user, their
 * profile, availability and appointments and can't be undone. The real
 * authorization is the action's requireRole("ADMIN"); this is only UX friction.
 */
export function DeleteTherapistButton({
  profileId,
  locale,
}: {
  profileId: string;
  locale: string;
}) {
  return (
    <form
      action={deleteTherapistAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Delete this therapist permanently? This also removes their availability and appointments and cannot be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" defaultValue={profileId} />
      <input type="hidden" name="locale" defaultValue={locale} />
      <button
        type="submit"
        className="rounded-full border border-error px-4 py-1.5 text-sm font-medium text-error"
      >
        Delete therapist
      </button>
    </form>
  );
}
