import { Link } from "@/i18n/navigation";
import { RegisterForm } from "@/features/accounts";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Create your account
      </h1>
      <RegisterForm locale={locale} next={next} />
      <p className="text-sm text-on-surface-variant">
        Already have an account?{" "}
        {/* Carry ?next= so a returning patient who logs in still finishes the
            pending booking on /account. */}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="text-primary"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
