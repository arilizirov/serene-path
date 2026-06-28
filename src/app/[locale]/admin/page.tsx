import { countTherapists } from "@/features/therapists";
import { countFinishedSessions } from "@/features/intake";
import { countAllAppointments } from "@/features/scheduling";
import { getSignupStats, getSignupsPerDay } from "@/features/accounts";
import { getCostStats } from "@/server/ai";
import { CockpitShell, type CockpitNavItem } from "@/components/cockpit-shell";
import { CockpitGreeting, type QuickAction } from "@/components/cockpit/cockpit-greeting";
import { Card, StatCard, PillLink } from "@/components/ui";
import { AreaChart, Donut } from "@/components/charts";

// Admin landing — the warm "fitplan" cockpit treatment (top nav + gradient hero +
// warm cards) over live admin reads. Operator-facing English; requireRole("ADMIN")
// in the /admin layout; warm palette scoped via `.theme-warm`. Never cached.
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toFixed(2)}`;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

const NAV: CockpitNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: "grid" },
  { key: "therapists", label: "Therapists", href: "/admin/therapists", icon: "clients" },
  { key: "appointments", label: "Appointments", href: "/admin/appointments", icon: "appointments" },
  { key: "conversations", label: "Conversations", href: "/admin/conversations", icon: "messages" },
  { key: "users", label: "Users", href: "/admin/users", icon: "users" },
  { key: "stats", label: "Stats", href: "/admin/stats", icon: "stats" },
];

const ACTIONS: QuickAction[] = [
  { key: "therapists", label: "Therapists", href: "/admin/therapists", icon: "profile" },
  { key: "conversations", label: "Conversations", href: "/admin/conversations", icon: "message" },
  { key: "stats", label: "Statistics", href: "/admin/stats", icon: "slot" },
];

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [therapists, conversations, appointments, signupStats, signupsPerDay, costStats] =
    await Promise.all([
      countTherapists(),
      countFinishedSessions(),
      countAllAppointments(),
      getSignupStats(),
      getSignupsPerDay(14),
      getCostStats(),
    ]);

  const clients = signupStats.byRole.CLIENT ?? 0;
  const therapistUsers = signupStats.byRole.THERAPIST ?? 0;
  const admins = signupStats.byRole.ADMIN ?? 0;
  const userCount = clients + therapistUsers + admins;

  const signupsTotal = signupsPerDay.reduce((s, d) => s + d.value, 0);
  const peakIdx =
    signupsTotal > 0
      ? signupsPerDay.reduce((mi, d, i, arr) => (d.value > arr[mi].value ? i : mi), 0)
      : -1;

  const roleRows: { label: string; n: number; color: string }[] = [
    { label: "Clients", n: clients, color: "var(--color-accent)" },
    { label: "Therapists", n: therapistUsers, color: "var(--color-accent-2)" },
    { label: "Admins", n: admins, color: "var(--color-ink-3)" },
  ];

  return (
    <div className="theme-warm">
      <CockpitShell
        nav={NAV}
        activeKey="dashboard"
        user={{ name: "Admin" }}
        searchPlaceholder="Search therapists, users…"
        notifications={signupStats.recent}
      >
        <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          {/* Main column */}
          <div className="flex flex-col gap-5">
            {/* Highlight hero — recent growth, warm gradient + calm art. */}
            <div className="relative isolate flex min-h-[210px] flex-col justify-end overflow-hidden rounded-3xl p-6 shadow-card">
              <HeroArt />
              <div className="relative z-10 max-w-sm rounded-2xl bg-surface/95 p-5 shadow-card backdrop-blur">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-soft-ink">
                  Last {signupStats.recentDays} days
                </p>
                <h2 className="mt-1 flex items-baseline gap-2 font-heading text-3xl font-bold tracking-[-0.01em] text-ink">
                  {signupStats.recent}
                  <span className="text-sm font-semibold text-accent-2">new members</span>
                </h2>
                <p className="mt-1 text-sm text-ink-2">
                  {userCount} members · {therapists} therapists · {conversations} conversations
                </p>
                <PillLink
                  href={`/${locale}/admin/stats`}
                  variant="accent"
                  className="mt-4 py-2.5"
                >
                  View statistics
                </PillLink>
              </div>
            </div>

            {/* Headline stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Therapists" value={therapists} />
              <StatCard label="Conversations" value={conversations} />
              <StatCard label="Appointments" value={appointments} />
              <StatCard
                label="Users"
                value={userCount}
                delta={signupStats.recent > 0 ? { value: `+${signupStats.recent}`, dir: "up" } : undefined}
              />
            </div>

            {/* Signups report */}
            <Card className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Signups</h2>
                <span className="text-sm text-ink-3">last 14 days</span>
              </div>
              <AreaChart
                data={signupsPerDay}
                highlightIndex={peakIdx}
                title="New signups per day (last 14 days)"
              />
              <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="text-ink-3">New accounts this window</span>
                <span className="font-semibold text-ink">{signupsTotal}</span>
              </div>
            </Card>

            {/* API usage */}
            <Card className="flex flex-col gap-5 p-0">
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-lg font-bold text-ink">API usage</h2>
                <span className="text-sm text-ink-3">estimated · OpenAI</span>
              </div>
              <div className="grid grid-cols-3 gap-4 px-6">
                <UsagePane label="Today" w={costStats.today} highlight />
                <UsagePane label="Last 7 days" w={costStats.last7Days} bordered />
                <UsagePane label="All-time" w={costStats.allTime} bordered />
              </div>
              <PillLink
                href={`/${locale}/admin/costs`}
                variant="accent"
                className="mx-6 mb-6 justify-center py-3"
              >
                View cost details
              </PillLink>
            </Card>
          </div>

          {/* Right rail */}
          <div className="flex flex-col gap-5">
            <CockpitGreeting
              heading="Have a good day, Admin 👋"
              subtitle="Here's your platform at a glance — members, conversations, and costs."
              actions={ACTIONS}
            />
            <Card className="flex flex-col gap-5">
              <h2 className="text-lg font-bold text-ink">Community</h2>
              <div className="px-2">
                <Donut
                  value={clients}
                  max={Math.max(1, userCount)}
                  title={`${clients} of ${userCount} users are clients`}
                  subLabel="are clients"
                />
              </div>
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="text-sm text-ink-3">Recent signups</p>
                <p className="text-2xl font-bold text-ink">{signupStats.recent}</p>
                <p className="text-xs text-ink-3">in the last {signupStats.recentDays} days</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="text-sm font-medium text-ink">By role</p>
                {roleRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                    <span className="flex-1 text-ink-2">{r.label}</span>
                    <span className="font-medium text-ink">{r.n}</span>
                  </div>
                ))}
              </div>
              <PillLink href={`/${locale}/admin/users`} variant="accent" className="justify-center py-3">
                Manage users
              </PillLink>
            </Card>
          </div>
        </div>
      </CockpitShell>
    </div>
  );
}

function HeroArt() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 600 220"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="adminSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9b0" />
          <stop offset="0.6" stopColor="#ffb38a" />
          <stop offset="1" stopColor="#f59f7e" />
        </linearGradient>
      </defs>
      <rect width="600" height="220" fill="url(#adminSky)" />
      <circle cx="470" cy="70" r="46" fill="#fff1dd" opacity="0.85" />
      <path d="M0 178 Q160 140 330 172 T600 162 V220 H0 Z" fill="#ec7a4c" opacity="0.9" />
    </svg>
  );
}

function UsagePane({
  label,
  w,
  highlight,
  bordered,
}: {
  label: string;
  w: { estCostUsd: number; totalTokens: number; calls: number };
  highlight?: boolean;
  bordered?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${bordered ? "border-s border-border ps-4" : ""}`}>
      <p className="text-sm text-ink-3">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-accent-soft-ink" : "text-ink"}`}>
        {usd(w.estCostUsd)}
      </p>
      <p className="text-xs text-ink-3">
        {compact(w.totalTokens)} tokens · {w.calls} calls
      </p>
    </div>
  );
}
