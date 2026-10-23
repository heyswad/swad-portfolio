import gsap from 'gsap';
import Lenis from 'lenis';

export type SceneId = 'hero' | 'about' | 'work' | 'journey' | 'skills' | 'awards' | 'contact';
export type SceneDef = { id: SceneId; from: number; to: number; x: number; k: number; label: string; h: number };

// Frame ranges come from the single continuous take:
// 0–24 typing · 25–42 looks left · 44–64 looks right · 67–95 headset off · 96–110 wave · 108–123 points down
export const SCENES: SceneDef[] = [
  { id: 'hero', label: 'Hello', from: 0, to: 24, x: 0.70, k: 0.80, h: 230 },
  { id: 'about', label: 'About', from: 44, to: 64, x: 0.27, k: 0.84, h: 280 },
  { id: 'work', label: 'Work', from: 25, to: 42, x: 0.77, k: 0.72, h: 460 },
  { id: 'journey', label: 'Journey', from: 67, to: 80, x: 0.26, k: 0.84, h: 240 },
  { id: 'skills', label: 'Toolkit', from: 80, to: 95, x: 0.50, k: 0.80, h: 280 },
  { id: 'awards', label: 'Numbers', from: 96, to: 108, x: 0.75, k: 0.82, h: 320 },
  { id: 'contact', label: 'Contact', from: 109, to: 123, x: 0.50, k: 0.78, h: 240 },
];

export type SceneState = { enter: number; p: number; exit: number; vis: number; top: number; h: number };
export type FrameState = {
  active: number; frame: number; t: number;
  prev: { frame: number; x: number; k: number } | null;
  cur: { x: number; k: number };
};
export type World = {
  y: number; vw: number; vh: number; mobile: boolean; progress: number;
  scenes: Record<SceneId, SceneState>; f: FrameState; mx: number; my: number;
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Sub = (w: World) => void;
const subs = new Set<Sub>();
const sections = new Map<SceneId, HTMLElement>();
const rects = new Map<SceneId, { top: number; h: number }>();
let lenis: Lenis | null = null;

const blank = (): SceneState => ({ enter: 0, p: 0, exit: 0, vis: 0, top: 0, h: 0 });
export const world: World = {
  y: 0, vw: window.innerWidth, vh: window.innerHeight, mobile: window.innerWidth < 820, progress: 0,
  scenes: Object.fromEntries(SCENES.map(s => [s.id, blank()])) as Record<SceneId, SceneState>,
  f: { active: 0, frame: 0, t: 1, prev: null, cur: { x: SCENES[0].x, k: 1 } }, mx: 0, my: 0,
};

export function subscribe(fn: Sub) { subs.add(fn); fn(world); return () => { subs.delete(fn); }; }

const ro = new ResizeObserver(() => measure());
export function registerSection(id: SceneId, el: HTMLElement | null) {
  if (!el) return; sections.set(id, el); ro.observe(el); measure();
}
function measure() {
  world.vw = window.innerWidth; world.vh = window.innerHeight; world.mobile = world.vw < 820;
  sections.forEach((el, id) => {
    const r = el.getBoundingClientRect();
    rects.set(id, { top: r.top + window.scrollY, h: r.height });
  });
}
window.addEventListener('resize', measure);
window.addEventListener('pointermove', e => {
  world.mx = (e.clientX / window.innerWidth) * 2 - 1;
  world.my = (e.clientY / window.innerHeight) * 2 - 1;
});

function tick() {
  const y = lenis ? lenis.scroll : window.scrollY;
  const { vh } = world; world.y = y;
  const max = document.documentElement.scrollHeight - vh;
  world.progress = max > 0 ? clamp(y / max) : 0;

  const lead = 0.78 * vh, span = 0.62 * vh;
  let active = 0;
  SCENES.forEach((s, i) => {
    const r = rects.get(s.id); if (!r) return;
    const st = world.scenes[s.id];
    st.top = r.top; st.h = r.h;
    st.enter = clamp((y - (r.top - vh)) / vh);
    st.p = clamp((y - r.top) / (r.h - vh));
    st.exit = clamp((y - (r.top + r.h - vh)) / vh);
    st.vis = clamp(Math.min(st.enter * 1.6, 1 - st.exit * 2.2));
    if (y >= r.top - lead) active = i;
  });
  const s = SCENES[active], st = world.scenes[s.id];
  const frame = s.from + (s.to - s.from) * st.p;
  let t = 1, prev: FrameState['prev'] = null;
  if (active > 0) {
    t = easeInOutSine(clamp((y - (st.top - lead)) / span));
    const ps = SCENES[active - 1];
    if (t < 1) prev = { frame: ps.to, x: ps.x, k: ps.k };
  }
  world.f = { active, frame, t, prev, cur: { x: s.x, k: s.k } };
  subs.forEach(fn => fn(world));
}

export function initDirector() {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
  lenis.stop();
  (window as unknown as { __lenis: Lenis }).__lenis = lenis;
  gsap.ticker.add(time => { lenis!.raf(time * 1000); tick(); });
  gsap.ticker.lagSmoothing(0);
  measure();
}
export function startScroll() { lenis?.start(); }
export function scrollToScene(id: SceneId) {
  const r = rects.get(id); if (!r || !lenis) return;
  lenis.scrollTo(r.top + (id === 'hero' ? 0 : 2), { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
}
export function scrollTop() { lenis?.scrollTo(0, { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) }); }

const introSubs = new Set<() => void>();
export function onIntro(fn: () => void) { introSubs.add(fn); return () => { introSubs.delete(fn); }; }
export function fireIntro() { introSubs.forEach(f => f()); }
