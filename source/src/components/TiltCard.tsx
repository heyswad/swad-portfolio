import { useEffect, useRef, type ReactNode } from 'react';

/** Glass card that 3D-tilts toward the cursor (±14°) with a moving radial glare. */
export default function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!; if (!matchMedia('(pointer:fine)').matches) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, hover = false;
    const loop = () => {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      el.style.setProperty('--rx', `${(-cy * 14).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(cx * 14).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(cx * 50 + 50).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(cy * 50 + 50).toFixed(1)}%`);
      if (hover || Math.abs(cx) + Math.abs(cy) > 0.002) raf = requestAnimationFrame(loop); else raf = 0;
    };
    const mv = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1; ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      hover = true; if (!raf) raf = requestAnimationFrame(loop);
    };
    const lv = () => { tx = 0; ty = 0; hover = false; if (!raf) raf = requestAnimationFrame(loop); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className={`tilt ${className}`}><div className="tilt-glare" />{children}</div>;
}
