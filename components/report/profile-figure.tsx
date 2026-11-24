import type { Trait } from "@/lib/report/types";

/**
 * The profile figure: five spokes, one per part, the filled shape reaching
 * further where a pattern came through more strongly. Drawn in SVG from the
 * palette, so it is sharp on screen and in the PDF.
 */
export function ProfileFigure({ traits, className }: { traits: Trait[]; className?: string }) {
  const size = 280;
  const c = size / 2;
  const radius = 92;
  const angle = (i: number) => (-90 + (360 / traits.length) * i) * (Math.PI / 180);
  const point = (i: number, r: number): [number, number] => [c + Math.cos(angle(i)) * r, c + Math.sin(angle(i)) * r];
  const ring = (fraction: number) =>
    traits.map((_, i) => point(i, radius * fraction).map((n) => n.toFixed(1)).join(",")).join(" ");
  const shape = traits.map((t, i) => point(i, (radius * t.score) / 5).map((n) => n.toFixed(1)).join(",")).join(" ");
  const summary = traits.map((t) => `${t.axis}: ${t.name}, ${t.score} of 5`).join("; ");

  return (
    <svg viewBox={`-34 6 ${size + 68} ${size - 22}`} className={className} role="img" aria-label={`Profile figure. ${summary}.`}>
      {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="#C9C0B1" strokeWidth={f === 1 ? 1.2 : 0.8} />
      ))}
      {traits.map((t, i) => {
        const [x, y] = point(i, radius);
        return <line key={t.partId} x1={c} y1={c} x2={x} y2={y} stroke="#C9C0B1" strokeWidth="0.8" />;
      })}
      <polygon points={shape} fill="#1F5C55" fillOpacity="0.16" stroke="#1F5C55" strokeWidth="2" strokeLinejoin="round" />
      {traits.map((t, i) => {
        const [x, y] = point(i, (radius * t.score) / 5);
        return <circle key={t.partId} cx={x} cy={y} r="4.5" fill="#A8472B" stroke="#FAF7F2" strokeWidth="1.5" />;
      })}
      {traits.map((t, i) => {
        const [x, y] = point(i, radius + 20);
        const anchor = Math.abs(x - c) < 8 ? "middle" : x > c ? "start" : "end";
        return (
          <text
            key={t.partId}
            x={x}
            y={y + 4}
            textAnchor={anchor}
            fontSize="11.5"
            fontWeight="600"
            letterSpacing="0.08em"
            fill="#5B6470"
            style={{ textTransform: "uppercase" }}
          >
            {t.axis}
          </text>
        );
      })}
    </svg>
  );
}
