import { getTranslations } from "next-intl/server";
import { DateTime } from "luxon";
import { requireRole } from "@/features/accounts";
import { getMyProfileForEdit, profileCompleteness } from "@/features/therapists";
import { getTherapistAppointments } from "@/features/scheduling";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, StatCard, ProgressBar, PillLink } from "@/components/ui";
import { therapistNav } from "@/components/dashboard-nav";

// Times shown in Israel time for now (matches the rest of the app); per-viewer
// tz rendering is a later refinement.
const DISPLAY_TZ = "Asia/Jerusalem";

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
  const confirmed = upcoming.filter((a) => a.status === "CONFIRMED");
  const pending = upcoming.filter((a) => a.status === "PENDING");
  const next = confirmed[0] ?? null;

  const fmt = (iso: string) =>
    DateTime.fromISO(iso, { zone: "utc" })
      .setZone(DISPLAY_TZ)
      .setLocale(locale)
      .toFormat("ccc d LLL HH:mm");

  // Pending actions the therapist should attend to (empty = all clear).
  const actions: string[] = [];
  if (pending.length > 0) {
    actions.push(t("actions.pendingBookings", { count: pending.length }));
  }
  if (completeness && !completeness.isComplete) {
    actions.push(t("actions.incompleteProfile"));
  }

  return (
    <DashboardShell
      nav={therapistNav}
      activeKey="overview"
      title={t("overview.title")}
      user={{ name: profile?.name ?? "" }}
      locale={locale}
    >
      <div className="flex flex-col gap-6">
        {/* Next session — the hero card. */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-ink">
              {t("overview.nextSession")}
            </h2>
          </div>
          {next ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-ink">
                  {next.clientName || t("overview.aClient")}
                </span>
                <span className="text-sm text-ink-2">{fmt(next.startIso)}</span>
                <span className="text-xs text-ink-3">{t("overview.israelTime")}</span>
              </div>
              {/* Reuses the existing owner-scoped + time-gated join route. */}
              <PillLink
                variant="accent"
                href={`/appointments/${next.id}/session`}
              >
                {t("overview.join")}
              </PillLink>
            </div>
          ) : (
            <p className="text-sm text-ink-2">{t("overview.noNextSession")}</p>
          )}
        </Card>

        {/* Metric tiles. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t("stats.upcoming")}
            value={upcoming.length}
            hint={t("stats.upcomingHint")}
          />
          <StatCard
            label={t("stats.requests")}
            value={pending.length}
            hint={t("stats.requestsHint")}
          />
          <Card className="flex flex-col gap-3 text-start">
            <span className="text-sm text-ink-2">{t("stats.completeness")}</span>
            {completeness ? (
              <>
                <span className="text-3xl font-bold text-ink">
                  {completeness.percent}%
                </span>
                <ProgressBar value={completeness.percent} showLabel={false} />
              </>
            ) : (
              <span className="text-3xl font-bold text-ink-3">—</span>
            )}
          </Card>
        </div>

        {/* Pending actions. */}
        <Card className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold text-ink">
            {t("overview.pendingActions")}
          </h2>
          {actions.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {actions.map((a) => (
                <li
                  key={a}
                  className="flex items-center gap-3 rounded-xl bg-accent-3-soft px-4 py-3 text-sm text-accent-3-soft-ink"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-3"
                    aria-hidden
                  />
                  {a}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-2">{t("overview.allClear")}</p>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
