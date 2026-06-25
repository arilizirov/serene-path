import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { logoutAction } from "@/features/accounts";
import type { NavItem, NavIcon } from "./dashboard-nav";
import { MobileSidebar } from "./dashboard-shell-mobile";

// Dependency-free inline icons (stroke = currentColor, so they inherit the
// item's text color). Directional glyphs would flip via rtl:-scale-x-100, but
// these are symmetric so no flip is needed. The pinned Help item uses "help".
const ICONS: Record<NavIcon, ReactNode> = icons();

/** A single sidebar row. Active = soft-green rounded-xl pill; inactive = muted
 *  with a surface-2 hover. `soon` items get a muted badge. */
function NavRow({
  item,
  active,
  soonLabel,
  label,
}: {
  item: NavItem;
  active: boolean;
  soonLabel: string;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-accent-soft text-accent-soft-ink"
          : "text-ink-2 hover:bg-surface-2"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {ICONS[item.icon]}
      </span>
      <span className="flex-1">{label}</span>
      {item.soon ? (
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink-3">
          {soonLabel}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * The dashboard shell: a fixed left sidebar (brand + role nav + pinned Help) and
 * a content column with a top bar (title + optional right slot + user + sign
 * out). Server component — `activeKey` is passed by each page. RTL flips the
 * sidebar to the inline-end side automatically because every offset is logical.
 */
export async function DashboardShell({
  nav,
  activeKey,
  title,
  user,
  locale,
  headerRight,
  children,
}: {
  nav: NavItem[];
  activeKey: string;
  title: string;
  user: { name: string };
  locale: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const t = await getTranslations("Dashboard");
  const soonLabel = t("soon");

  const navList = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => (
        <NavRow
          key={item.key}
          item={item}
          active={item.key === activeKey}
          soonLabel={soonLabel}
          label={t(`nav.${item.labelKey}`)}
        />
      ))}
    </nav>
  );

  const helpRow = (
    <Link
      href="/dashboard/help"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-2 transition hover:bg-surface-2"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {ICONS.help}
      </span>
      <span>{t("nav.help")}</span>
    </Link>
  );

  const brand = (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 px-2"
      aria-label="Theraper"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink font-heading text-sm font-bold">
        T
      </span>
      <span className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
        Theraper
      </span>
    </Link>
  );

  const initial = (user.name.trim().charAt(0) || "?").toUpperCase();

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Fixed sidebar — md and up. Flips to the inline-end edge in RTL. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-e border-border bg-surface p-4 md:flex">
        <div className="pt-2">{brand}</div>
        <div className="flex-1">{navList}</div>
        <div className="border-t border-border pt-3">{helpRow}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/90 px-5 py-4 backdrop-blur md:px-8">
          <MobileSidebar
            brand={brand}
            menuLabel={t("menu")}
            closeLabel={t("close")}
          >
            <div className="flex-1">{navList}</div>
            <div className="border-t border-border pt-3">{helpRow}</div>
          </MobileSidebar>

          <h1 className="flex-1 truncate text-2xl font-bold text-ink">{title}</h1>

          <div className="flex items-center gap-3">
            {headerRight}
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm font-medium text-ink-2">
                {user.name || t("there")}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-heading text-sm font-semibold text-accent-soft-ink">
                {initial}
              </span>
            </div>
            <form action={logoutAction}>
              <input type="hidden" name="locale" defaultValue={locale} />
              <button
                type="submit"
                className="text-sm font-medium text-ink-2 transition hover:text-ink"
              >
                {t("signOut")}
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function icons(): Record<NavIcon, ReactNode> {
  const svg = (children: ReactNode) => (
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
  return {
    overview: svg(
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>,
    ),
    calendar: svg(
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </>,
    ),
    clients: svg(
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11l2 2 3-3" />
      </>,
    ),
    requests: svg(
      <>
        <path d="M4 5h16v11H7l-3 3z" />
        <path d="M8 9h8M8 12h5" />
      </>,
    ),
    availability: svg(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>,
    ),
    profile: svg(
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </>,
    ),
    earnings: svg(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2" />
      </>,
    ),
    settings: svg(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3H9l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L2.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1L9 21h6l.3-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4z" />
      </>,
    ),
    appointments: svg(
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4M9 14l2 2 4-4" />
      </>,
    ),
    find: svg(
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>,
    ),
    help: svg(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8M12 17h.01" />
      </>,
    ),
  };
}
