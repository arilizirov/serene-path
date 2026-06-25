"use client";

import { useActionState } from "react";
import { setUserRoleAction, type UsersActionState } from "./actions";
import type { Role } from "@/features/accounts";

const ROLES: Role[] = ["CLIENT", "THERAPIST", "ADMIN"];

// Per-row change-role control. A small client component wrapping a form that
// posts to the ADMIN-gated setUserRoleAction; the onSubmit confirm() is only UX
// friction — the real authorization is the action's requireRole("ADMIN"), and the
// last-admin lockout is enforced in the service and surfaced here as state.error.
export function ChangeRoleForm({
  userId,
  currentRole,
  locale,
}: {
  userId: string;
  currentRole: Role;
  locale: string;
}) {
  const [state, action] = useActionState<UsersActionState, FormData>(
    setUserRoleAction,
    {},
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Change this user's role? This alters their access to the platform.",
          )
        ) {
          e.preventDefault();
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="locale" defaultValue={locale} />
      <input type="hidden" name="userId" defaultValue={userId} />
      <div className="flex items-center gap-2">
        <select
          name="role"
          defaultValue={currentRole}
          aria-label="Role"
          className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs text-on-surface"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button type="submit" className="text-xs text-primary underline">
          Save
        </button>
      </div>
      {state.error ? (
        <span className="text-xs text-error">{state.error}</span>
      ) : null}
    </form>
  );
}
