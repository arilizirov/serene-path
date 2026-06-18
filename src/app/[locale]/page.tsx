import { getLocale, getTranslations } from "next-intl/server";
import { getDiscoverTherapists, TherapistCardView } from "@/features/therapists";
import { isLocale } from "@/lib/utils";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const therapists = await getDiscoverTherapists(locale);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 p-8">
      <section className="flex flex-col items-center gap-6 pt-8 text-center">
        <h1 className="font-heading text-5xl font-bold text-primary">
          The Serene Path
        </h1>
        <p className="max-w-prose text-lg text-on-surface-variant">
          {t("tagline")}
        </p>
        <span className="rounded-full bg-primary-container px-4 py-2 text-sm font-medium text-on-primary-container">
          עברית · English · Français
        </span>
      </section>

      <section>
        <h2 className="mb-6 font-heading text-2xl font-semibold text-on-background">
          {t("therapistsHeading")}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {therapists.map((card) => (
            <TherapistCardView key={card.id} card={card} />
          ))}
        </div>
      </section>
    </main>
  );
}
