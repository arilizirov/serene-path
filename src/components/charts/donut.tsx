/** A single-value progress ring (the "goals performance" donut), hand-rolled
 *  SVG. An accent arc on a surface-2 track, with the big % centered. viewBox +
 *  `w-full h-auto`. The arc is drawn with stroke-dasharray, so it reads the same
 *  in LTR and RTL. */
export function Donut({
  value,
  max = 100,
  title,
  centerLabel,
}: {
  value: number;
  max?: number;
  title: string;
  centerLabel?: string;
}) {
  const SIZE = 140;
  const STROKE = 16;
  const r = (SIZE - STROKE) / 2;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const pct = Math.round(ratio * 100);
  const dash = circumference * ratio;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-surface-2)"
        strokeWidth={STROKE}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="28"
        fontWeight="700"
        fill="var(--color-ink)"
      >
        {centerLabel ?? `${pct}%`}
      </text>
    </svg>
  );
}
