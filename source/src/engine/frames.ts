export type Shot = { from: number; to: number; box: [number, number, number, number]; cx: number };
export type Manifest = { w: number; h: number; count: number; shots: Shot[] };

const listeners = new Set<() => void>();
export const frames = {
  manifest: null as Manifest | null,
  imgs: [] as (HTMLImageElement | null)[],
  loaded: 0,
  size: 'lg' as 'lg' | 'sm',
  onChange(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
};

export function shotOf(i: number): number {
  const m = frames.manifest!;
  for (let s = 0; s < m.shots.length; s++) if (i >= m.shots[s].from && i <= m.shots[s].to) return s;
  return m.shots.length - 1;
}

/** Nearest loaded frame within the same shot (fallback for frames still streaming). */
export function getFrame(i: number): HTMLImageElement | null {
  const m = frames.manifest; if (!m) return null;
  i = Math.max(0, Math.min(m.count - 1, Math.round(i)));
  if (frames.imgs[i]) return frames.imgs[i];
  const s = m.shots[shotOf(i)];
  for (let d = 1; d <= s.to - s.from; d++) {
    const a = i - d, b = i + d;
    if (a >= s.from && frames.imgs[a]) return frames.imgs[a];
    if (b <= s.to && frames.imgs[b]) return frames.imgs[b];
  }
  return null;
}

const pad = (n: number) => String(n).padStart(3, '0');

export async function loadFrames(onProgress: (p: number) => void): Promise<void> {
  const res = await fetch('./frames/manifest.json');
  const m: Manifest = await res.json();
  frames.manifest = m;
  frames.size = window.innerWidth < 820 ? 'sm' : 'lg';
  frames.imgs = new Array(m.count).fill(null);

  // order: shot boundaries first, then strides 8 → 4 → 2 → 1
  const order: number[] = []; const seen = new Set<number>();
  const push = (i: number) => { if (i >= 0 && i < m.count && !seen.has(i)) { seen.add(i); order.push(i); } };
  m.shots.forEach(s => { push(s.from); push(s.to); });
  [8, 4, 2, 1].forEach(st => { for (let i = 0; i < m.count; i += st) push(i); });

  const need = Math.ceil(m.count / 4);
  let doneFirst = false;
  return new Promise(resolve => {
    let idx = 0, inflight = 0;
    const next = () => {
      while (inflight < 6 && idx < order.length) {
        const i = order[idx++]; inflight++;
        const img = new Image();
        img.src = `./frames/${frames.size}/f${pad(i)}.webp`;
        const fin = (ok: boolean) => {
          inflight--;
          if (ok) { frames.imgs[i] = img; }
          frames.loaded++;
          listeners.forEach(f => f());
          if (!doneFirst) { onProgress(Math.min(1, frames.loaded / need)); if (frames.loaded >= need) { doneFirst = true; resolve(); } }
          next();
        };
        img.decode().then(() => fin(true), () => fin(false));
      }
    };
    next();
  });
}
