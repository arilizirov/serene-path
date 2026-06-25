import { getTranslations } from "next-intl/server";
import { requireRole } from "@/features/accounts";
import {
  getMyProfileForEdit,
  getAvailabilityRules,
  saveMyProfileAction,
  saveMyAvailabilityAction,
  requestVerificationAction,
  profileCompleteness,
  TherapistForm,
  AvailabilityEditor,
} from "@/features/therapists";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, ProgressBar, PillButton } from "@/components/ui";
import { therapistNav } from "@/components/dashboard-nav";

// Therapist-only; reflects the live profile/status on each load.
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Auth gate FIRST — unchanged from the prior dashboard.
  const { id: userId } = await requireRole("THERAPIST", locale);
  const t = await getTranslations("Dashboard");

  const profile = await getMyProfileForEdit(userId);
  if (!profile) {
    return (
      <DashboardShell
        nav={therapistNav}
        activeKey="profile"
        title={t("profile.title")}
        user={{ name: "" }}
        locale={locale}
      >
        <p className="text-ink-2">{t("profile.notFound")}</p>
      </DashboardShell>
    );
  }
  const completeness = profileCompleteness(profile);
  const rules = await getAvailabilityRules(profile.id);

  return (
    <DashboardShell
      nav={therapistNav}
      activeKey="profile"
      title={t("profile.title")}
      user={{ name: profile.name }}
      locale={locale}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-ink-2">
            <span>
              {t("profile.status")}:{" "}
              <strong className="text-ink">{profile.status}</strong>
            </span>
          </div>
          <ProgressBar value={completeness.percent} label={t("profile.completeness")} />
          {completeness.missing.length > 0 ? (
            <p className="text-sm text-ink-2">
              {t("profile.stillNeeded")}: {completeness.missing.join(", ")}
            </p>
          ) : null}

          {profile.status === "DRAFT" ? (
            completeness.isComplete ? (
              <form action={requestVerificationAction}>
                <input type="hidden" name="locale" defaultValue={locale} />
                <PillButton type="submit" variant="accent" className="self-start">
                  {t("profile.requestVerification")}
                </PillButton>
              </form>
            ) : (
              <p className="text-sm text-ink-2">{t("profile.completeToVerify")}</p>
            )
          ) : profile.status === "PENDING" ? (
            <p className="text-sm text-ink-2">{t("profile.awaiting")}</p>
          ) : profile.status === "VERIFIED" ? (
            <p className="text-sm text-accent">{t("profile.live")}</p>
          ) : (
            <p className="text-sm text-danger">{t("profile.suspended")}</p>
          )}
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold text-ink">
            {t("profile.editHeading")}
          </h2>
          <TherapistForm
            locale={locale}
            initial={profile}
            action={saveMyProfileAction}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold text-ink">
            {t("profile.availabilityHeading")}
          </h2>
          <AvailabilityEditor
            therapistId={profile.id}
            locale={locale}
            initialRules={rules}
            action={saveMyAvailabilityAction}
          />
        </section>
      </div>
    </DashboardShell>
  );
}
