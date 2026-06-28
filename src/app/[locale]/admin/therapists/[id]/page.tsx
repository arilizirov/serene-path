import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  getTherapistForEdit,
  getAvailabilityRules,
  getBlockedDates,
  TherapistForm,
  AvailabilityEditor,
  BlockedDatesEditor,
  DeleteTherapistButton,
} from "@/features/therapists";
import { AdminShell, AdminPageHead } from "@/components/admin-shell";

// Always load the current profile for editing (no build-time snapshot).
export const dynamic = "force-dynamic";

export default async function EditTherapistPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("Admin");
  const therapist = await getTherapistForEdit(id);
  if (!therapist) notFound();
  const rules = await getAvailabilityRules(id);
  const blockedDates = await getBlockedDates(id);

  return (
    <AdminShell activeKey="therapists">
      <AdminPageHead title={t("title.therapistEdit")} />
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-bold text-on-background">
          Edit therapist
        </h1>
        <TherapistForm locale={locale} initial={therapist} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold text-on-background">
          Weekly availability
        </h2>
        <AvailabilityEditor therapistId={id} locale={locale} initialRules={rules} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-semibold text-on-background">
          Blocked dates
        </h2>
        <BlockedDatesEditor
          therapistId={id}
          locale={locale}
          blockedDates={blockedDates}
        />
      </section>
      <section className="flex flex-col gap-3 border-t border-outline-variant pt-6">
        <h2 className="font-heading text-xl font-semibold text-error">
          Danger zone
        </h2>
        <p className="text-sm text-on-surface-variant">
          Permanently delete this therapist, including their availability and
          appointments. This cannot be undone.
        </p>
        <DeleteTherapistButton profileId={id} locale={locale} />
      </section>
      </div>
    </AdminShell>
  );
}
