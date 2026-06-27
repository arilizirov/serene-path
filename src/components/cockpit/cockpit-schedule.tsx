import type { ReactNode } from "react";

// "Upcoming Schedule" — the week laid out in day columns with session cards,
// modelled on the reference. Presentational: the page maps real appointments
// (getTherapistAppointments) into ScheduleDay[]. Tones come from token-driven
// utility classes so the warm theme recolours them automatically.

export type SessionTone = "accent" | "accent2" | "muted";

export type ScheduleEvent = {
  id: string;
  title: string;
  timeLabel: string;
  tone: SessionTone;
};

export type ScheduleDay = {
  key: string;
  weekday: string;
  dayNum: string;
  today?: boolean;
  events: ScheduleEvent[];
};

const TONE: Record<SessionTone, string> = {
  accent: "bg-accent-soft text-accent-soft-ink",
  accent2: "bg-accent-2-soft text-ink",
  muted: "bg-surface-2 text-ink-2",
};

export function CockpitSchedule({
  title,
  weekLabel,
  emptyLabel,
  days,
  prevHref,
  nextHref,
}: {
  title: string;
  weekLabel: string;
  emptyLabel: string;
  days: ScheduleDay[];
  prevHref?: string;
  nextHref?: string;
}) {
  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
        <div className="flex items-center gap-1.5 rounded-full bg-surface-2 p-1">
          <NavBtn href={prevHref} label="Previous week">
            <path d="M15 6l-6 6 6 6" />
          </NavBtn>
          <span className="px-2 text-sm font-medium text-ink">{weekLabel}</span>
          <NavBtn href={nextHref} label="Next week">
            <path d="M9 6l6 6-6 6" />
          </NavBtn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {days.map((day) => (
          <div key={day.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span
                className={`text-sm font-semibold ${day.today ? "text-accent" : "text-ink-2"}`}
              >
                {day.weekday}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  day.today ? "bg-accent text-accent-ink" : "text-ink-3"
                }`}
              >
                {day.dayNum}
              </span>
            </div>
            <div className="flex min-h-[88px] flex-col gap-2 rounded-2xl bg-surface-2/40 p-2">
              {day.events.length === 0 ? (
                <span className="m-auto text-xs text-ink-3">{emptyLabel}</span>
              ) : (
                day.events.map((ev) => (
                  <div key={ev.id} className={`rounded-xl p-2.5 ${TONE[ev.tone]}`}>
                    <p className="text-sm font-semibold leading-tight">{ev.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] opacity-80">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {ev.timeLabel}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NavBtn({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: ReactNode;
}) {
  const cls =
    "flex h-7 w-7 items-center justify-center rounded-full text-ink-2 transition hover:bg-surface hover:text-ink disabled:opacity-40";
  const glyph = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
  return href ? (
    <a href={href} aria-label={label} className={cls}>
      {glyph}
    </a>
  ) : (
    <button type="button" aria-label={label} className={cls} disabled>
      {glyph}
    </button>
  );
}
