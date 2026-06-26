/** A smooth area/line chart, hand-rolled SVG (no chart lib — KISS), modeled on
 *  the reference dashboard's report chart: a soft accent area under a line, a
 *  highlighted point with a value pill. viewBox + `w-full h-auto`. The path is
 *  computed in data order; in RTL the whole group flips via `rtl:-scale-x-100`
 *  (labels + the pill flip back so text stays readable). */
export function AreaChart({
  data,
  highlightIndex = -1,
  valuePrefix = "",
  title,
}: {
  data: { label: string; value: number }[];
  highlightIndex?: number;
  valuePrefix?: string;
  title: string;
}) {
  const W = 360;
  const H = 180;
  const PAD_X = 10;
  const PAD_TOP = 26;
  const PAD_BOTTOM = 24;
  const n = Math.max(2, data.length);
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value), 0);
  const span = Math.max(1, max - min);
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  const pts = data.map((d, i) => ({
    x: PAD_X + (innerW * i) / (n - 1),
    y: PAD_TOP + innerH - ((d.value - min) / span) * innerH,
    d,
    i,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PAD_BOTTOM} L ${pts[0].x.toFixed(1)} ${H - PAD_BOTTOM} Z`;
  const hi = pts[highlightIndex];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <g className="rtl:-scale-x-100 rtl:[transform-origin:center]">
        <path d={areaPath} fill="var(--color-accent-soft)" opacity={0.7} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p) => (
          <text
            key={`l-${p.i}`}
            x={p.x}
            y={H - 7}
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-ink-3)"
            className="rtl:-scale-x-100"
          >
            {p.d.label}
          </text>
        ))}
        {hi ? (
          <>
            <circle
              cx={hi.x}
              cy={hi.y}
              r={5}
              fill="var(--color-accent)"
              stroke="var(--color-surface)"
              strokeWidth={3}
            />
            <g className="rtl:-scale-x-100">
              <rect
                x={hi.x - 26}
                y={hi.y - 24}
                width={52}
                height={17}
                rx={8}
                fill="var(--color-ink)"
              />
              <text
                x={hi.x}
                y={hi.y - 15}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="600"
                fill="var(--color-surface)"
              >
                {valuePrefix}
                {hi.d.value}
              </text>
            </g>
          </>
        ) : null}
      </g>
    </svg>
  );
}
