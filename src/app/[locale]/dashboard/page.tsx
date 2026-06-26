import { getTranslations } from "next-intl/server";
import { DateTime } from "luxon";
import { requireRole } from "@/features/accounts";
import { getMyProfileForEdit, profileCompleteness } from "@/features/therapists";
import { getTherapistAppointments } from "@/features/scheduling";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, StatCard, PillLink } from "@/components/ui";
import { AreaChart, Donut } from "@/components/charts";
import { therapistNav } from "@/components/dashboard-nav";

// Times shown in Israel time for now (matches the rest of the app).
const DISPLAY_TZ = "Asia/Jerusalem";
// Module-level "now" helper so it isn't called inline during the component render.
const startOfTodayTz = () => DateTime.now().setZone(DISPLAY_TZ).startOf("day");

// Therapist cockpit home — live data, never cached.
export const dynamic = "force-dynamic";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Auth gate FIRST — therapist-only, unchanged boundary.
  const { id: userId } = await requireRole("THERAPIST", locale);
  const t = await getTranslations("Dashboard");

  const profile = await getMyProfileForEdit(userId);
  const completeness = profile ? profileCompleteness(profile) : null;

  // All upcoming (non-cancelled) appointments for this therapist, soonest first.
  const upcoming = await getTherapistAppointments(userId);
  const pending = upcoming.filter((a) => a.status === "PENDING");
  const next = upcoming.find((a) => a.status === "CONFIRMED") ?? null;

  const fmt = (iso: string) =>
    DateTime.fromISO(iso, { zone: "utc" })
      .setZone(DISPLAY_TZ)
      .setLocale(locale)
      .toFormat("ccc d LLL HH:mm");

  // Appointments per day for the next 7 days — feeds the area chart.
  const start = startOfTodayTz();
  const series = Array.from({ length: 7 }, (_, i) => {
    const day = start.plus({ days: i });
    const value = upcoming.filter((a) =>
      DateTime.fromISO(a.startIso, { zone: "utc" }).setZone(DISPLAY_TZ).hasSame(day, "day"),
    ).length;
    return { label: day.setLocale(locale).toFormat("ccc"), value };
  });
  const weekTotal = series.reduce((s, d) => s + d.value, 0);
  const highlightIdx =
    weekTotal > 0 ? series.reduce((mi, d, i, arr) => (d.value > arr[mi].value ? i : mi), 0) : -1;

  const actions: string[] = [];
  if (pending.length > 0) actions.push(t("actions.pendingBookings", { count: pending.length }));
  if (completeness && !completeness.isComplete) actions.push(t("actions.incompleteProfile"));

  return (
    <DashboardShell
      nav={therapistNav}
      activeKey="overview"
      title={t("overview.title")}
      user={{ name: profile?.name ?? "" }}
      locale={locale}
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label={t("stats.upcoming")} value={upcoming.length} hint={t("stats.upcomingHint")} />
          <StatCard label={t("stats.requests")} value={pending.length} hint={t("stats.requestsHint")} />
          <StatCard label={t("overview.thisWeek")} value={weekTotal} hint={t("overview.israelTime")} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <Card className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-ink">{t("overview.nextSession")}</h2>
              {next ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-heading text-sm font-semibold text-accent-soft-ink">
                      {(next.clientName || "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-ink">{next.clientName || t("overview.aClient")}</span>
                      <span className="text-sm text-ink-2">{fmt(next.startIso)}</span>
                    </div>
                  </div>
                  {/* Reuses the existing owner-scoped + time-gated join route. */}
                  <PillLink variant="accent" href={`/appointments/${next.id}/session`}>
                    {t("overview.join")}
                  </PillLink>
                </div>
              ) : (
                <p className="text-sm text-ink-2">{t("overview.noNextSession")}</p>
              )}
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">{t("overview.thisWeek")}</h2>
                <span className="text-sm text-ink-3">{t("overview.israelTime")}</span>
              </div>
              <AreaChart data={series} highlightIndex={highlightIdx} title={t("overview.thisWeek")} />
            </Card>
          </div>

          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-ink">{t("stats.completeness")}</h2>
            <div className="px-2">
              <Donut
                value={completeness?.percent ?? 0}
                title={completeness ? `${completeness.percent}%` : "—"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink">{t("overview.pendingActions")}</p>
              {actions.length > 0 ? (
                actions.map((a) => (
                  <div key={a} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
                    {a}
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-2">{t("overview.allClear")}</p>
              )}
            </div>
            <PillLink variant="accent" href="/dashboard/profile" className="justify-center py-3">
              {t("nav.profile")}
            </PillLink>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
