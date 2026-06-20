import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getTherapistProfile } from "@/features/therapists";
import { isLocale } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TherapistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTherapistProfile(id, locale);
  if (!t) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {t.photoUrl ? (
          <Image
            src={t.photoUrl}
            alt={t.name}
            width={112}
            height={112}
            unoptimized
            className="h-28 w-28 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-surface-container-high font-heading text-3xl text-on-surface-variant">
            {t.name.charAt(0)}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold text-on-background">{t.name}</h1>
          <p className="text-lg text-on-surface-variant">{t.title}</p>
          {t.credentials ? (
            <p className="text-sm text-on-surface-variant">{t.credentials}</p>
          ) : null}
          <p className="text-sm text-on-surface-variant">
            {t.reviewCount > 0
              ? `★ ${t.rating.toFixed(1)} (${t.reviewCount})`
              : "No reviews yet"}
          </p>
        </div>
      </header>

      <p className="whitespace-pre-line text-on-surface">{t.bio}</p>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold text-on-background">
          Specialties
        </h2>
        <ul className="flex flex-wrap gap-2">
          {t.skills.map((s) => (
            <li
              key={s}
              className="rounded-full bg-secondary-container px-3 py-1 text-sm text-on-secondary-container"
            >
              {s}
            </li>
          ))}
        </ul>
        <p className="text-sm text-on-surface-variant">
          Languages: {t.languages.join(", ")}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold text-on-background">
          Weekly availability
        </h2>
        {t.availability.length === 0 ? (
          <p className="text-on-surface-variant">No availability listed yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-on-surface">
            {t.availability.map((a, i) => (
              <li key={i}>
                {WEEKDAYS[a.weekday]} · {a.start}–{a.end}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex items-center justify-between rounded-2xl bg-surface-container-low p-5">
        <span className="text-lg text-on-surface">
          ₪{t.sessionPrice}{" "}
          <span className="text-sm text-on-surface-variant">/ session</span>
        </span>
        <button
          type="button"
          disabled
          title="Booking arrives in a later stage"
          className="rounded-full bg-primary px-6 py-2 font-medium text-on-primary opacity-50"
        >
          Book a session
        </button>
      </section>
    </main>
  );
}
