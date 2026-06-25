import { getLocale } from "next-intl/server";
import { isLocale } from "@/lib/utils";
import { IntakeChat } from "@/features/intake";

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Let&apos;s find the right person
      </h1>
      <IntakeChat locale={locale} initialMessage={m} />
    </main>
  );
}
