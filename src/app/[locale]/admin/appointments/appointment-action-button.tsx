"use client";

// Confirm-on-submit control for a per-row admin appointment action (Phase 2).
// A small client component wrapping a plain form that posts to an ADMIN-gated
// action; the onSubmit confirm() is only UX friction — the real authorization is
// the action's requireRole("ADMIN"). Mirrors DeleteTherapistButton.
export function AppointmentActionButton({
  action,
  appointmentId,
  locale,
  label,
  confirmText,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  appointmentId: string;
  locale: string;
  label: string;
  confirmText: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" defaultValue={locale} />
      <input type="hidden" name="appointmentId" defaultValue={appointmentId} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
