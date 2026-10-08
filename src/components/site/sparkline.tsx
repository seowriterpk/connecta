/**
 * Server-rendered SVG sparkline (no client JS).
 * Used by /populares movers rows and the group detail activity card.
 */
export function Sparkline({
  data,
  uid,
  width = 92,
  height = 28,
  className = "text-emerald-600 dark:text-emerald-400",
}: {
  data: number[];
  uid: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!data || data.length < 2) return null;
  const w = width;
  const h = height;
  const pad = 2.5;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const stepX = (w - pad * 2) / (data.length - 1);
  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);
  const pts = data.map((v, i) => `${(pad + i * stepX).toFixed(1)},${y(v).toFixed(1)}`);
  const gradId = `spark-${uid.replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={`overflow-visible ${className}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Tendencia de vistas de los últimos 14 días"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${h - pad} ${pts.join(" ")} ${w - pad},${h - pad}`}
        fill={`url(#${gradId})`}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={w - pad}
        cy={y(data[data.length - 1])}
        r="2.2"
        fill="currentColor"
        stroke="var(--background)"
        strokeWidth="1"
      />
    </svg>
  );
}
