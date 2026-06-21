import { requireRole, logoutAction } from "@/features/accounts";

// Therapist-only. Server-side guard fails closed (redirects non-therapists to
// login). Full profile + availability editing + a completeness indicator land
// in the next slice; this is the landing page after self-signup.
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole("THERAPIST", locale);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-on-background">
          Therapist dashboard
        </h1>
        <form action={logoutAction}>
          <input type="hidden" name="locale" defaultValue={locale} />
          <button type="submit" className="text-sm text-primary">
            Sign out
          </button>
        </form>
      </div>
      <p className="text-on-surface-variant">
        Welcome. Your profile is in <strong>draft</strong> and awaiting
        completion and admin verification before it appears in search. Profile
        and availability editing arrive next.
      </p>
    </main>
  );
}
