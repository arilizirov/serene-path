import { TherapistForm } from "@/features/therapists";

export default async function NewTherapistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        New therapist
      </h1>
      <TherapistForm locale={locale} />
    </main>
  );
}
