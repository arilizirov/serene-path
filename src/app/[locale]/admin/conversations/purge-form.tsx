"use client";

import { purgeOldConversationsAction } from "./actions";

/**
 * Manual bulk-purge form (on-demand, NOT scheduled): "Delete conversations older
 * than [N] days". A confirm-on-submit plain form posting to the ADMIN-gated
 * purge action; the action validates `days` as a positive integer at the
 * boundary and reports the deletion count back via the redirect. The confirm()
 * is UX friction only — the real authorization is requireRole("ADMIN").
 */
export function PurgeForm({ locale }: { locale: string }) {
  return (
    <form
      action={purgeOldConversationsAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Permanently delete every conversation older than the chosen number of days? This cannot be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="locale" defaultValue={locale} />
      <label className="flex flex-col gap-1 text-sm text-on-surface-variant">
        Delete conversations older than
        <span className="flex items-center gap-2">
          <input
            type="number"
            name="days"
            min={1}
            step={1}
            defaultValue={365}
            required
            className="w-24 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-on-surface"
          />
          <span>days</span>
        </span>
      </label>
      <button
        type="submit"
        className="rounded-full border border-error px-4 py-1.5 text-sm font-medium text-error"
      >
        Delete old
      </button>
    </form>
  );
}
