"use client";

import { useMemo, useState } from "react";
import { DeleteConversationButton } from "./delete-conversation-button";

/** Row shape this table renders — a structural subset of FinishedSessionRow,
 *  kept local so the client bundle doesn't pull in the feature's types. */
export type ConversationRow = {
  id: string;
  updatedAt: string; // ISO; serialized by the server page (Dates don't cross the boundary)
  state: string;
  engine: string | null;
  turns: number;
  matched: number;
};

/**
 * The finished-conversations table with per-row checkboxes plus View / Download
 * links, and a "Download selected (N)" button that navigates to the ADMIN-gated
 * batch route with the chosen ids. Selection lives in client state; the real
 * authorization is requireRole("ADMIN") on that route, not anything here.
 */
export function ConversationsTable({
  rows,
  locale,
}: {
  rows: ConversationRow[];
  locale: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const selectedIds = useMemo(
    () => rows.filter((r) => selected.has(r.id)).map((r) => r.id),
    [rows, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function downloadSelected() {
    if (selectedIds.length === 0) return;
    const ids = selectedIds.map(encodeURIComponent).join(",");
    window.location.href = `/${locale}/admin/conversations/download?ids=${ids}`;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={downloadSelected}
          disabled={selectedIds.length === 0}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-40"
        >
          Download selected ({selectedIds.length})
        </button>
      </div>

      <table className="w-full border-collapse text-start text-sm">
        <thead>
          <tr className="border-b border-outline-variant text-on-surface-variant">
            <th className="py-2 text-start">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all conversations"
              />
            </th>
            <th className="py-2 text-start">Date</th>
            <th className="py-2 text-start">State</th>
            <th className="py-2 text-start">Engine</th>
            <th className="py-2 text-start">Turns</th>
            <th className="py-2 text-start">Matched</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-outline-variant/40 text-on-surface"
            >
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  aria-label={`Select conversation ${r.id}`}
                />
              </td>
              <td className="py-2">{r.updatedAt.slice(0, 10)}</td>
              <td className="py-2">{r.state}</td>
              <td className="py-2">{r.engine ?? "—"}</td>
              <td className="py-2">{r.turns}</td>
              <td className="py-2">{r.matched}</td>
              <td className="py-2 text-end">
                <div className="flex items-center justify-end gap-3">
                  <a
                    href={`/${locale}/admin/conversations/${r.id}`}
                    className="text-primary underline"
                  >
                    View
                  </a>
                  <a
                    href={`/${locale}/admin/conversations/${r.id}/download`}
                    className="text-primary underline"
                  >
                    Download
                  </a>
                  <DeleteConversationButton id={r.id} locale={locale} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
