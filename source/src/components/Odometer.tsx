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
        const whole = Math.floor(v / place) % 10;
        let pos: number;
        if (place === 1) {
          // lowest digit rolls with the value and snaps near the next number
          pos = whole + smooth(0.55, 1, v - Math.floor(v));
        } else {
          // higher digits only move while the digit below rolls from 9 to 0 (mechanical carry)
          const below = v / (place / 10);
          const carry = Math.floor(below) % 10 === 9 ? smooth(0.55, 1, below - Math.floor(below)) : 0;
          pos = whole + carry;
        }
        const el = cols.current[d];
        if (el) {
          el.style.transform = `translateY(${(-pos * 100 / 11).toFixed(3)}%)`;
          const lead = v < place - 0.5 && d < digits - 1;
          const win = el.parentElement!;
          win.style.opacity = lead ? '0' : '1';
          win.style.width = lead ? '0' : '';
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
