/** A completeness meter: muted track, green fill, optional % label. `value` is
 *  clamped to 0–100. The fill grows from the inline-start edge (mirrors in RTL
 *  because the row is laid out start→end, not left→right). */
export function ProgressBar({
  value,
  showLabel = true,
  label,
}: {
  value: number;
  showLabel?: boolean;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex flex-col gap-1.5">
      {showLabel ? (
        <div className="flex items-center justify-between text-sm text-ink-2">
          <span>{label}</span>
          <span className="font-medium text-ink">{pct}%</span>
        </div>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
