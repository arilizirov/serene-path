import type { ReactNode } from "react";
import { CockpitShell, type CockpitNavItem } from "./cockpit-shell";

// Shared warm shell for EVERY /admin page — the top-nav CockpitShell under the
// scoped `.theme-warm` palette, so the whole admin section is consistent (no more
// blue sidebar on sub-pages). Operator-facing English. Each page just passes its
// activeKey + content.
const ADMIN_NAV: CockpitNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: "grid" },
  { key: "therapists", label: "Therapists", href: "/admin/therapists", icon: "clients" },
  { key: "appointments", label: "Appointments", href: "/admin/appointments", icon: "appointments" },
  { key: "conversations", label: "Conversations", href: "/admin/conversations", icon: "messages" },
  { key: "users", label: "Users", href: "/admin/users", icon: "users" },
  { key: "stats", label: "Stats", href: "/admin/stats", icon: "stats" },
];

export function AdminShell({
  activeKey,
  notifications,
  children,
}: {
  activeKey: string;
  notifications?: number;
  children: ReactNode;
}) {
  return (
    <div className="theme-warm">
      <CockpitShell
        nav={ADMIN_NAV}
        activeKey={activeKey}
        user={{ name: "Admin" }}
        searchPlaceholder="Search therapists, users…"
        notifications={notifications}
      >
        {children}
      </CockpitShell>
    </div>
  );
}

/** A page-level heading + optional action slot for admin sub-pages (the top-nav
 *  shell has no title bar, so pages render their own compact title row). */
export function AdminPageHead({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-heading text-2xl font-bold tracking-[-0.01em] text-ink">{title}</h1>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
