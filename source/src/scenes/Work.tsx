import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { projects, type Visual } from '../data';
import { back, exitFade, reveal, useSection, useWorld } from '../engine/hooks';
import { clamp, easeInOut, easeOutCubic } from '../engine/director';

function Mock({ v }: { v: Visual }) {
  if (v === 'bars') return (
    <div className="mock bars">{[38, 52, 46, 64, 72, 88, 100].map((h, i) => <i key={i} style={{ ['--h' as string]: `${h}%`, animationDelay: `${i * 0.12}s` }} />)}<b className="anton">₹20 Cr</b></div>
  );
  if (v === 'gauge') return (
    <div className="mock gauge"><div className="g-ring" /><div className="g-txt"><b className="anton">5x</b><span className="mono">sales / ad spend</span></div></div>
  );
  if (v === 'chat') return (
    <div className="mock chat">
      <p className="me">Make my pet a diet plan</p>
      <p className="ai">Here's a 7-day plan for Bruno, 18 kg, active…</p>
      <p className="me">Book a vet visit too</p>
      <p className="ai typing"><i /><i /><i /></p>
    </div>
  );
  return <div className="mock heat">{Array.from({ length: 48 }).map((_, i) => <i key={i} style={{ animationDelay: `${(i * 37) % 23 / 10}s` }} />)}</div>;
}

export default function Work() {
  const sec = useSection('work');
  const floor = useRef<HTMLDivElement>(null), head = useRef<HTMLDivElement>(null), deck = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null), bar = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const n = projects.length;

  useWorld(w => {
    const st = w.scenes.work;
    if (floor.current) {
      const e = easeOutCubic(clamp(st.enter * 1.3)), o = e * exitFade(st.exit);
      floor.current.style.opacity = o.toFixed(3);
      floor.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      floor.current.style.setProperty('--gy', `${(st.p * 900).toFixed(1)}px`);
    }
    reveal(head.current, st);
    if (deck.current) {
      const e = easeOutCubic(clamp(st.enter * 1.25)), o = e * exitFade(st.exit);
      deck.current.style.opacity = o.toFixed(3);
      deck.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      deck.current.style.transform = `translateY(${((1 - e) * 40).toFixed(2)}vh) rotateY(${((1 - e) * -25).toFixed(2)}deg)`;
    }
    const raw = clamp(st.p * 1.08) * (n - 1);
    const i0 = Math.min(n - 2, Math.floor(raw));
    const q = i0 + easeInOut(clamp(raw - i0));
    const vh = w.vh / 100;
    cards.current.forEach((c, j) => {
      if (!c) return;
      const d = j - q;
      let z: number, y: number, rx = 0, o: number;
      if (d >= 0) { z = -d * 300; y = d * 3.2 * vh; o = d <= 1 ? 1 : clamp(1 - (d - 1) * 0.6); }
      else { const a = -d; z = a * 900; y = -12 * a * vh; rx = 28 * a; o = a < 0.12 ? 1 : clamp(1 - (a - 0.12) * 2.1); }
      c.style.transform = `translate3d(0,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg)`;
      c.style.opacity = o.toFixed(3);
      c.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
      c.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    });
    const idx = Math.min(n, Math.round(q) + 1);
    if (count.current) count.current.textContent = `${String(idx).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    if (bar.current) bar.current.style.transform = `scaleX(${(q / (n - 1)).toFixed(3)})`;
  });

  return (
    <section className="scene" id="work" ref={sec} style={{ height: '460vh' }}>
      {createPortal(<div className="work-floor" ref={floor} aria-hidden="true"><div /></div>, back())}
      <div className="sticky"><div className="inner">
        <div className="work-head panel" ref={head}>
          <div className="label mono"><b>(02)</b> — Selected work</div>
          <div className="wh-row"><span className="anton wh-count" ref={count}>01 / 04</span><div className="wh-bar"><div ref={bar} /></div></div>
        </div>
        <div className="deck" ref={deck}>
          {projects.map((p, j) => (
            <article className="card" key={p.n} ref={el => { cards.current[j] = el; }}>
              <div className="card-l">
                <div className="mono card-meta"><b>{p.n}</b> — {p.cat}</div>
                <h3 className="anton">{p.name}</h3>
                <p>{p.desc}</p>
                <div className="chips">{p.chips.map(c => <span key={c} className="mono">{c}</span>)}</div>
                {p.link
                  ? <a className="card-link" href={p.link.href} target="_blank" rel="noopener" data-cursor="Open">{p.link.label} ↗</a>
                  : <span className="card-link muted">Numbers on request</span>}
              </div>
              <div className="card-r"><Mock v={p.visual} /></div>
            </article>
          ))}
        </div>
      </div></div>
    </section>
  );
}
