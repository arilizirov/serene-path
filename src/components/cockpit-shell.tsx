import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

// Top-nav shell for the therapist cockpit (modelled on the "fitplan" reference):
// a floating brand card, a centered nav pill, and a search + notifications +
// avatar cluster — all on the warm page field. Presentational + props-driven so
// it re-themes via the `.theme-warm` wrapper and stays i18n-agnostic (the page
// passes resolved labels). RTL: every offset is logical, icons are symmetric.

export type CockpitIcon = "home" | "calendar" | "clients" | "messages" | "settings";

export type CockpitNavItem = {
  key: string;
  label: string;
  href: string;
  icon: CockpitIcon;
  badge?: number;
};

export function CockpitShell({
  nav,
  activeKey,
  user,
  searchPlaceholder,
  notifications = 0,
  children,
}: {
  nav: CockpitNavItem[];
  activeKey: string;
  user: { name: string };
  searchPlaceholder: string;
  notifications?: number;
  children: ReactNode;
}) {
  const initial = (user.name.trim().charAt(0) || "?").toUpperCase();

  return (
    <div className="min-h-screen bg-bg px-4 py-4 md:px-6 md:py-6">
      <header className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3">
        {/* Brand card */}
        <Link
          href="/dashboard"
          aria-label="Theraper"
          className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-card"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-heading text-sm font-bold text-accent-ink">
            T
          </span>
          <span className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
            Theraper
          </span>
        </Link>

        {/* Centered nav pill */}
        <nav className="order-last flex w-full items-center justify-center gap-1 rounded-2xl bg-surface p-1.5 shadow-card sm:gap-2 lg:order-none lg:w-auto lg:flex-1 lg:justify-center">
          {nav.map((item) => {
            const active = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition md:px-4 ${
                  active
                    ? "bg-accent-soft text-accent-soft-ink"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  <NavGlyph icon={item.icon} />
                </span>
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Search + notifications + avatar */}
        <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-ink-3 shadow-card sm:max-w-[280px]">
            <Glyph>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </Glyph>
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
            />
          </label>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-ink-2 shadow-card transition hover:text-ink"
          >
            <Glyph>
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </Glyph>
            {notifications > 0 ? (
              <span className="absolute end-3 top-3 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
            ) : null}
          </button>
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft font-heading text-sm font-semibold text-accent-soft-ink shadow-card"
            aria-hidden
          >
            {initial}
          </span>
        </div>
      </header>

      <main className="mx-auto mt-5 max-w-[1400px]">{children}</main>
    </div>
  );
}

/** Stroke icon wrapper (inherits currentColor; symmetric → no RTL flip). */
function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function NavGlyph({ icon }: { icon: CockpitIcon }) {
  switch (icon) {
    case "home":
      return (
        <Glyph>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </Glyph>
      );
    case "calendar":
      return (
        <Glyph>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </Glyph>
      );
    case "clients":
      return (
        <Glyph>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11l2 2 3-3" />
        </Glyph>
      );
    case "messages":
      return (
        <Glyph>
          <path d="M4 5h16v11H7l-3 3z" />
          <path d="M8 9h8M8 12h5" />
        </Glyph>
      );
    case "settings":
      return (
        <Glyph>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3H9l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L2.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1L9 21h6l.3-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4z" />
        </Glyph>
      );
  }
}
