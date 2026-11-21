'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Serie {
  name: string;
  color: string;
  data: number[];
  dash?: boolean;
}
interface Props {
  labels: string[];
  series: Serie[];
  aria: string;
  tip: (i: number) => ReactNode;
}

/** Gráfica de líneas SVG responsiva con guía y tooltip al pasar el puntero */
export function LineChart({ labels, series, aria, tip }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [tipLeft, setTipLeft] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { setW(Math.max(260, el.clientWidth)); setHover(null); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = W < 520 ? 220 : 260;
  const pl = 40;
  const pr = W < 520 ? 34 : 46;
  const pt = 14;
  const pb = 28;
  const vals = series.flatMap((s) => s.data);
  const lo = Math.floor((Math.min(...vals) - 40) / 100) * 100;
  const hi = Math.ceil((Math.max(...vals) + 10) / 100) * 100;
  const n = labels.length;
  const X = (i: number) => pl + (i * (W - pl - pr)) / (n - 1);
  const Y = (v: number) => pt + ((hi - v) * (H - pt - pb)) / (hi - lo);

  useEffect(() => {
    if (hover === null || !tipRef.current) return;
    const tw = tipRef.current.offsetWidth;
    const gx = X(hover);
    let left = gx + 14;
    if (left + tw > W - 4) left = gx - tw - 14;
    setTipLeft(Math.max(0, left));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, W]);

  const show = (clientX: number) => {
    const el = ref.current;
    if (!el || !W) return;
    const x = clientX - el.getBoundingClientRect().left;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((x - pl) / (W - pl - pr)) * (n - 1)))));
  };

  const grid = [];
  if (W) for (let v = lo; v <= hi; v += 100) {
    grid.push(
      <g key={'g' + v}>
        <line x1={pl} x2={W - pr} y1={Y(v)} y2={Y(v)} stroke={v === lo ? '#3a362f' : '#24221f'} />
        <text x={pl - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#8f897e">{v}</text>
      </g>,
    );
  }
  const step = W < 520 ? 2 : 1;

  return (
    <div
      className="chart"
      ref={ref}
      onPointerMove={(e) => show(e.clientX)}
      onPointerDown={(e) => show(e.clientX)}
      onPointerLeave={() => setHover(null)}
      onPointerCancel={() => setHover(null)}
    >
      <div className="chart-svg">
        {W > 0 && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
            {grid}
            {labels.map((l, i) => (i % step === 0 ? <text key={l} x={X(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#8f897e">{l}</text> : null))}
            {series.map((s) => {
              const d = s.data.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
              const li = s.data.length - 1;
              return (
                <g key={s.name}>
                  <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dash ? '5 5' : undefined} />
                  <circle cx={X(li)} cy={Y(s.data[li])} r="3.5" fill={s.color} />
                  <text x={X(li) + 8} y={Y(s.data[li]) + 4} fontSize="12" fontWeight="700" fill={s.color}>{s.name}</text>
                </g>
              );
            })}
            <line x1={hover !== null ? X(hover) : 0} x2={hover !== null ? X(hover) : 0} y1={pt} y2={H - pb} stroke="#6b5a36" strokeDasharray="3 3" opacity={hover !== null ? 1 : 0} />
            {series.map((s) =>
              hover !== null && hover < s.data.length ? (
                <circle key={'d' + s.name} cx={X(hover)} cy={Y(s.data[hover])} r="5" fill={s.color} stroke="#141415" strokeWidth="2" />
              ) : null,
            )}
          </svg>
        )}
      </div>
      <div ref={tipRef} className={'chart-tip' + (hover !== null ? ' on' : '')} aria-hidden="true" style={{ left: tipLeft }}>
        {hover !== null && tip(hover)}
      </div>
    </div>
  );
}

/** Mini gráfica de tendencia */
export function Sparkline({ vals }: { vals: number[] }) {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const x = (i: number) => 4 + (i * 152) / (vals.length - 1);
  const y = (v: number) => 42 - ((v - lo) / Math.max(1, hi - lo)) * 36;
  const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  const li = vals.length - 1;
  return (
    <svg className="spark" viewBox="0 0 160 48" preserveAspectRatio="none" role="img" aria-label="Ventas de los últimos 12 días">
      <path d={d} fill="none" stroke="#6f6a61" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(li)} cy={y(vals[li])} r="4.5" fill="#c9a35a" stroke="#18171a" strokeWidth="2" />
    </svg>
  );
}
