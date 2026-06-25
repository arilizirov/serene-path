// Per-role sidebar manifests for the dashboard shell. Each item names a message
// key (resolved against the `Dashboard` catalog) and an icon key (mapped to a
// dependency-free inline SVG in dashboard-shell). `soon` marks present-but-
// stubbed items so the shell can render a muted "soon" badge.
//
// This pass only Overview and Profile are real; the rest are present-but-stubbed
// links (a shared "coming soon" stub page) so the sidebar reads complete.

export type NavIcon =
  | "overview"
  | "calendar"
  | "clients"
  | "requests"
  | "availability"
  | "profile"
  | "earnings"
  | "settings"
  | "appointments"
  | "find"
  | "stats"
  | "help";

export type NavItem = {
  key: string;
  href: string;
  labelKey: string;
  icon: NavIcon;
  soon?: boolean;
};

/** Therapist cockpit sidebar (T1). Overview + Profile work this pass. */
export const therapistNav: NavItem[] = [
  { key: "overview", href: "/dashboard", labelKey: "overview", icon: "overview" },
  {
    key: "calendar",
    href: "/dashboard/calendar",
    labelKey: "calendar",
    icon: "calendar",
    soon: true,
  },
  {
    key: "clients",
    href: "/dashboard/clients",
    labelKey: "clients",
    icon: "clients",
    soon: true,
  },
  {
    key: "requests",
    href: "/dashboard/requests",
    labelKey: "requests",
    icon: "requests",
    soon: true,
  },
  {
    key: "availability",
    href: "/dashboard/profile",
    labelKey: "availability",
    icon: "availability",
  },
  { key: "profile", href: "/dashboard/profile", labelKey: "profile", icon: "profile" },
  {
    key: "earnings",
    href: "/dashboard/earnings",
    labelKey: "earnings",
    icon: "earnings",
    soon: true,
  },
  {
    key: "settings",
    href: "/dashboard/settings",
    labelKey: "settings",
    icon: "settings",
    soon: true,
  },
];

/** Admin portal sidebar. One item per /admin section (mirrors the old flat
 *  AdminNav link row), in the same order. Labels resolve against the shared
 *  `Dashboard` catalog (`nav.<labelKey>`), like the other manifests. */
export const adminNav: NavItem[] = [
  { key: "dashboard", href: "/admin", labelKey: "adminDashboard", icon: "overview" },
  {
    key: "therapists",
    href: "/admin/therapists",
    labelKey: "adminTherapists",
    icon: "clients",
  },
  {
    key: "schedule",
    href: "/admin/schedule",
    labelKey: "adminSchedule",
    icon: "calendar",
  },
  {
    key: "appointments",
    href: "/admin/appointments",
    labelKey: "adminAppointments",
    icon: "appointments",
  },
  {
    key: "conversations",
    href: "/admin/conversations",
    labelKey: "adminConversations",
    icon: "requests",
  },
  { key: "users", href: "/admin/users", labelKey: "adminUsers", icon: "profile" },
  { key: "stats", href: "/admin/stats", labelKey: "adminStats", icon: "stats" },
  { key: "costs", href: "/admin/costs", labelKey: "adminCosts", icon: "earnings" },
];

/** Client account sidebar. Overview + Appointments work this pass; the rest are
 *  present-but-stubbed links (a shared "coming soon" stub) so the sidebar reads
 *  complete. Find a therapist points at the existing public directory. */
export const clientNav: NavItem[] = [
  { key: "overview", href: "/account", labelKey: "overview", icon: "overview" },
  {
    key: "appointments",
    href: "/appointments",
    labelKey: "appointments",
    icon: "appointments",
  },
  { key: "find", href: "/therapists", labelKey: "find", icon: "find" },
  {
    key: "therapist",
    href: "/account/therapist",
    labelKey: "myTherapist",
    icon: "clients",
    soon: true,
  },
  {
    key: "forms",
    href: "/account/forms",
    labelKey: "forms",
    icon: "requests",
    soon: true,
  },
  {
    key: "billing",
    href: "/account/billing",
    labelKey: "billing",
    icon: "earnings",
    soon: true,
  },
  {
    key: "settings",
    href: "/account/settings",
    labelKey: "accountSettings",
    icon: "settings",
    soon: true,
  },
];
