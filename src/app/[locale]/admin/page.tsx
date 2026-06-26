import { getTranslations } from "next-intl/server";
import { countTherapists } from "@/features/therapists";
import { countFinishedSessions } from "@/features/intake";
import { countAllAppointments } from "@/features/scheduling";
import { getSignupStats } from "@/features/accounts";
import { getCostStats } from "@/server/ai";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";
import { Card, StatCard, PillLink } from "@/components/ui";
import { Donut } from "@/components/charts";

// Reflect current DB state (counts), not a build-time snapshot.
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toFixed(2)}`;
const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// Admin landing — an analytics overview composed in the shared dashboard layout
// (stat cards + a main usage card + a right-rail community breakdown). The /admin
// layout already enforces requireRole("ADMIN"); this page just reads + displays.
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

  const clients = signupStats.byRole.CLIENT ?? 0;
  const therapistUsers = signupStats.byRole.THERAPIST ?? 0;
  const admins = signupStats.byRole.ADMIN ?? 0;
  const userCount = clients + therapistUsers + admins;

  const windows: { label: string; w: { estCostUsd: number; totalTokens: number; calls: number } }[] = [
    { label: "Today", w: costStats.today },
    { label: "Last 7 days", w: costStats.last7Days },
    { label: "All-time", w: costStats.allTime },
  ];
  const roleRows: { label: string; n: number; color: string }[] = [
    { label: "Clients", n: clients, color: "var(--color-accent)" },
    { label: "Therapists", n: therapistUsers, color: "var(--color-accent-2)" },
    { label: "Admins", n: admins, color: "var(--color-ink-3)" },
  ];

  return (
    <DashboardShell
      nav={adminNav}
      activeKey="dashboard"
      title={t("title.dashboard")}
      user={{ name: t("principal") }}
      locale={locale}
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Therapists" value={therapists} />
          <StatCard label="Conversations" value={conversations} />
          <StatCard label="Appointments" value={appointments} />
          <StatCard
            label="Users"
            value={userCount}
            delta={signupStats.recent > 0 ? { value: `+${signupStats.recent}`, dir: "up" } : undefined}
            hint={`new in ${signupStats.recentDays} days`}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="flex flex-col gap-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">API usage</h2>
              <span className="text-sm text-ink-3">estimated · OpenAI</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {windows.map(({ label, w }) => (
                <div key={label} className="rounded-xl bg-surface-2 p-4">
                  <p className="text-sm text-ink-3">{label}</p>
                  <p className="text-2xl font-bold text-ink">{usd(w.estCostUsd)}</p>
                  <p className="text-xs text-ink-3">
                    {compact(w.totalTokens)} tokens · {w.calls} calls
                  </p>
                </div>
              ))}
            </div>
            <PillLink href={`/${locale}/admin/costs`} variant="accent" className="justify-center py-3">
              View cost details
            </PillLink>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-ink">Community</h2>
            <div className="px-2">
              <Donut
                value={clients}
                max={Math.max(1, userCount)}
                title={`${clients} of ${userCount} users are clients`}
                subLabel="are clients"
              />
            </div>
            <div className="flex flex-col gap-2.5">
              {roleRows.map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                  <span className="flex-1 text-ink-2">{r.label}</span>
                  <span className="font-medium text-ink">{r.n}</span>
                </div>
              ))}
            </div>
            <PillLink href={`/${locale}/admin/stats`} variant="accent" className="justify-center py-3">
              View statistics
            </PillLink>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
