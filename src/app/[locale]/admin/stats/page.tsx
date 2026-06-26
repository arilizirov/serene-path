import { getTranslations } from "next-intl/server";
import { getIntakeStats } from "@/features/intake";
import { getSignupStats, getSignupsPerDay } from "@/features/accounts";
import { getTherapistPipeline } from "@/features/therapists";
import { getAppointmentStatusCounts } from "@/features/scheduling";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";
import { Card, StatCard, PillLink } from "@/components/ui";
import { BarChart, Donut, AreaChart } from "@/components/charts";

// Always reflect current DB state; also avoids coupling `next build` to a live DB.
export const dynamic = "force-dynamic";

// Funnel state order + short labels for the bar chart (full enum names are too long).
const FUNNEL_ORDER = [
  "GREETING", "GATHER", "MIRROR", "CONFIRM", "MATCH", "PRESENT_OPTIONS", "FOLLOWUP", "CLARIFY", "CRISIS",
] as const;
const FUNNEL_LABEL: Record<string, string> = {
  GREETING: "Greet", GATHER: "Gather", MIRROR: "Mirror", CONFIRM: "Confirm",
  MATCH: "Match", PRESENT_OPTIONS: "Options", FOLLOWUP: "Follow", CLARIFY: "Clarify", CRISIS: "Crisis",
};

/** A small breakdown card: title + dot-prefixed label/count rows. */
function BreakdownCard({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-ink-3">No data yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent-soft" />
              <span className="flex-1 truncate text-ink-2">{k.toLowerCase()}</span>
              <span className="font-medium text-ink">{v}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// Website / intake statistics — DB-derived (no trackers), composed in the shared
// dashboard layout: headline stat cards + an intake-funnel bar chart + a match-rate
// donut + by-engine breakdown, then signups / pipeline / bookings breakdown cards.
export default async function AdminStatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const [intake, signups, signupsPerDay, pipeline, bookings] = await Promise.all([
    getIntakeStats(),
    getSignupStats(),
    getSignupsPerDay(14),
    getTherapistPipeline(),
    getAppointmentStatusCounts(),
  ]);

  const matchPct = Math.round(intake.matchRate * 100);
  const signupsTotal = signupsPerDay.reduce((s, d) => s + d.value, 0);
  const peakIdx =
    signupsTotal > 0
      ? signupsPerDay.reduce(
          (mi, d, i, arr) => (d.value > arr[mi].value ? i : mi),
          0,
        )
      : -1;
  const funnelData = FUNNEL_ORDER.map((s) => ({
    label: FUNNEL_LABEL[s],
    value: intake.byState[s] ?? 0,
  })).filter((d, i) => d.value > 0 || FUNNEL_ORDER[i] === "GATHER" || FUNNEL_ORDER[i] === "MATCH");
  const matchIdx = funnelData.findIndex((d) => d.label === "Match");

  const engines: { label: string; n: number; color: string }[] = [
    { label: "AI conversation", n: intake.engines.ai, color: "var(--color-accent)" },
    { label: "Guided (chips)", n: intake.engines.scripted, color: "var(--color-accent-2)" },
    { label: "Dropped early", n: intake.engines.none, color: "var(--color-ink-3)" },
  ];

  return (
    <DashboardShell
      nav={adminNav}
      activeKey="stats"
      title={t("title.stats")}
      user={{ name: t("principal") }}
      locale={locale}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard label="Intake sessions" value={intake.total} />
          <StatCard label="Matched" value={intake.matched} />
          <StatCard label="Match rate" value={`${matchPct}%`} />
          <StatCard label={`New signups (${signups.recentDays}d)`} value={signups.recent} />
        </div>

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex flex-col gap-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Intake funnel</h2>
              <span className="text-sm text-ink-3">by state</span>
            </div>
            {funnelData.length > 0 ? (
              <BarChart data={funnelData} highlightIndex={matchIdx} title="Intake sessions by state" />
            ) : (
              <p className="text-sm text-ink-3">No intake sessions yet.</p>
            )}
            <PillLink href={`/${locale}/admin/conversations`} variant="accent" className="justify-center py-3">
              View conversations
            </PillLink>
          </Card>

          <Card className="flex flex-col items-center gap-4">
            <h2 className="self-start text-lg font-bold text-ink">Match rate</h2>
            <Donut value={intake.matched} max={Math.max(1, intake.total)} title={`${matchPct}% of intakes matched`} subLabel="matched" />
            <div className="flex w-full flex-col gap-2 text-sm">
              {engines.map((e) => (
                <div key={e.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: e.color }} />
                  <span className="flex-1 text-ink-2">{e.label}</span>
                  <span className="font-medium text-ink">{e.n}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <BreakdownCard title="Signups by role" counts={signups.byRole} />
          <BreakdownCard title="Therapist pipeline" counts={pipeline} />
          <BreakdownCard title="Bookings by status" counts={bookings} />
        </div>
      </div>
    </DashboardShell>
  );
}
