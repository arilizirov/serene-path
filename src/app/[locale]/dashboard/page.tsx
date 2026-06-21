import { requireRole, logoutAction } from "@/features/accounts";
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

// Therapist-only; reflects the live profile/status on each load.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { id: userId } = await requireRole("THERAPIST", locale);
  const profile = await getMyProfileForEdit(userId);
  if (!profile) {
    return <main className="p-8 text-on-surface-variant">Profile not found.</main>;
  }
  const completeness = profileCompleteness(profile);
  const rules = await getAvailabilityRules(profile.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-on-background">
          Your profile
        </h1>
        <form action={logoutAction}>
          <input type="hidden" name="locale" defaultValue={locale} />
          <button type="submit" className="text-sm text-primary">
            Sign out
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface-container p-5">
        <div className="flex items-center justify-between text-sm text-on-surface-variant">
          <span>
            Status: <strong className="text-on-surface">{profile.status}</strong>
          </span>
          <span>{completeness.percent}% complete</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-container-highest">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>
        {completeness.missing.length > 0 ? (
          <p className="text-sm text-on-surface-variant">
            Still needed: {completeness.missing.join(", ")}
          </p>
        ) : null}

        {profile.status === "DRAFT" ? (
          completeness.isComplete ? (
            <form action={requestVerificationAction}>
              <input type="hidden" name="locale" defaultValue={locale} />
              <button
                type="submit"
                className="self-start rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary"
              >
                Request verification
              </button>
            </form>
          ) : (
            <p className="text-sm text-on-surface-variant">
              Complete your profile to request verification.
            </p>
          )
        ) : profile.status === "PENDING" ? (
          <p className="text-sm text-on-surface-variant">
            Awaiting admin verification.
          </p>
        ) : profile.status === "VERIFIED" ? (
          <p className="text-sm text-tertiary">Your profile is live in search.</p>
        ) : (
          <p className="text-sm text-error">
            Your profile is suspended — please contact support.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold text-on-background">
          Edit profile
        </h2>
        <TherapistForm
          locale={locale}
          initial={profile}
          action={saveMyProfileAction}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold text-on-background">
          Weekly availability
        </h2>
        <AvailabilityEditor
          therapistId={profile.id}
          locale={locale}
          initialRules={rules}
          action={saveMyAvailabilityAction}
        />
      </section>
    </main>
  );
}
