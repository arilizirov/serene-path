import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { countTherapists } from "@/features/therapists";
import { countFinishedSessions } from "@/features/intake";
import { countAllAppointments } from "@/features/scheduling";
import { getSignupStats } from "@/features/accounts";
import { getCostStats } from "@/server/ai";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";

// Reflect current DB state (counts), not a build-time snapshot.
export const dynamic = "force-dynamic";

// Admin landing. The /admin layout already enforces requireRole("ADMIN"), so this
// page needs no extra guard; it just links into the admin areas with counts.
export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const [therapists, conversations, appointments, signupStats, costStats] =
    await Promise.all([
      countTherapists(),
      countFinishedSessions(),
      countAllAppointments(),
      getSignupStats(),
      getCostStats(),
    ]);
  const userCount = Object.values(signupStats.byRole).reduce((a, b) => a + b, 0);
  const cards = [
    { href: "/admin/therapists", label: "Therapists", count: therapists },
    { href: "/admin/conversations", label: "Conversations", count: conversations },
    { href: "/admin/appointments", label: "Appointments", count: appointments },
    { href: "/admin/users", label: "Users", count: userCount },
    // ~est API cost, all-time (estimate — see /admin/costs).
    {
      href: "/admin/costs",
      label: "API cost (est., all-time)",
      count: `~$${costStats.allTime.estCostUsd.toFixed(2)}`,
    },
  ];
  const links = [
    { href: "/admin/schedule", label: "All-therapist schedule" },
    { href: "/admin/stats", label: "Website / intake statistics" },
  ];
  return (
    <DashboardShell
      nav={adminNav}
      activeKey="dashboard"
      title={t("title.dashboard")}
      user={{ name: t("principal") }}
      locale={locale}
    >
      <div className="flex flex-col gap-6">
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
      </div>
    </DashboardShell>
  );
}
