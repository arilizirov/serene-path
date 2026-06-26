import { getLocale, getTranslations } from "next-intl/server";
import { isLocale } from "@/lib/utils";
import { IntakeChat, crisisMessage } from "@/features/intake";

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("Home");
  const ti = await getTranslations("Intake");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">
        {ti("pageTitle")}
      </h1>
      {/* Transparency: people should know the conversation is saved/reviewed (§11). */}
      <p className="text-[13px] text-on-surface-variant">{t("privacy")}</p>
      {/* The live pre-choice intake: prompted conversation → fit form → match. The
          crisis resources are resolved server-side here and passed in, so the client
          chat never imports crisis.ts / @/server (Node-only deps → bundle leak). */}
      <IntakeChat locale={locale} initialMessage={m} crisisText={crisisMessage(locale)} />
    </main>
  );
}
