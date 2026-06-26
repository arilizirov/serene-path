import { getTranslations } from "next-intl/server";
import { countTherapists } from "@/features/therapists";
import { countFinishedSessions } from "@/features/intake";
import { countAllAppointments } from "@/features/scheduling";
import { getSignupStats, getSignupsPerDay } from "@/features/accounts";
import { getCostStats } from "@/server/ai";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";
import { Card, StatCard, PillLink } from "@/components/ui";
import { AreaChart, BarChart, Donut } from "@/components/charts";

// Reflect current DB state (counts), not a build-time snapshot.
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toFixed(2)}`;
const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// Admin landing — a dense analytics overview composed in the shared dashboard
// layout, mirroring the dashboard1 reference (3-zone): headline stat cards; a
// 2/3 MAIN column with a Signups area-chart card + an API-usage comparison card
// (today / 7-day / all-time, with a full-width accent CTA bar); and a 1/3 RIGHT
// RAIL community card (clients-share donut + recent-signups box + by-role
// breakdown + a CTA). The /admin layout already enforces requireRole("ADMIN");
// this page just reads + displays.
export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const [
    therapists,
    conversations,
    appointments,
    signupStats,
    signupsPerDay,
    costStats,
  ] = await Promise.all([
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

  // Peak-day highlight for the signups line (the busiest day in the window).
  const signupsTotal = signupsPerDay.reduce((s, d) => s + d.value, 0);
  const peakIdx =
    signupsTotal > 0
      ? signupsPerDay.reduce(
          (mi, d, i, arr) => (d.value > arr[mi].value ? i : mi),
          0,
        )
      : -1;

  // Week-over-week signups (this 7 days vs the prior 7) — the reference's
  // "Comparison" hero, adapted to admin data: two paned mini bar charts.
  const lastWeek = signupsPerDay.slice(0, 7);
  const thisWeek = signupsPerDay.slice(7);
  const sum = (xs: { value: number }[]) => xs.reduce((s, d) => s + d.value, 0);
  const thisWeekTotal = sum(thisWeek);
  const lastWeekTotal = sum(lastWeek);
  const weekDelta =
    lastWeekTotal > 0
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : thisWeekTotal > 0
        ? 100
        : 0;
  const dayBars = (xs: { label: string; value: number }[]) =>
    xs.map((d) => ({ label: d.label.split(" ")[1] ?? d.label, value: d.value }));
  const peakOf = (xs: { value: number }[]) =>
    xs.length ? xs.reduce((mi, d, i, a) => (d.value > a[mi].value ? i : mi), 0) : -1;

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
      <div className="flex flex-col gap-6">
        {/* Headline stat cards */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard label="Therapists" value={therapists} />
          <StatCard label="Conversations" value={conversations} />
          <StatCard label="Appointments" value={appointments} />
          <StatCard
            label="Users"
            value={userCount}
            delta={
              signupStats.recent > 0
                ? { value: `+${signupStats.recent}`, dir: "up" }
                : undefined
            }
            hint={`new in ${signupStats.recentDays} days`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column (2/3) */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Comparison — week-over-week signups, paired mini bar charts +
                a full-width CTA bar (the reference's hero card). */}
            <Card className="flex flex-col gap-5 p-0">
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-lg font-bold text-ink">Comparison</h2>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-3"
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 8h13l-3-3M20 16H7l3 3" />
                  </svg>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 px-6">
                <ComparePane
                  label="This week"
                  total={thisWeekTotal}
                  delta={weekDelta}
                  bars={dayBars(thisWeek)}
                  peak={peakOf(thisWeek)}
                />
                <ComparePane
                  label="Last week"
                  total={lastWeekTotal}
                  bars={dayBars(lastWeek)}
                  peak={peakOf(lastWeek)}
                  bordered
                />
              </div>
              <PillLink
                href={`/${locale}/admin/stats`}
                variant="accent"
                className="mx-6 mb-6 justify-center py-3"
              >
                See details
              </PillLink>
            </Card>

            {/* Signups report card — the new daily trend line */}
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

            {/* API usage — a comparison across windows + a full-width CTA bar */}
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

          {/* Right rail (1/3) — community */}
          <Card className="flex flex-col gap-5 lg:col-span-1">
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
              <p className="text-xs text-ink-3">
                in the last {signupStats.recentDays} days
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-sm font-medium text-ink">By role</p>
              {roleRows.map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: r.color }}
                  />
                  <span className="flex-1 text-ink-2">{r.label}</span>
                  <span className="font-medium text-ink">{r.n}</span>
                </div>
              ))}
            </div>
            <PillLink
              href={`/${locale}/admin/stats`}
              variant="accent"
              className="justify-center py-3"
            >
              View statistics
            </PillLink>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

/** One side of the week-over-week comparison: period label, big total, an
 *  optional colored delta % (green up / danger down), and a mini bar chart with
 *  the period's peak day highlighted. `bordered` adds the dividing rule (RTL-safe). */
function ComparePane({
  label,
  total,
  delta,
  bars,
  peak,
  bordered,
}: {
  label: string;
  total: number;
  delta?: number;
  bars: { label: string; value: number }[];
  peak: number;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 ${bordered ? "border-s border-border ps-4" : ""}`}
    >
      <p className="text-sm text-ink-3">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-ink">{total}</span>
        {delta !== undefined ? (
          <span
            className={`text-xs font-semibold ${delta >= 0 ? "text-accent-2" : "text-danger"}`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        ) : null}
      </p>
      <BarChart data={bars} highlightIndex={peak} title={`${label} signups`} />
    </div>
  );
}

/** One window pane in the API-usage comparison: label, big est-$ figure, and a
 *  tokens/calls sub-line. `highlight` tints the figure with the accent ink;
 *  `bordered` adds a leading divider to set windows apart (RTL-safe `border-s`). */
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
    <div
      className={`flex flex-col gap-1 ${bordered ? "border-s border-border ps-4" : ""}`}
    >
      <p className="text-sm text-ink-3">{label}</p>
      <p
        className={`text-2xl font-bold ${highlight ? "text-accent-soft-ink" : "text-ink"}`}
      >
        {usd(w.estCostUsd)}
      </p>
      <p className="text-xs text-ink-3">
        {compact(w.totalTokens)} tokens · {w.calls} calls
      </p>
    </div>
  );
}
