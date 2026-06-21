import { Link } from "@/i18n/navigation";
import { RegisterForm } from "@/features/accounts";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Create your account
      </h1>
      <RegisterForm locale={locale} />
      <p className="text-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/login" className="text-primary">
          Sign in
        </Link>
      </p>
    </main>
  );
}
