import { addBlockedDateAction, removeBlockedDateAction } from "../actions";

const fieldClass =
  "rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-on-surface";

/**
 * Whole-day blocked-date editor for the admin therapist page. A server
 * component driving plain server-action forms (no client state needed): each
 * listed date posts a remove, and the add form blocks a new date.
 */
export function BlockedDatesEditor({
  therapistId,
  locale,
  blockedDates,
}: {
  therapistId: string;
  locale: string;
  blockedDates: { id: string; date: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {blockedDates.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No blocked dates.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blockedDates.map((b) => (
            <li key={b.id} className="flex items-center gap-3">
              <span className="text-on-surface">{b.date}</span>
              <form action={removeBlockedDateAction}>
                <input type="hidden" name="id" defaultValue={b.id} />
                <input
                  type="hidden"
                  name="therapistId"
                  defaultValue={therapistId}
                />
                <input type="hidden" name="locale" defaultValue={locale} />
                <button type="submit" className="text-sm text-error">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={addBlockedDateAction} className="flex items-end gap-2">
        <input type="hidden" name="therapistId" defaultValue={therapistId} />
        <input type="hidden" name="locale" defaultValue={locale} />
        <input type="date" name="date" required className={fieldClass} />
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary"
        >
          Block date
        </button>
      </form>
    </div>
  );
}
