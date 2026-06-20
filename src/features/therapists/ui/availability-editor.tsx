"use client";

import { useActionState, useState } from "react";
import { saveAvailabilityAction, type AvailabilityFormState } from "../actions";
import type { AvailabilityRuleInput } from "../schema";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fieldClass =
  "rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-on-surface";

export function AvailabilityEditor({
  therapistId,
  locale,
  initialRules,
}: {
  therapistId: string;
  locale: string;
  initialRules: AvailabilityRuleInput[];
}) {
  const [rules, setRules] = useState<AvailabilityRuleInput[]>(initialRules);
  const [state, action, pending] = useActionState<AvailabilityFormState, FormData>(
    saveAvailabilityAction,
    { ok: false },
  );

  const update = (i: number, patch: Partial<AvailabilityRuleInput>) =>
    setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="therapistId" defaultValue={therapistId} />
      <input type="hidden" name="locale" defaultValue={locale} />
      <input type="hidden" name="rules" value={JSON.stringify(rules)} readOnly />

      {state.error ? (
        <p className="rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      ) : null}

      {rules.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No weekly slots yet.</p>
      ) : (
        rules.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              value={String(r.weekday)}
              onChange={(e) => update(i, { weekday: Number(e.target.value) })}
              className={fieldClass}
            >
              {WEEKDAYS.map((d, idx) => (
                <option key={idx} value={idx}>
                  {d}
                </option>
              ))}
            </select>
            <input type="time" value={r.start} onChange={(e) => update(i, { start: e.target.value })} className={fieldClass} />
            <span className="text-on-surface-variant">–</span>
            <input type="time" value={r.end} onChange={(e) => update(i, { end: e.target.value })} className={fieldClass} />
            <button
              type="button"
              onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))}
              className="text-sm text-error"
            >
              Remove
            </button>
          </div>
        ))
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRules((rs) => [...rs, { weekday: 0, start: "09:00", end: "12:00" }])}
          className="rounded-full border border-outline px-4 py-1.5 text-sm text-on-surface"
        >
          + Add slot
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save availability"}
        </button>
      </div>
    </form>
  );
}
