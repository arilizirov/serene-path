import type { ReactNode } from "react";
import { Card } from "./card";

/** A delta badge: small green for an upward move, danger for a downward one. */
export type StatDelta = { value: string; dir: "up" | "down" };

/** A single metric tile: big navy number, small grey label, optional colored
 *  delta and a leading icon. Numbers read big-and-navy; the label is muted. */
export function StatCard({
  label,
  value,
  delta,
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  delta?: StatDelta;
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="flex flex-col gap-2 text-start">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-ink-2">{label}</span>
        {icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-ink">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-ink">{value}</span>
        {delta ? (
          <span
            className={`text-sm font-medium ${
              delta.dir === "up" ? "text-accent" : "text-danger"
            }`}
          >
            {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <span className="text-sm text-ink-3">{hint}</span> : null}
    </Card>
  );
}
