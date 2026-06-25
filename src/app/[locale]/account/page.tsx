import { getTranslations } from "next-intl/server";
import { DateTime } from "luxon";
import { requireRole, getUserContact } from "@/features/accounts";
import { getMyAppointments } from "@/features/scheduling";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, StatCard, PillLink } from "@/components/ui";
import { clientNav } from "@/components/dashboard-nav";

// Times shown in Israel time for now (matches the appointments page); per-viewer
// tz rendering is a later refinement.
const DISPLAY_TZ = "Asia/Jerusalem";

// Client account home — live data, never cached.
export const dynamic = "force-dynamic";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Auth gate FIRST — client-only, same boundary as the rest of the account area.
  const { id: userId } = await requireRole("CLIENT", locale);
  const t = await getTranslations("Client");

  const contact = await getUserContact(userId);
  const name = contact?.name ?? "";

  // The client's own upcoming (non-cancelled) appointments, soonest first. The
  // matched therapist is derived from the next appointment — no new schema.
  const upcoming = await getMyAppointments(userId);
  const pending = upcoming.filter((a) => a.status === "PENDING");
  const next = upcoming[0] ?? null;

  const fmt = (iso: string) =>
    DateTime.fromISO(iso, { zone: "utc" })
      .setZone(DISPLAY_TZ)
      .setLocale(locale)
      .toFormat("ccc d LLL HH:mm");

  // Coarse, human countdown to the next session (days → hours → minutes). Shows
  // an "in progress" hint once the start has passed.
  const countdown = (iso: string): string => {
    const start = DateTime.fromISO(iso, { zone: "utc" });
    const minutes = Math.round(start.diffNow("minutes").minutes);
    if (minutes <= 0) return t("overview.inProgress");
    if (minutes >= 1440) {
      return t("overview.startsIn", {
        label: t("overview.countdownDays", { count: Math.round(minutes / 1440) }),
      });
    }
    if (minutes >= 60) {
      return t("overview.startsIn", {
        label: t("overview.countdownHours", { count: Math.round(minutes / 60) }),
      });
    }
    return t("overview.startsIn", {
      label: t("overview.countdownMinutes", { count: minutes }),
    });
  };

  return (
    <DashboardShell
      nav={clientNav}
      activeKey="overview"
      title={t("overview.title")}
      user={{ name }}
      locale={locale}
    >
      <div className="flex flex-col gap-6">
        <h2 className="font-heading text-xl font-semibold text-ink">
          {name
            ? t("overview.greeting", { name })
            : t("overview.greetingPlain")}
        </h2>

        {next ? (
          <>
            {/* Next appointment — the hero card. */}
            <Card className="flex flex-col gap-4">
              <h3 className="font-heading text-lg font-semibold text-ink">
                {t("overview.nextAppointment")}
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-ink">
                    {next.therapistName || next.therapistTitle}
                  </span>
                  <span className="text-sm text-ink-2">{fmt(next.startIso)}</span>
                  <span className="text-xs text-ink-3">
                    {t("overview.israelTime")} · {countdown(next.startIso)}
                  </span>
                </div>
                {/* Reuses the existing owner-scoped + time-gated join route. */}
                <PillLink
                  variant="accent"
                  href={`/appointments/${next.id}/session`}
                >
                  {t("overview.join")}
                </PillLink>
              </div>
            </Card>

            {/* The matched therapist, derived from the next appointment. */}
            <Card className="flex flex-col gap-3">
              <h3 className="font-heading text-lg font-semibold text-ink">
                {t("overview.yourTherapist")}
              </h3>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold text-ink">
                  {next.therapistName || next.therapistTitle}
                </span>
                {next.therapistName && next.therapistTitle ? (
                  <span className="text-sm text-ink-2">{next.therapistTitle}</span>
                ) : null}
              </div>
              <div>
                <PillLink variant="ghost" href="/appointments">
                  {t("overview.viewAppointments")}
                </PillLink>
              </div>
            </Card>

            {/* Metric tiles — both real, from the same query. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label={t("stats.upcoming")}
                value={upcoming.length}
                hint={t("stats.upcomingHint")}
              />
              <StatCard
                label={t("stats.awaiting")}
                value={pending.length}
                hint={t("stats.awaitingHint")}
              />
            </div>
          </>
        ) : (
          /* No therapist/appointment yet — a friendly resume-intake empty state. */
          <Card className="flex flex-col items-start gap-4">
            <h3 className="font-heading text-xl font-semibold text-ink">
              {t("overview.emptyTitle")}
            </h3>
            <p className="text-sm text-ink-2">{t("overview.emptyBody")}</p>
            <div className="flex flex-wrap gap-3">
              <PillLink variant="primary" href="/">
                {t("overview.resumeIntake")}
              </PillLink>
              <PillLink variant="ghost" href="/therapists">
                {t("overview.emptyCta")}
              </PillLink>
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
