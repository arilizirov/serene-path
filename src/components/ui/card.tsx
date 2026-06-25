import type { ReactNode } from "react";

/** A white SaaS card: rounded-2xl surface with a soft shadow and comfortable
 *  padding. Presentational only — pass `className` to extend (e.g. col-span). */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-6 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
