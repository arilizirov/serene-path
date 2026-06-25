import { Link } from "@/i18n/navigation";

// Shared admin portal navigation (server component). Rendered by each admin page
// so the portal is navigable between its areas. Kept presentational — the /admin
// layout already enforces requireRole("ADMIN"), so this adds no authz of its own.
const LINKS: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/therapists", label: "Therapists" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/conversations", label: "Conversations" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/costs", label: "Costs" },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-outline-variant pb-3 text-sm">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-on-surface-variant hover:text-primary"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
