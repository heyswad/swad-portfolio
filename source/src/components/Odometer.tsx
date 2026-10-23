import { forwardRef, useImperativeHandle, useRef } from 'react';

export type OdoHandle = { set: (v: number) => void };
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Mechanical odometer: digit columns 0–9,0; the lowest digit snaps with smoothstep .55–1. */
const Odometer = forwardRef<OdoHandle, { digits: number; className?: string }>(({ digits, className }, ref) => {
  const cols = useRef<(HTMLSpanElement | null)[]>([]);
  useImperativeHandle(ref, () => ({
    set(v: number) {
      v = Math.max(0, v);
      for (let d = 0; d < digits; d++) {
        const place = Math.pow(10, digits - 1 - d);
        const raw = v / place;
        const whole = Math.floor(raw) % 10;
        const frac = raw - Math.floor(raw);
        // lower places roll continuously; snap the motion of each column near the carry
        const pos = whole + smooth(0.55, 1, frac);
        const el = cols.current[d];
        if (el) {
          el.style.transform = `translateY(${(-pos * 100 / 11).toFixed(3)}%)`;
          el.parentElement!.style.opacity = v < place && d < digits - 1 ? '0.18' : '1';
        }
      }
    },
  }), [digits]);
  return (
    <span className={`odo ${className || ''}`} aria-hidden="true">
      {Array.from({ length: digits }).map((_, d) => (
        <span className="odo-win" key={d}>
          <span className="odo-col" ref={el => { cols.current[d] = el; }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, i) => <span key={i}>{n}</span>)}
          </span>
        </span>
      ))}
    </span>
  );
});
export default Odometer;
