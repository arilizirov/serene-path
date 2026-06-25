"use client";

import { useState, type ReactNode } from "react";

/** The mobile (<md) sidebar drawer toggle. The nav markup itself is rendered by
 *  the server shell and passed as `children`, so there's no duplicate nav. A
 *  hamburger button opens an overlay drawer pinned to the inline-start edge
 *  (flips to inline-end in RTL via `start-0`). Minimal — just open/close. */
export function MobileSidebar({
  brand,
  menuLabel,
  closeLabel,
  children,
}: {
  brand: ReactNode;
  menuLabel: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="h-0.5 w-4 rounded-sm bg-ink" />
          <span className="h-0.5 w-4 rounded-sm bg-ink" />
          <span className="h-0.5 w-4 rounded-sm bg-ink" />
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-64 flex-col gap-6 border-e border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="text-sm font-medium text-ink-2"
              >
                ✕
              </button>
            </div>
            <div
              className="flex flex-1 flex-col gap-6"
              onClick={() => setOpen(false)}
            >
              {children}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
