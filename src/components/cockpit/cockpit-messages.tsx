import type { ReactNode } from "react";

// Messages panel (right rail): a conversation list + the active thread + a
// booking-invite card + a composer — modelled on the reference. Presentational
// for now; Phase 4 swaps this for a client island that polls the real
// /api/messaging endpoints and posts sends. Tokens drive all colour (warm).

export type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  timeLabel: string;
  unread?: number;
  online?: boolean;
};

export type ThreadMessage = {
  id: string;
  fromMe: boolean;
  body: string;
  timeLabel: string;
};

export type BookingInvite = {
  title: string;
  dateLabel: string;
  timeLabel: string;
};

export function CockpitMessages({
  title,
  conversations,
  activeName,
  messages,
  invite,
  composerPlaceholder,
  acceptLabel,
  rejectLabel,
  readOnly,
  emptyLabel,
}: {
  title: string;
  conversations: Conversation[];
  activeName: string;
  messages: ThreadMessage[];
  invite?: BookingInvite;
  composerPlaceholder: string;
  acceptLabel: string;
  rejectLabel: string;
  // PR-A renders this read-only (real conversation list + thread, no composer).
  // PR-B swaps in a client island that polls + sends + accepts/rejects.
  readOnly?: boolean;
  emptyLabel?: string;
}) {
  if (conversations.length === 0) {
    return (
      <section className="flex min-h-[360px] flex-col rounded-3xl bg-surface p-5 shadow-card">
        <p className="font-heading text-sm font-bold text-ink">{title}</p>
        <p className="m-auto text-sm text-ink-3">{emptyLabel ?? "—"}</p>
      </section>
    );
  }
  return (
    <section className="flex min-h-[360px] overflow-hidden rounded-3xl bg-surface shadow-card">
      {/* Conversation list */}
      <div className="hidden w-[150px] shrink-0 flex-col border-e border-border md:flex">
        <p className="px-3 py-3 font-heading text-sm font-bold text-ink">{title}</p>
        <div className="flex flex-1 flex-col overflow-y-auto">
          {conversations.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={`flex items-start gap-2 px-2.5 py-2.5 text-start transition hover:bg-surface-2 ${
                i === 0 ? "bg-accent-soft/50" : ""
              }`}
            >
              <Avatar name={c.name} online={c.online} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-semibold text-ink">{c.name}</span>
                  <span className="shrink-0 text-[10px] text-ink-3">{c.timeLabel}</span>
                </span>
                <span className="mt-0.5 line-clamp-1 text-[11px] text-ink-3">{c.lastMessage}</span>
              </span>
              {c.unread ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink">
                  {c.unread}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Active thread */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Avatar name={activeName} online />
          <span className="text-sm font-semibold text-ink">{activeName}</span>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.fromMe ? "items-end" : "items-start"}`}>
              <span
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.fromMe
                    ? "rounded-br-md bg-accent-soft text-accent-soft-ink"
                    : "rounded-bl-md bg-surface-2 text-ink"
                }`}
              >
                {m.body}
              </span>
              <span className="mt-1 text-[10px] text-ink-3">{m.timeLabel}</span>
            </div>
          ))}

          {invite ? (
            <div className="my-1 self-start rounded-2xl border border-border bg-surface-2/60 p-3">
              <p className="text-sm font-semibold text-ink">{invite.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-ink-2">
                <span>{invite.dateLabel}</span>
                <span>{invite.timeLabel}</span>
              </p>
              <div className="mt-2.5 flex gap-2">
                <button type="button" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-2 transition hover:bg-surface">
                  {rejectLabel}
                </button>
                <button type="button" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink transition hover:brightness-105">
                  {acceptLabel}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {readOnly ? null : (
          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              type="text"
              placeholder={composerPlaceholder}
              className="min-w-0 flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-3"
            />
            <button
              type="button"
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition hover:brightness-105"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l16-7-7 16-2.5-6.5z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Avatar({ name, online }: { name: string; online?: boolean }): ReactNode {
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-heading text-xs font-semibold text-accent-soft-ink">
      {initial}
      {online ? (
        <span className="absolute -end-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-accent-2 ring-2 ring-surface" />
      ) : null}
    </span>
  );
}
