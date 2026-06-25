import { Link } from "@/i18n/navigation";
import { countTherapists } from "@/features/therapists";
import { countFinishedSessions } from "@/features/intake";
import { countAllAppointments } from "@/features/scheduling";
import { getSignupStats } from "@/features/accounts";
import { AdminNav } from "./admin-nav";

// Reflect current DB state (counts), not a build-time snapshot.
export const dynamic = "force-dynamic";

// Admin landing. The /admin layout already enforces requireRole("ADMIN"), so this
// page needs no extra guard; it just links into the admin areas with counts.
export default async function AdminDashboardPage() {
  const [therapists, conversations, appointments, signupStats] =
    await Promise.all([
      countTherapists(),
      countFinishedSessions(),
      countAllAppointments(),
      getSignupStats(),
    ]);
  const userCount = Object.values(signupStats.byRole).reduce((a, b) => a + b, 0);
  const cards = [
    { href: "/admin/therapists", label: "Therapists", count: therapists },
    { href: "/admin/conversations", label: "Conversations", count: conversations },
    { href: "/admin/appointments", label: "Appointments", count: appointments },
    { href: "/admin/users", label: "Users", count: userCount },
  ];
  const links = [
    { href: "/admin/schedule", label: "All-therapist schedule" },
    { href: "/admin/stats", label: "Website / intake statistics" },
  ];
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <AdminNav />
      <h1 className="font-heading text-2xl font-bold text-on-background">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex flex-col gap-1 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 hover:border-primary"
          >
            <span className="text-3xl font-bold text-on-surface">{c.count}</span>
            <span className="text-sm font-medium text-primary">{c.label}</span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-primary hover:border-primary"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
