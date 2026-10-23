import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { skills } from '../data';
import { back, exitFade, front, reveal, useSection, useWorld } from '../engine/hooks';
import { clamp, easeOutCubic } from '../engine/director';

const N = skills.length;
const GA = Math.PI * (3 - Math.sqrt(5));
const pts = skills.map((_, i) => {
  const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), phi = i * GA;
  return { x: Math.cos(phi) * r, y, z: Math.sin(phi) * r };
});

export default function Skills() {
  const sec = useSection('skills');
  const head = useRef<HTMLDivElement>(null), tape = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null);
  const backs = useRef<(HTMLSpanElement | null)[]>([]), fronts = useRef<(HTMLSpanElement | null)[]>([]);
  const wrapB = useRef<HTMLDivElement>(null), wrapF = useRef<HTMLDivElement>(null);
  const t0 = performance.now(); const mx = useRef(0);

  useWorld(w => {
    const st = w.scenes.skills;
    reveal(head.current, st);
    const e = easeOutCubic(clamp(st.enter * 1.3)), o = e * exitFade(st.exit);
    [wrapB.current, wrapF.current].forEach(el => { if (el) { el.style.opacity = o.toFixed(3); el.style.visibility = o < 0.002 ? 'hidden' : 'visible'; } });
    if (tape.current) { tape.current.style.opacity = o.toFixed(3); tape.current.style.visibility = o < 0.002 ? 'hidden' : 'visible'; }
    if (track.current) track.current.style.transform = `translateX(${(-st.p * 40 - 10).toFixed(2)}%)`;
    if (o < 0.002) return;
    mx.current += (w.mx - mx.current) * 0.05;
    const time = (performance.now() - t0) / 1000;
    const a = time * 0.28 + st.p * 5 + mx.current * 0.8;
    const tilt = -0.28 + w.my * 0.12;
    const R = (w.mobile ? 0.4 * w.vw : Math.min(0.27 * w.vw, 0.46 * w.vh)) * (0.7 + 0.3 * e);
    const cx = w.vw * (w.mobile ? 0.5 : 0.52), cy = w.vh * (w.mobile ? 0.42 : 0.46);
    const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), stt = Math.sin(tilt);
    pts.forEach((p, i) => {
      const x1 = p.x * ca + p.z * sa, z1 = -p.x * sa + p.z * ca;
      const y2 = p.y * ct - z1 * stt, z2 = p.y * stt + z1 * ct;
      const X = cx + x1 * R, Y = cy + y2 * R * 0.78;
      const s = 0.78 + 0.32 * (z2 + 1) / 2;
      const inFront = z2 > 0;
      const tr = `translate3d(${X.toFixed(1)}px,${Y.toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(3)})`;
      const b = backs.current[i], f = fronts.current[i];
      if (b) { b.style.transform = tr; b.style.opacity = inFront ? '0' : (0.35 + 0.5 * (1 + z2)).toFixed(3); }
      if (f) { f.style.transform = tr; f.style.opacity = inFront ? (0.75 + 0.25 * z2).toFixed(3) : '0'; }
    });
  }, { scene: 'skills', always: true });

  return (
    <section className="scene" id="skills" ref={sec} style={{ height: '280vh' }}>
      {createPortal(<div className="orbit" ref={wrapB} aria-hidden="true">{skills.map((s, i) => <span key={s} className="chip-b mono" ref={el => { backs.current[i] = el; }}>{s}</span>)}</div>, back())}
      {createPortal(<div className="orbit" ref={wrapF} aria-hidden="true">{skills.map((s, i) => <span key={s} className="chip-f mono" ref={el => { fronts.current[i] = el; }}>{s}</span>)}</div>, front())}
      <div className="sticky"><div className="inner">
        <div className="skills-head panel" ref={head}>
          <div className="label mono"><b>(04)</b> — Toolkit</div>
          <h2 className="anton sec-title">EVERYTHING<br /><span className="red">IN ORBIT.</span></h2>
          <ul className="sr-only">{skills.map(s => <li key={s}>{s}</li>)}</ul>
        </div>
        <div className="tape" ref={tape} aria-hidden="true"><div className="tape-track anton" ref={track}>
          {[0, 1, 2].map(k => <span key={k}>{skills.map(s => `${s} ✦ `).join('')}</span>)}
        </div></div>
      </div></div>
    </section>
  );
}
