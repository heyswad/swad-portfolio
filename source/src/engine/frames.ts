export type Shot = { from: number; to: number };
export type Manifest = { w: number; h: number; count: number; focus: number; shots: Shot[] };
type Tier = 'sm' | 'md' | 'hd';

const listeners = new Set<() => void>();
export const frames = {
  manifest: null as Manifest | null,
  imgs: [] as (CanvasImageSource & { width: number; height: number } | null)[],
  level: [] as number[], // tier index currently held per frame
  loaded: 0,
  onChange(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
};

export function shotOf(i: number): number {
  const m = frames.manifest!;
  for (let s = 0; s < m.shots.length; s++) if (i >= m.shots[s].from && i <= m.shots[s].to) return s;
  return m.shots.length - 1;
}

/** Nearest loaded frame within the same shot (fallback for frames still streaming). */
export function getFrame(i: number) {
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

/** Physical pixel width the full-bleed frame is drawn at, to pick a sharp-enough tier. */
function neededWidth(m: Manifest) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const S = Math.max(window.innerWidth / m.w, window.innerHeight / m.h);
  return m.w * S * dpr;
}

type Bmp = CanvasImageSource & { width: number; height: number };
async function loadOne(src: string): Promise<Bmp | null> {
  try {
    const r = await fetch(src); if (!r.ok) return null;
    const blob = await r.blob();
    if ('createImageBitmap' in window) return await createImageBitmap(blob, { premultiplyAlpha: 'premultiply' });
    const img = new Image(); img.src = URL.createObjectURL(blob); await img.decode(); return img;
  } catch { return null; }
}

async function runQueue(list: number[], tier: Tier, rank: number, conc: number, onEach?: () => void) {
  let idx = 0;
  const worker = async () => {
    while (idx < list.length) {
      const i = list[idx++];
      if (frames.level[i] >= rank) continue;
      const img = await loadOne(`./frames/${tier}/f${pad(i)}.webp`);
      if (img && frames.level[i] < rank) {
        const old = frames.imgs[i];
        if (!old) frames.loaded++;
        frames.imgs[i] = img; frames.level[i] = rank;
        if (old && 'close' in old) (old as ImageBitmap).close();
        listeners.forEach(f => f());
      }
      onEach?.();
    }
  };
  await Promise.all(Array.from({ length: conc }, worker));
}

export async function loadFrames(onProgress: (p: number) => void): Promise<void> {
  const res = await fetch('./frames/manifest.json');
  const m: Manifest = await res.json();
  frames.manifest = m;
  frames.imgs = new Array(m.count).fill(null);
  frames.level = new Array(m.count).fill(-1);

  const need = neededWidth(m);
  // quick tier to start fast, sharp tier streamed in afterwards
  const quick: Tier = need > 700 ? 'md' : 'sm';
  const sharp: Tier = need > 900 ? 'hd' : need > 600 ? 'md' : 'sm';

  // hero shot first (every 2nd frame is enough to start: fractional frames fall back to neighbours)
  const s0 = m.shots[0];
  const first: number[] = [];
  for (let i = s0.from; i <= s0.to; i += 2) first.push(i);
  let done = 0;
  await runQueue(first, quick, 1, 6, () => onProgress(Math.min(1, ++done / first.length)));

  // stream the rest in the background: shot boundaries, then strides 8 → 4 → 2 → 1
  const order: number[] = []; const seen = new Set<number>(first);
  const push = (i: number) => { if (i >= 0 && i < m.count && !seen.has(i)) { seen.add(i); order.push(i); } };
  m.shots.forEach(s => { push(s.from); push(s.to); });
  [8, 4, 2, 1].forEach(st => { for (let i = 0; i < m.count; i += st) push(i); });
  (async () => {
    await runQueue(order, quick, 1, 6);
    if (sharp !== quick) {
      const all: number[] = [];
      for (let i = s0.from; i <= s0.to; i++) all.push(i);
      for (let i = 0; i < m.count; i++) if (i > s0.to) all.push(i);
      await runQueue(all, sharp, 2, 4);
    }
  })();
}
