import type { TherapistCard } from "../types";

/** Presentational therapist card (uses logical `text-start` so it mirrors in RTL). */
export function TherapistCardView({ card }: { card: TherapistCard }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-5 text-start shadow-sm">
      <div>
        <h3 className="font-heading text-lg font-semibold text-on-surface">
          {card.name}
        </h3>
        <p className="text-sm text-on-surface-variant">{card.title}</p>
      </div>
      <p className="text-sm text-on-surface">{card.tagline}</p>
      <ul className="flex flex-wrap gap-2">
        {card.skills.map((skill) => (
          <li
            key={skill}
            className="rounded-full bg-secondary-container px-3 py-1 text-xs text-on-secondary-container"
          >
            {skill}
          </li>
        ))}
      </ul>
    </article>
  );
}
