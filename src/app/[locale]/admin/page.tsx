import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { countTherapists } from "@/features/therapists";
import { countFinishedSessions } from "@/features/intake";
import { countAllAppointments } from "@/features/scheduling";
import { getSignupStats, getSignupsPerDay } from "@/features/accounts";
import { getCostStats } from "@/server/ai";
import { AdminShell } from "@/components/admin-shell";
import { Card, PillLink } from "@/components/ui";
import { AreaChart, Donut } from "@/components/charts";

// Admin landing — warm "fitplan" treatment, COMPACT so it fits one viewport, with
// 10 hot-action buttons up top. All colour comes from the warm theme tokens. Live
// admin reads; requireRole("ADMIN") in the layout; never cached.
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toFixed(2)}`;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

type Hot = { label: string; href: string; icon: string };
const HOT: Hot[] = [
  { label: "Add therapist", href: "/admin/therapists/new", icon: "add" },
  { label: "Therapists", href: "/admin/therapists", icon: "clients" },
  { label: "Appointments", href: "/admin/appointments", icon: "appointments" },
  { label: "Schedule", href: "/admin/schedule", icon: "calendar" },
  { label: "Conversations", href: "/admin/conversations", icon: "messages" },
  { label: "Users", href: "/admin/users", icon: "users" },
  { label: "Add admin", href: "/admin/users", icon: "shield" },
  { label: "Statistics", href: "/admin/stats", icon: "stats" },
  { label: "API costs", href: "/admin/costs", icon: "costs" },
  { label: "Export data", href: "/admin/conversations", icon: "export" },
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
      ? signupsPerDay.reduce((mi, d, i, a) => (d.value > a[mi].value ? i : mi), 0)
      : -1;

  const roleRows: { label: string; n: number; color: string }[] = [
    { label: "Clients", n: clients, color: "var(--color-accent)" },
    { label: "Therapists", n: therapistUsers, color: "var(--color-accent-2)" },
    { label: "Admins", n: admins, color: "var(--color-ink-3)" },
  ];

  return (
    <AdminShell activeKey="dashboard" notifications={signupStats.recent}>
      <div className="flex flex-col gap-4">
        {/* Greeting */}
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-[-0.01em] text-ink">
            Have a good day, Admin 👋
          </h1>
          <p className="text-sm text-ink-2">
            {userCount} members · {therapists} therapists · {conversations} conversations ·{" "}
            <span className="font-semibold text-accent">{signupStats.recent} new</span> this month
          </p>
        </div>

        {/* 10 hot actions */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {HOT.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center shadow-card transition hover:border-accent hover:bg-accent-soft"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-ink">
                <HotIcon name={a.icon} />
              </span>
              <span className="text-xs font-medium leading-tight text-ink">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Stats + charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Therapists" value={therapists} />
              <StatTile label="Conversations" value={conversations} />
              <StatTile label="Appointments" value={appointments} />
              <StatTile label="Users" value={userCount} accent={`+${signupStats.recent}`} />
            </div>

            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink">Signups</h2>
                <span className="text-xs text-ink-3">last 14 days · {signupsTotal} total</span>
              </div>
              <div className="h-40 [&>svg]:!h-full [&>svg]:!w-full">
                <AreaChart data={signupsPerDay} highlightIndex={peakIdx} title="New signups per day" />
              </div>
            </Card>

            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-5">
                <UsagePane label="Today" w={costStats.today} highlight />
                <UsagePane label="7 days" w={costStats.last7Days} />
                <UsagePane label="All-time" w={costStats.allTime} />
              </div>
              <PillLink href={`/${locale}/admin/costs`} variant="accent" className="py-2 text-xs">
                Cost details
              </PillLink>
            </Card>
          </div>

          {/* Community rail */}
          <Card className="flex flex-col gap-3 p-4">
            <h2 className="text-base font-bold text-ink">Community</h2>
            <div className="mx-auto max-w-[160px]">
              <Donut value={clients} max={Math.max(1, userCount)} title="clients share" subLabel="are clients" />
            </div>
            <div className="flex flex-col gap-2">
              {roleRows.map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                  <span className="flex-1 text-ink-2">{r.label}</span>
                  <span className="font-semibold text-ink">{r.n}</span>
                </div>
              ))}
            </div>
            <PillLink href={`/${locale}/admin/users`} variant="accent" className="justify-center py-2.5">
              Manage users
            </PillLink>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <p className="text-xs text-ink-2">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-ink">{value}</span>
        {accent ? <span className="text-xs font-semibold text-accent">{accent}</span> : null}
      </p>
    </div>
  );
}

function UsagePane({
  label,
  w,
  highlight,
}: {
  label: string;
  w: { estCostUsd: number; totalTokens: number; calls: number };
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-ink-3">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-accent" : "text-ink"}`}>{usd(w.estCostUsd)}</p>
      <p className="text-[11px] text-ink-3">{compact(w.totalTokens)} tok · {w.calls}</p>
    </div>
  );
}

function HotIcon({ name }: { name: string }): ReactNode {
  const inner: Record<string, ReactNode> = {
    add: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s4 1 5 2M17 14v6M14 17h6" /></>,
    clients: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11l2 2 3-3" /></>,
    appointments: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M9 14l2 2 4-4" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
    messages: <path d="M4 5h16v11H7l-3 3zM8 9h8M8 12h5" />,
    users: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
    shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9.5 12l1.8 1.8L15 10" />,
    stats: <><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="0.5" /><rect x="12" y="7" width="3" height="10" rx="0.5" /><rect x="17" y="13" width="3" height="4" rx="0.5" /></>,
    costs: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2" /></>,
    export: <path d="M12 3v12M8 11l4 4 4-4M4 19h16" />,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {inner[name] ?? null}
    </svg>
  );
}
