import { notFound } from "next/navigation";
import { getTherapistForEdit, TherapistForm } from "@/features/therapists";

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

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Edit therapist
      </h1>
      <TherapistForm locale={locale} initial={therapist} />
    </main>
  );
}
