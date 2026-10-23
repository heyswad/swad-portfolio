import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { SCENES, fireIntro, scrollToScene, startScroll, type SceneId } from '../engine/director';
import { loadFrames } from '../engine/frames';
import { useWorld } from '../engine/hooks';
import { person } from '../data';

/* ---------- Preloader ---------- */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null), num = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const st = { v: 0 }; let target = 0; let done = false;
    const tw = gsap.to(st, { v: 0, duration: 0.01 });
    const render = () => { if (num.current) num.current.textContent = String(Math.round(st.v)).padStart(3, '0'); };
    const finish = () => {
      if (done) return; done = true;
      const r = root.current!;
      const tl = gsap.timeline({ onComplete: () => { r.style.display = 'none'; } });
      tl.to(st, { v: 100, duration: 0.35, ease: 'power2.out', onUpdate: render })
        .to(r.querySelectorAll('.pl-line'), { yPercent: -120, opacity: 0, duration: 0.5, ease: 'expo.in', stagger: 0.05 })
        .to(r.querySelector('.pl-num'), { yPercent: -30, opacity: 0, duration: 0.5, ease: 'expo.in' }, '<')
        .to(r.querySelector('.pl-top'), { yPercent: -100, duration: 1.2, ease: 'expo.inOut' })
        .to(r.querySelector('.pl-bot'), { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, '<')
        .add(() => { fireIntro(); startScroll(); }, '-=0.75');
    };
    loadFrames(p => {
      target = p * 100; tw.kill();
      gsap.to(st, { v: target, duration: 0.6, ease: 'power2.out', onUpdate: render, onComplete: () => { if (target >= 100) finish(); } });
    }).then(() => setTimeout(finish, 700)).catch(() => finish());
  }, []);
  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="pl-top" /><div className="pl-bot" />
      <div className="pl-mid">
        <div className="pl-line mono">Swad · Portfolio {new Date().getFullYear()}</div>
        <span className="pl-num anton" ref={num}>000</span>
        <div className="pl-line mono">Loading the story</div>
      </div>
    </div>
  );
}

/* ---------- HUD ---------- */
export function HUD() {
  const root = useRef<HTMLDivElement>(null), pct = useRef<HTMLSpanElement>(null), rail = useRef<HTMLDivElement>(null);
  const pills = useRef<(HTMLButtonElement | null)[]>([]);
  let last = -1, lastRed = false;
  useWorld(w => {
    if (pct.current) pct.current.textContent = String(Math.round(w.progress * 100)).padStart(2, '0') + '%';
    if (rail.current) rail.current.style.transform = `scaleY(${w.progress})`;
    const a = w.f.active;
    if (a !== last) { pills.current.forEach((p, i) => p?.classList.toggle('on', i === a)); last = a; }
    const red = SCENES[a].id === 'contact' && w.f.t > 0.6;
    if (red !== lastRed) { root.current?.classList.toggle('on-red', red); lastRed = red; }
  });
  return (
    <div className="hud" ref={root}>
      <button className="logo anton" data-cursor="Top" onClick={() => scrollToScene('hero')}>{person.first}<sup>®</sup></button>
      <nav className="pills" aria-label="Sections">
        {SCENES.map((s, i) => (
          <button key={s.id} ref={el => { pills.current[i] = el; }} className="pill mono" onClick={() => scrollToScene(s.id as SceneId)}>{s.label}</button>
        ))}
      </nav>
      <div className="prog mono"><span ref={pct}>00%</span><div className="rail"><div ref={rail} /></div></div>
    </div>
  );
}

/* ---------- Cursor ---------- */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null), lab = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!matchMedia('(pointer:fine)').matches) return;
    document.documentElement.classList.add('has-cursor');
    let x = -100, y = -100, rx = -100, ry = -100;
    const mv = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest('[data-cursor]') as HTMLElement | null;
      ring.current?.classList.toggle('big', !!t);
      if (lab.current) lab.current.textContent = t?.dataset.cursor || '';
    };
    addEventListener('pointermove', mv); addEventListener('pointerover', over);
    const tick = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate(${x}px,${y}px)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px,${ry}px)`;
    };
    gsap.ticker.add(tick);
    return () => { removeEventListener('pointermove', mv); removeEventListener('pointerover', over); gsap.ticker.remove(tick); };
  }, []);
  return (<><div className="c-ring" ref={ring}><span ref={lab} /></div><div className="c-dot" ref={dot} /></>);
}

/* ---------- Magnetic button ---------- */
export function Btn({ children, href, variant = 'red', cursor = 'Go', onClick, download }:
  { children: ReactNode; href?: string; variant?: 'red' | 'outline'; cursor?: string; onClick?: () => void; download?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current!; if (!matchMedia('(pointer:fine)').matches) return;
    const qx = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1,0.4)' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1,0.4)' });
    const mv = (e: PointerEvent) => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.35); qy((e.clientY - r.top - r.height / 2) * 0.35); };
    const lv = () => { qx(0); qy(0); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); };
  }, []);
  return (
    <a ref={ref} className={`btn btn-${variant}`} href={href || '#'} data-cursor={cursor}
      target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener" download={download || undefined}
      onClick={e => { if (onClick) { e.preventDefault(); onClick(); } }}>
      <span className="btn-fill" />
      <span className="btn-roll"><span>{children}</span><span aria-hidden="true">{children}</span></span>
    </a>
  );
}
