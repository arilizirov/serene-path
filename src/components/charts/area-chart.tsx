/** Smooth area/line chart, hand-rolled SVG (no chart lib — KISS), modeled on the
 *  reference dashboard's report chart: a soft accent area under a smooth line, a
 *  highlighted point with a value pill, light y-reference rows, and a thinned set
 *  of x labels so they never crowd. Interpolation is monotone-cubic (Fritsch–
 *  Carlson) so spiky data (e.g. a single busy day) curves smoothly WITHOUT
 *  overshooting below the baseline. The data group flips in RTL via
 *  `rtl:-scale-x-100` (labels + pill flip back so text stays readable). */
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
  const W = 440;
  const H = 188;
  const PAD_L = 30;
  const PAD_R = 14;
  const PAD_TOP = 28;
  const PAD_BOTTOM = 22;
  const n = Math.max(2, data.length);
  const max = Math.max(1, ...data.map((d) => d.value));
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const baseY = PAD_TOP + innerH;

  const xAt = (i: number) => PAD_L + (innerW * i) / (n - 1);
  const yAt = (v: number) => PAD_TOP + innerH - (v / max) * innerH;
  const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value), d, i }));

  const linePath = monotonePath(pts);
  const areaPath = `${linePath} L ${pts[n - 1].x.toFixed(1)} ${baseY} L ${pts[0].x.toFixed(1)} ${baseY} Z`;
  const hi = pts[highlightIndex];

  // ≤6 evenly-spaced x labels (plus the last) so they never crowd/overlap.
  const step = Math.max(1, Math.ceil(n / 6));
  const showLabel = (i: number) => i % step === 0 || i === n - 1;

  // 3 light y-reference rows (max / mid / 0) like the reference chart.
  const yRows = Array.from(new Set([max, Math.round(max / 2), 0]));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="spArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* y gridlines + labels — kept LTR-anchored (admin/report axes read L→R). */}
      <g>
        {yRows.map((v) => (
          <g key={`y-${v}`}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="var(--color-ink-3)"
              strokeWidth={1}
              strokeDasharray="2 5"
              opacity={0.18}
            />
            <text
              x={PAD_L - 7}
              y={yAt(v)}
              textAnchor="end"
              dominantBaseline="central"
              fontSize="9"
              fill="var(--color-ink-3)"
            >
              {valuePrefix}
              {v}
            </text>
          </g>
        ))}
      </g>
      <g className="rtl:-scale-x-100 rtl:[transform-origin:center]">
        <path d={areaPath} fill="url(#spArea)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p) =>
          showLabel(p.i) ? (
            <text
              key={`l-${p.i}`}
              x={p.x}
              y={H - 6}
              textAnchor={p.i === 0 ? "start" : p.i === n - 1 ? "end" : "middle"}
              fontSize="9.5"
              fill="var(--color-ink-3)"
              className="rtl:-scale-x-100"
            >
              {p.d.label}
            </text>
          ) : null,
        )}
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
              <rect x={hi.x - 27} y={hi.y - 27} width={54} height={18} rx={9} fill="var(--color-ink)" />
              <text
                x={hi.x}
                y={hi.y - 18}
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

/** Monotone cubic interpolation (Fritsch–Carlson) → a smooth path that never
 *  overshoots the data range, so flat-with-a-spike series read as a gentle hump
 *  rather than a sharp triangle. Falls back to straight segments for <3 points. */
function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 3) return pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = (pts[i + 1].y - pts[i].y) / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        t[i] = tau * a * m[i];
        t[i + 1] = tau * b * m[i];
      }
    }
  }
  let p = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = pts[i].x + dx[i] / 3;
    const y1 = pts[i].y + (t[i] * dx[i]) / 3;
    const x2 = pts[i + 1].x - dx[i] / 3;
    const y2 = pts[i + 1].y - (t[i + 1] * dx[i]) / 3;
    p += ` C ${x1.toFixed(1)} ${y1.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}, ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
  }
  return p;
}
