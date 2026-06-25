"use client";

import { deleteConversationAction } from "./actions";

/**
 * Per-row "Delete" control for a conversation (intake transcript). A small client
 * component wrapping a plain form that posts to the (ADMIN-gated) delete action;
 * an onSubmit confirm() guards against an accidental click — a hard delete removes
 * the transcript and cannot be undone. The real authorization is the action's
 * requireRole("ADMIN"); this is only UX friction. Mirrors DeleteTherapistButton.
 */
export function DeleteConversationButton({
  id,
  locale,
}: {
  id: string;
  locale: string;
}) {
  return (
    <form
      action={deleteConversationAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Delete this conversation permanently? This removes the transcript and cannot be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" defaultValue={id} />
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
