import { useEffect, useLayoutEffect, useRef } from 'react';
import { subscribe, onIntro, registerSection, type SceneId, type World } from './director';

/** Subscribe to the scroll world; callback mutates DOM through refs only. */
export function useWorld(cb: (w: World) => void, opts: { scene?: SceneId; always?: boolean } = {}) {
  const ref = useRef(cb); ref.current = cb;
  useEffect(() => subscribe(w => ref.current(w), opts), []);
}
export function useIntro(cb: () => void) {
  const ref = useRef(cb); ref.current = cb;
  useEffect(() => onIntro(() => ref.current()), []);
}
export function useSection(id: SceneId) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => { registerSection(id, ref.current); }, [id]);
  return ref;
}
/** Fade-out multiplier used by every text block so sections never overlap. */
export const exitFade = (exit: number) => Math.max(0, 1 - exit * 2.4);

import { clamp, easeOutCubic, type SceneState } from './director';
/** Standard enter/exit treatment for a text block. */
export function reveal(el: HTMLElement | null, st: SceneState, opts: { delay?: number; dist?: number; speed?: number } = {}) {
  if (!el) return;
  const { delay = 0, dist = 40, speed = 1.5 } = opts;
  const e = easeOutCubic(clamp((st.enter - delay) * speed));
  const o = e * exitFade(st.exit);
  el.style.opacity = o.toFixed(3);
  el.style.transform = `translate3d(0,${((1 - e) * dist - st.exit * 30).toFixed(1)}px,0)`;
  el.style.visibility = o < 0.002 ? 'hidden' : 'visible';
}
export const back = () => document.getElementById('layer-back')!;
export const front = () => document.getElementById('layer-front')!;
