import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { DateTime } from "luxon";
import { requireRole, getUserContact } from "@/features/accounts";
import { getMyAppointments } from "@/features/scheduling";
import { linkSessionToUser, getRecommendationForUser } from "@/features/intake";
import { getTherapistProfile } from "@/features/therapists";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, StatCard, PillLink } from "@/components/ui";
import { clientNav } from "@/components/dashboard-nav";
import { isLocale } from "@/lib/utils";
import {
  confirmPendingBookingAction,
  dismissPendingBookingAction,
} from "./actions";

// Times shown in Israel time for now (matches the appointments page); per-viewer
// tz rendering is a later refinement.
const DISPLAY_TZ = "Asia/Jerusalem";

// Client account home — live data, never cached.
export const dynamic = "force-dynamic";

export default async function ClientOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ booked?: string; error?: string }>;
}) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : "en"; // narrowed for typed feature calls
  const { booked, error } = await searchParams;
  // Auth gate FIRST — client-only, same boundary as the rest of the account area.
  const { id: userId } = await requireRole("CLIENT", locale);
  const t = await getTranslations("Client");

  const contact = await getUserContact(userId);
  const name = contact?.name ?? "";

  // Cookies (read-only in an RSC). The intake-session id was stashed during the
  // anonymous conversation; claim it for this account — idempotent and owner-scoped
  // in the repo (only links a still-anonymous session), so it can't steal one
  // already owned by someone else.
  const jar = await cookies();
  const intakeId = jar.get("sp_intake")?.value;
  if (intakeId) await linkSessionToUser(intakeId, userId);

  const fmt = (iso: string) =>
    DateTime.fromISO(iso, { zone: "utc" })
      .setZone(DISPLAY_TZ)
      .setLocale(locale)
      .toFormat("ccc d LLL HH:mm");

  // A slot the patient picked while signed out, waiting for a one-click confirm.
  const [pendTherapistId, pendStartUtc] = (
    jar.get("sp_pending_booking")?.value ?? ""
  ).split("|");
  const pendingTherapist =
    pendTherapistId && pendStartUtc
      ? await getTherapistProfile(pendTherapistId, loc)
      : null;

  // The client's own upcoming (non-cancelled) appointments, soonest first. The
  // matched therapist is derived from the next appointment — no new schema.
  const upcoming = await getMyAppointments(userId);
  const pending = upcoming.filter((a) => a.status === "PENDING");
  const next = upcoming[0] ?? null;

  // No appointment yet → surface the therapist intake recommended (owner-scoped),
  // unless that's already the one waiting in the confirm card above.
  let recommended: Awaited<ReturnType<typeof getTherapistProfile>> = null;
  if (!next) {
    const recIds = await getRecommendationForUser(userId);
    const recId = recIds.find((id) => id !== pendTherapistId);
    if (recId) recommended = await getTherapistProfile(recId, loc);
  }

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

        {/* Outcome banners after a booking attempt. */}
        {booked ? (
          <div className="rounded-2xl border border-accent-3-soft bg-accent-3-soft px-4 py-3 text-sm font-medium text-accent-3-soft-ink">
            {t("overview.booked")}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-danger/30 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
            {t("overview.bookFailed")}
          </div>
        ) : null}

        {/* Pending booking — the slot picked before sign-up, one click to confirm. */}
        {pendingTherapist ? (
          <Card className="flex flex-col gap-3 border-l-4 border-l-accent">
            <h3 className="font-heading text-lg font-semibold text-ink">
              {t("overview.confirmTitle")}
            </h3>
            <p className="text-sm text-ink-2">
              {t("overview.confirmBody", {
                therapist: pendingTherapist.name,
                time: fmt(pendStartUtc),
              })}
            </p>
            <div className="flex flex-wrap gap-3">
              <form action={confirmPendingBookingAction}>
                <input type="hidden" name="locale" defaultValue={locale} />
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-2 font-medium text-on-primary"
                >
                  {t("overview.confirmCta")}
                </button>
              </form>
              <form action={dismissPendingBookingAction}>
                <input type="hidden" name="locale" defaultValue={locale} />
                <button
                  type="submit"
                  className="rounded-full px-5 py-2 font-medium text-ink-2 hover:bg-surface-2"
                >
                  {t("overview.confirmDismiss")}
                </button>
              </form>
            </div>
          </Card>
        ) : null}

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
          <>
            {/* The therapist intake recommended — resume the journey in one tap. */}
            {recommended ? (
              <Card className="flex flex-col gap-3">
                <h3 className="font-heading text-lg font-semibold text-ink">
                  {t("overview.recommendedTitle")}
                </h3>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold text-ink">
                    {recommended.name}
                  </span>
                  {recommended.title ? (
                    <span className="text-sm text-ink-2">
                      {recommended.title}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-ink-3">
                  {t("overview.recommendedBody")}
                </p>
                <div>
                  <PillLink
                    variant="primary"
                    href={`/therapists/${recommended.id}`}
                  >
                    {t("overview.recommendedCta")}
                  </PillLink>
                </div>
              </Card>
            ) : null}

            {/* No therapist/appointment yet — a friendly resume-intake empty state. */}
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
          </>
        )}
      </div>
    </DashboardShell>
  );
}
