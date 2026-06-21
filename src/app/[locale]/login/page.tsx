import { LoginForm } from "@/features/accounts";

export default async function LoginPage({
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
        Sign in
      </h1>
      <LoginForm locale={locale} next={next} />
    </main>
  );
}
