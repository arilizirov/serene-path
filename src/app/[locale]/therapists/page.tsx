import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { searchTherapists, TherapistCardView } from "@/features/therapists";
import { isLocale } from "@/lib/utils";

const inputClass =
  "rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface";

export default async function TherapistsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; language?: string }>;
}) {
  const { q, language } = await searchParams;
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const therapists = await searchTherapists(locale, { q, language });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <h1 className="font-heading text-3xl font-bold text-on-background">
        Browse therapists
      </h1>

      <form className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-on-surface-variant">
          Search
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="name or specialty"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-on-surface-variant">
          Language
          <select name="language" defaultValue={language ?? ""} className={inputClass}>
            <option value="">Any</option>
            <option value="he">עברית</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 font-medium text-on-primary"
        >
          Search
        </button>
      </form>

      {therapists.length === 0 ? (
        <p className="text-on-surface-variant">No therapists match your search.</p>
      ) : (
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
      )}
    </main>
  );
}
