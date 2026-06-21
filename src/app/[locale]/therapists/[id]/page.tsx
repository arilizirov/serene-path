import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { DateTime } from "luxon";
import { getTherapistProfile } from "@/features/therapists";
import { getBookableSlots } from "@/features/scheduling";
import { isLocale } from "@/lib/utils";
import { bookSlotAction } from "./book-actions";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Times are displayed in Israel time for now (most therapists are there);
// per-therapist / per-viewer timezone rendering is a later refinement.
const DISPLAY_TZ = "Asia/Jerusalem";

// Slots depend on the current time + live bookings, so never cache.
export const dynamic = "force-dynamic";

export default async function TherapistProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string; error?: string }>;
}) {
  const { id } = await params;
  const { booked, error } = await searchParams;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTherapistProfile(id, locale);
  if (!t) notFound();

  const nowDate = new Date();
  const now = nowDate.toISOString();
  const horizon = new Date(nowDate.getTime() + 14 * 86_400_000).toISOString();
  const slots = (await getBookableSlots(id, now, horizon)).slice(0, 24).map((iso) => ({
    iso,
    label: DateTime.fromISO(iso, { zone: "utc" })
      .setZone(DISPLAY_TZ)
      .setLocale(locale)
      .toFormat("ccc d LLL HH:mm"),
  }));

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

      <section className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-5">
        <span className="text-lg text-on-surface">
          ₪{t.sessionPrice}{" "}
          <span className="text-sm text-on-surface-variant">/ session</span>
        </span>

        {booked ? (
          <p className="rounded-md bg-tertiary-container px-3 py-2 text-sm text-on-tertiary-container">
            Booked — your session is pending confirmation.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">
            {error}
          </p>
        ) : null}

        <h2 className="font-heading text-base font-semibold text-on-background">
          Book a session{" "}
          <span className="text-sm font-normal text-on-surface-variant">
            (Israel time)
          </span>
        </h2>
        {slots.length === 0 ? (
          <p className="text-on-surface-variant">
            No open slots in the next two weeks.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <form key={s.iso} action={bookSlotAction}>
                <input type="hidden" name="locale" defaultValue={locale} />
                <input type="hidden" name="therapistId" defaultValue={id} />
                <input type="hidden" name="startUtc" defaultValue={s.iso} />
                <button
                  type="submit"
                  className="rounded-full border border-outline bg-surface-container px-3 py-1.5 text-sm text-on-surface transition hover:bg-primary hover:text-on-primary"
                >
                  {s.label}
                </button>
              </form>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
