import { TherapistSignupForm } from "./signup-form";

export default async function TherapistSignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Join as a therapist
      </h1>
      <p className="text-sm text-on-surface-variant">
        Create your account, then complete your profile. An admin reviews it
        before it appears to clients.
      </p>
      <TherapistSignupForm locale={locale} />
    </main>
  );
}
