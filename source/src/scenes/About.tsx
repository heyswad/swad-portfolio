import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { manifesto, stats } from '../data';
import { back, exitFade, reveal, useSection, useWorld } from '../engine/hooks';
import { clamp, easeOutCubic } from '../engine/director';
import Odometer, { type OdoHandle } from '../components/Odometer';
import TiltCard from '../components/TiltCard';

const words = manifesto.text.split(' ');

export default function About() {
  const sec = useSection('about');
  const shade = useRef<HTMLDivElement>(null), label = useRef<HTMLDivElement>(null), cards = useRef<HTMLDivElement>(null);
  const ws = useRef<(HTMLSpanElement | null)[]>([]);
  const odos = useRef<(OdoHandle | null)[]>([]);

  useWorld(w => {
    const st = w.scenes.about;
    if (st.vis <= 0 && st.enter <= 0) { if (shade.current) shade.current.style.visibility = 'hidden'; return; }
    if (shade.current) {
      const e = easeOutCubic(clamp(st.enter * 1.3));
      const o = e * exitFade(st.exit);
      shade.current.style.opacity = o.toFixed(3);
      shade.current.style.transform = `translateX(${((1 - e) * -8).toFixed(2)}vw)`;
      shade.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    }
    reveal(label.current, st);
    const N = words.length, prog = clamp(st.p * 1.35) * N, fade = exitFade(st.exit);
    ws.current.forEach((el, i) => {
      if (!el) return;
      const r = easeOutCubic(clamp(prog - i));
      el.style.opacity = ((0.1 + 0.9 * r) * fade).toFixed(3);
      el.style.transform = `translateY(${(0.25 * (1 - r)).toFixed(3)}em)`;
      el.style.filter = w.mobile || r > 0.99 || r < 0.01 ? 'none' : `blur(${(4 * (1 - r)).toFixed(2)}px)`;
    });
    reveal(cards.current, st, { delay: 0.35, dist: 60 });
    const c = easeOutCubic(clamp((st.p - 0.25) / 0.55));
    stats.forEach((s, i) => odos.current[i]?.set(s.value * c));
  }, { scene: 'about' });

  return (
    <section className="scene" id="about" ref={sec} style={{ height: '280vh' }}>
      {createPortal(<div className="about-shade" ref={shade} aria-hidden="true" />, back())}
      <div className="sticky"><div className="inner">
        <div className="about-col">
          <div className="panel">
            <div className="label mono" ref={label}><b>(01)</b> — About me</div>
            <p className="manifesto">
              {words.map((wd, i) => (
                <span key={i} ref={el => { ws.current[i] = el; }} className={manifesto.keywords.includes(wd) ? 'w red' : 'w'}>{wd} </span>
              ))}
            </p>
          </div>
          <div className="stat-row" ref={cards}>
            {stats.map((s, i) => (
              <TiltCard key={i} className="stat">
                <div className="stat-num anton">
                  {s.prefix && <span>{s.prefix}</span>}
                  <Odometer digits={2} ref={h => { odos.current[i] = h; }} />
                  <span className="sfx">{s.suffix}</span>
                </div>
                <div className="stat-lbl mono">{s.label}</div>
              </TiltCard>
            ))}
          </div>
        </div>
      </div></div>
    </section>
  );
}
