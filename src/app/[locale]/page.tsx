import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("Home");
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="font-heading text-5xl font-bold text-primary">
        The Serene Path
      </h1>
      <p className="max-w-prose text-lg text-on-surface-variant">
        {t("tagline")}
      </p>
      <span className="rounded-full bg-primary-container px-4 py-2 text-sm font-medium text-on-primary-container">
        עברית · English · Français
      </span>
    </main>
  );
}
