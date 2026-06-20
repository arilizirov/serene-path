import { notFound } from "next/navigation";
import {
  getTherapistForEdit,
  getAvailabilityRules,
  TherapistForm,
  AvailabilityEditor,
} from "@/features/therapists";

// Always load the current profile for editing (no build-time snapshot).
export const dynamic = "force-dynamic";

export default async function EditTherapistPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const therapist = await getTherapistForEdit(id);
  if (!therapist) notFound();
  const rules = await getAvailabilityRules(id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
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
    </main>
  );
}
