import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getDiscoverTherapists, TherapistCardView } from "@/features/therapists";
import { FeelingField } from "@/features/intake";
import { isLocale } from "@/lib/utils";

// Reads the live verified-therapist list, so render per request (never prerender
// at build time — the build must not require a database connection).
export const dynamic = "force-dynamic";

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
        <FeelingField locale={locale} />
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold text-on-background">
            {t("therapistsHeading")}
          </h2>
          <Link href="/therapists" className="text-sm text-primary underline">
            Browse all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {therapists.map((card) => (
            <Link
              key={card.id}
              href={`/therapists/${card.id}`}
              className="block rounded-2xl transition hover:opacity-90"
            >
              <TherapistCardView card={card} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
