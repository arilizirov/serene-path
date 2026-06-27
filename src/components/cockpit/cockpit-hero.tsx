import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

// The cockpit hero: a warm gradient panel with calming CSS/SVG art (no raster
// travel imagery — this is a therapy product), an overlaid card for the next
// session, and a small client-avatar + bell cluster. Empty state when nothing
// is booked. Tokens (warm via the .theme-warm wrapper) drive all colour.

export type HeroSession = {
  clientName: string;
  dateLabel: string;
  timeLabel: string;
  joinHref: string;
};

export function CockpitHero({
  eyebrow,
  joinLabel,
  emptyTitle,
  emptyBody,
  session,
}: {
  eyebrow: string;
  joinLabel: string;
  emptyTitle: string;
  emptyBody: string;
  session?: HeroSession;
}) {
  return (
    <div className="relative isolate flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl p-5 shadow-card">
      <CalmArt />

      {/* avatar + bell cluster (top end) */}
      <div className="absolute end-5 top-5 z-10 flex items-center gap-2">
        {session ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 font-heading text-xs font-semibold text-accent-soft-ink shadow-card backdrop-blur">
            {(session.clientName.trim().charAt(0) || "?").toUpperCase()}
          </span>
        ) : null}
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink-2 shadow-card backdrop-blur">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </span>
      </div>

      {session ? (
        <div className="relative z-10 max-w-sm rounded-2xl bg-surface/95 p-5 shadow-card backdrop-blur">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-soft-ink">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-[-0.01em] text-ink">
            {session.clientName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
            <span className="flex items-center gap-1.5">
              <Mini>
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M3 9h18M8 2v4M16 2v4" />
              </Mini>
              {session.dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <Mini>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </Mini>
              {session.timeLabel}
            </span>
          </div>
          <Link
            href={session.joinHref}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-105"
          >
            {joinLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <div className="relative z-10 max-w-sm rounded-2xl bg-surface/95 p-5 shadow-card backdrop-blur">
          <h2 className="font-heading text-xl font-bold text-ink">{emptyTitle}</h2>
          <p className="mt-1 text-sm text-ink-2">{emptyBody}</p>
        </div>
      )}
    </div>
  );
}

/** Calming abstract art — warm gradient sky, a soft sun, layered hills + a few
 *  drifting leaves. Pure SVG/CSS so it themes + needs no assets. */
function CalmArt() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 600 320"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9b0" />
          <stop offset="0.55" stopColor="#ffb38a" />
          <stop offset="1" stopColor="#f59f7e" />
        </linearGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6925f" />
          <stop offset="1" stopColor="#ec7a4c" />
        </linearGradient>
      </defs>
      <rect width="600" height="320" fill="url(#sky)" />
      <circle cx="430" cy="110" r="52" fill="#fff1dd" opacity="0.85" />
      <path d="M0 250 Q120 200 250 234 T600 214 V320 H0 Z" fill="#f3a877" opacity="0.85" />
      <path d="M0 282 Q160 236 320 268 T600 256 V320 H0 Z" fill="url(#hill1)" />
      <g fill="#d9663b" opacity="0.6">
        <circle cx="70" cy="120" r="4" />
        <circle cx="120" cy="90" r="3" />
        <circle cx="180" cy="140" r="3.5" />
      </g>
    </svg>
  );
}

function Mini({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-3" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
