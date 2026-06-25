/** A small vertical bar chart, hand-rolled SVG (no chart lib — KISS). One bar is
 *  highlighted in accent; the rest sit in accent-soft. viewBox-based + `w-full
 *  h-auto`, so it scales to its container. RTL: bars are laid out start→end via
 *  the `rtl:-scale-x-100` flip on the group (text is un-flipped back). */
export function BarChart({
  data,
  highlightIndex = -1,
  title,
}: {
  data: { label: string; value: number }[];
  highlightIndex?: number;
  title: string;
}) {
  const W = 320;
  const H = 160;
  const PAD_BOTTOM = 22;
  const PAD_TOP = 8;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = Math.max(1, data.length);
  const slot = W / n;
  const barW = Math.min(40, slot * 0.55);
  const usableH = H - PAD_BOTTOM - PAD_TOP;

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
        {data.map((d, i) => {
          const h = (d.value / max) * usableH;
          const x = i * slot + (slot - barW) / 2;
          const y = H - PAD_BOTTOM - h;
          const fill =
            i === highlightIndex ? "var(--color-accent)" : "var(--color-accent-soft)";
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, h)}
                rx={5}
                fill={fill}
              />
              <text
                x={x + barW / 2}
                y={H - 7}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-ink-3)"
                className="rtl:-scale-x-100"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
