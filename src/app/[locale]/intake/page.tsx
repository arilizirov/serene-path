import { getLocale, getTranslations } from "next-intl/server";
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
  const t = await getTranslations("Home");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        Let&apos;s find the right person
      </h1>
      {/* Transparency: people should know the conversation is saved/reviewed (§11). */}
      <p className="text-[13px] text-on-surface-variant">{t("privacy")}</p>
      <IntakeChat locale={locale} initialMessage={m} />
    </main>
  );
}
