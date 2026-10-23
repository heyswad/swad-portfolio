import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { journey, journeyYears } from '../data';
import { back, exitFade, reveal, useSection, useWorld } from '../engine/hooks';
import { clamp, easeOutCubic } from '../engine/director';
import Odometer, { type OdoHandle } from '../components/Odometer';

export default function Journey() {
  const sec = useSection('journey');
  const yr = useRef<HTMLDivElement>(null), odo = useRef<OdoHandle>(null), head = useRef<HTMLDivElement>(null);
  const path = useRef<SVGLineElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const n = journey.length;

  useWorld(w => {
    const st = w.scenes.journey;
    if (yr.current) {
      const e = easeOutCubic(clamp(st.enter * 1.3)), o = e * exitFade(st.exit);
      yr.current.style.opacity = o.toFixed(3);
      yr.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      yr.current.style.transform = `translateY(${((1 - e) * 10).toFixed(2)}vh)`;
    }
    const yp = clamp(st.p * 1.15);
    odo.current?.set(journeyYears.from + (journeyYears.to - journeyYears.from) * yp);
    reveal(head.current, st);
    const prog = clamp(st.p * 1.2);
    if (path.current) path.current.style.strokeDashoffset = String(1 - prog);
    const fade = exitFade(st.exit);
    items.current.forEach((el, i) => {
      if (!el) return;
      // newest at the top; reveal from the bottom up
      const order = n - 1 - i;
      const r = easeOutCubic(clamp(prog * n - order));
      el.style.opacity = (r * fade).toFixed(3);
      el.style.transform = `perspective(900px) rotateY(${(-55 * (1 - r)).toFixed(2)}deg)`;
      el.classList.toggle('on', r > 0.6);
    });
  });

  return (
    <section className="scene" id="journey" ref={sec} style={{ height: '240vh' }}>
      {createPortal(<div className="journey-year anton" ref={yr} aria-hidden="true"><Odometer digits={4} ref={odo} /></div>, back())}
      <div className="sticky"><div className="inner">
        <div className="journey-col panel">
          <div ref={head}>
            <div className="label mono"><b>(03)</b> — Journey</div>
            <h2 className="anton sec-title">BUILT FROM<br /><span className="red">ZERO.</span></h2>
          </div>
          <div className="timeline">
            <svg className="tl-svg" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="1" y1="100" x2="1" y2="0" className="tl-track" />
              <line x1="1" y1="100" x2="1" y2="0" className="tl-draw" pathLength={1} ref={path} />
            </svg>
            <ol>
              {journey.map((j, i) => (
                <li key={i} ref={el => { items.current[i] = el; }}>
                  <span className="tl-node" />
                  <span className="mono tl-year">{j.year}</span>
                  <span className="anton tl-title">{j.title}</span>
                  <span className="tl-org">{j.org}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div></div>
    </section>
  );
}
