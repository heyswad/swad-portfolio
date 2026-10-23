import { useRef } from 'react';
import { counters, ventures } from '../data';
import { exitFade, reveal, useSection, useWorld } from '../engine/hooks';
import { clamp, easeOutCubic } from '../engine/director';

const N = ventures.length;

export default function Awards() {
  const sec = useSection('awards');
  const head = useRef<HTMLDivElement>(null), cyl = useRef<HTMLDivElement>(null), cylWrap = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]), nums = useRef<(HTMLSpanElement | null)[]>([]);

  useWorld(w => {
    const st = w.scenes.awards;
    reveal(head.current, st);
    const fade = exitFade(st.exit);
    cards.current.forEach((c, i) => {
      if (!c) return;
      const r = easeOutCubic(clamp((st.enter - 0.35 - i * 0.12) * 2.2));
      c.style.transform = `perspective(800px) rotateX(${(-100 * (1 - r)).toFixed(2)}deg)`;
      c.style.opacity = (Math.min(1, r * 1.4) * fade).toFixed(3);
      const n = nums.current[i];
      if (n) n.textContent = String(Math.round(counters[i].value * easeOutCubic(clamp((st.enter - 0.4) * 1.6 + st.p))));
    });
    if (cylWrap.current) {
      const e = easeOutCubic(clamp((st.enter - 0.2) * 1.5)), o = e * fade;
      cylWrap.current.style.opacity = o.toFixed(3);
      cylWrap.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    }
    if (cyl.current) cyl.current.style.transform = `translateZ(-360px) rotateX(-14deg) rotateY(${(-st.p * (360 - 360 / N)).toFixed(2)}deg)`;
  });

  return (
    <section className="scene" id="awards" ref={sec} style={{ height: '320vh' }}>
      <div className="sticky"><div className="inner">
        <div className="awards-col">
          <div className="panel" ref={head}>
            <div className="label mono"><b>(05)</b> — By the numbers</div>
            <h2 className="anton sec-title">RESULTS,<br /><span className="red">NOT RÉSUMÉS.</span></h2>
          </div>
          <div className="counters">
            {counters.map((c, i) => (
              <div key={i} className={`counter ${i % 2 ? 'dark' : 'redc'}`} ref={el => { cards.current[i] = el; }}>
                <div className="anton cnum">{c.pre}<span ref={el => { nums.current[i] = el; }}>{c.value}</span>{c.unit && <small>{c.unit}</small>}{c.suffix}</div>
                <div className="mono clbl">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="cyl-wrap" ref={cylWrap}>
            <div className="mono cyl-lbl"><b>✦</b> Ventures & brands I built</div>
            <div className="cyl-stage"><div className="cyl" ref={cyl}>
              {ventures.map((v, i) => (
                <div key={v.title} className={`cert ${i % 3 === 0 ? 'redcert' : ''}`} style={{ transform: `rotateY(${(360 / N) * i}deg) translateZ(360px)` }}>
                  <div className="cert-f"><span className="mono">{String(i + 1).padStart(2, '0')}</span><b className="anton">{v.title}</b><em>{v.issuer}</em><i className="seal">✓</i></div>
                  <div className="cert-b" />
                </div>
              ))}
            </div></div>
          </div>
        </div>
      </div></div>
    </section>
  );
}
