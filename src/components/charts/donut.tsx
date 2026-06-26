/** A single-value progress ring (the "goals performance" donut), hand-rolled
 *  SVG modeled on the reference dashboard: a thin accent arc with a rounded cap
 *  and a small filled dot at the leading edge, on a soft track, with a big bold
 *  value centered and an optional sub-label. viewBox + `w-full h-auto`; the arc
 *  is stroke-dasharray so it reads the same in LTR and RTL. */
export function Donut({
  value,
  max = 100,
  title,
  centerLabel,
  subLabel,
}: {
  value: number;
  max?: number;
  title: string;
  centerLabel?: string;
  subLabel?: string;
}) {
  const SIZE = 160;
  const STROKE = 13;
  const r = (SIZE - STROKE) / 2;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const pct = Math.round(ratio * 100);
  const dash = circumference * ratio;

  // Leading-edge dot: the arc starts at 12 o'clock (rotate -90) and sweeps
  // clockwise, so its end sits at angle (-90 + ratio*360) degrees.
  const endAngle = (-90 + ratio * 360) * (Math.PI / 180);
  const dotX = cx + r * Math.cos(endAngle);
  const dotY = cy + r * Math.sin(endAngle);

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
      {ratio > 0 && ratio < 1 ? (
        <circle
          cx={dotX}
          cy={dotY}
          r={STROKE / 2 + 2}
          fill="var(--color-accent)"
          stroke="var(--color-surface)"
          strokeWidth={3}
        />
      ) : null}
      <text
        x={cx}
        y={subLabel ? cy - 6 : cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="30"
        fontWeight="700"
        fill="var(--color-ink)"
      >
        {centerLabel ?? `${pct}%`}
      </text>
      {subLabel ? (
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fill="var(--color-ink-3)"
        >
          {subLabel}
        </text>
      ) : null}
    </svg>
  );
}
