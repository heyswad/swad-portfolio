/*
 * Frame store.
 * - Compressed WebP blobs are kept for every frame (small: ~15 MB for the whole take).
 * - Only a sliding window of frames around the playhead is decoded into ImageBitmaps,
 *   so GPU/RAM use stays flat (~40 frames) instead of holding every decoded frame.
 * - A quick tier streams first so the page starts fast; the sharp tier replaces it while idle.
 */
export type Shot = { from: number; to: number };
export type Manifest = { w: number; h: number; count: number; focus: number; shots: Shot[] };
type Tier = 'sm' | 'md' | 'hd';
type Bmp = ImageBitmap | HTMLImageElement;

const WINDOW = 20;   // decoded frames kept on each side of the playhead
const EVICT = 30;    // decoded frames further than this are released

const listeners = new Set<() => void>();
export const frames = {
  manifest: null as Manifest | null,
  blobs: [] as (Blob | null)[],
  rank: [] as number[],          // tier rank of the stored blob
  level: [] as number[],         // tier rank of the decoded bitmap (-1 = not decoded)
  bmps: new Map<number, Bmp>(),
  loaded: 0,                     // number of frames with a blob
  version: 0,                    // bumps whenever a decoded frame becomes available
  onChange(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
};
const notify = () => { frames.version++; listeners.forEach(f => f()); };

export function shotOf(i: number): number {
  const m = frames.manifest!;
  for (let s = 0; s < m.shots.length; s++) if (i >= m.shots[s].from && i <= m.shots[s].to) return s;
  return m.shots.length - 1;
}

let center = 0;
/** Best decoded frame for index i (falls back to the nearest decoded neighbour). */
export function getFrame(i: number, follow = true): Bmp | null {
  const m = frames.manifest; if (!m) return null;
  i = Math.max(0, Math.min(m.count - 1, Math.round(i)));
  if (follow && i !== center) { center = i; pump(); }
  const hit = frames.bmps.get(i); if (hit) return hit;
  for (let d = 1; d < m.count; d++) {
    const a = frames.bmps.get(i - d); if (a) return a;
    const b = frames.bmps.get(i + d); if (b) return b;
  }
  return null;
}

/* ---------- decoding window ---------- */
let decoding = 0; const inflight = new Set<number>();
function pump() {
  const m = frames.manifest; if (!m) return;
  // release far frames
  frames.bmps.forEach((b, k) => {
    if (Math.abs(k - center) > EVICT) { if ('close' in b) (b as ImageBitmap).close(); frames.bmps.delete(k); frames.level[k] = -1; }
  });
  while (decoding < 3) {
    let pick = -1;
    for (let d = 0; d <= WINDOW && pick < 0; d++) {
      for (const k of d === 0 ? [center] : [center + d, center - d]) {
        if (k < 0 || k >= m.count || inflight.has(k)) continue;
        if (frames.blobs[k] && frames.rank[k] > frames.level[k]) { pick = k; break; }
      }
    }
    if (pick < 0) return;
    decode(pick);
  }
}
async function decode(k: number) {
  const blob = frames.blobs[k]!; const r = frames.rank[k];
  decoding++; inflight.add(k);
  try {
    let bmp: Bmp;
    if ('createImageBitmap' in window) bmp = await createImageBitmap(blob);
    else { const img = new Image(); img.src = URL.createObjectURL(blob); await img.decode(); bmp = img; }
    if (Math.abs(k - center) > EVICT) { if ('close' in bmp) (bmp as ImageBitmap).close(); }
    else {
      const old = frames.bmps.get(k);
      if (old && old !== bmp && 'close' in old) (old as ImageBitmap).close();
      frames.bmps.set(k, bmp); frames.level[k] = r; notify();
    }
  } catch { /* skip broken frame */ }
  decoding--; inflight.delete(k); pump();
}

/* ---------- network ---------- */
const pad = (n: number) => String(n).padStart(3, '0');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
/** Wait until the page is not being scrolled, so background loading never steals frames from motion. */
async function whenIdle() {
  const L = (window as unknown as { __lenis?: { isScrolling: boolean | string } }).__lenis;
  let quiet = 0;
  while (quiet < 2) { if (L && L.isScrolling) quiet = 0; else quiet++; await sleep(90); }
}
async function fetchQueue(list: number[], tier: Tier, rank: number, conc: number, idle: boolean, onEach?: () => void) {
  let idx = 0;
  const worker = async () => {
    while (idx < list.length) {
      if (idle) await whenIdle();
      const i = list[idx++];
      if (frames.rank[i] >= rank) { onEach?.(); continue; }
      try {
        const r = await fetch(`./frames/${tier}/f${pad(i)}.webp`);
        if (r.ok) {
          const b = await r.blob();
          if (frames.rank[i] < rank) { if (!frames.blobs[i]) frames.loaded++; frames.blobs[i] = b; frames.rank[i] = rank; pump(); }
        }
      } catch { /* retry later via nearest-frame fallback */ }
      onEach?.();
    }
  };
  await Promise.all(Array.from({ length: conc }, worker));
}

export async function loadFrames(onProgress: (p: number) => void): Promise<void> {
  const res = await fetch('./frames/manifest.json');
  const m: Manifest = await res.json();
  frames.manifest = m;
  frames.blobs = new Array(m.count).fill(null);
  frames.rank = new Array(m.count).fill(-1);
  frames.level = new Array(m.count).fill(-1);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = window.innerWidth, vh = window.innerHeight;
  const need = vw < 820 ? m.w * (vh * 0.64 / m.h) * dpr : m.w * (vh * 1.02 / m.h) * dpr; // physical px wide
  const quick: Tier = vw < 820 ? 'sm' : 'md';
  const sharp: Tier = need > m.w * 0.72 ? 'hd' : need > m.w * 0.48 ? 'md' : 'sm';

  // first screen: every 2nd frame of the opening shot
  const s0 = m.shots[0];
  const first: number[] = [];
  for (let i = s0.from; i <= s0.to; i += 2) first.push(i);
  let done = 0;
  await fetchQueue(first, quick, 1, 6, false, () => onProgress(Math.min(1, ++done / first.length)));
  center = 0; pump();

  // background: boundaries, then strides 8 → 4 → 2 → 1; then the sharp tier, all only while idle
  const order: number[] = []; const seen = new Set<number>(first);
  const push = (i: number) => { if (i >= 0 && i < m.count && !seen.has(i)) { seen.add(i); order.push(i); } };
  m.shots.forEach(s => { push(s.from); push(s.to); });
  [8, 4, 2, 1].forEach(st => { for (let i = 0; i < m.count; i += st) push(i); });
  (async () => {
    await fetchQueue(order, quick, 1, 4, true);
    if (sharp !== quick) {
      const all = Array.from({ length: m.count }, (_, i) => i);
      await fetchQueue(all, sharp, 2, 2, true);
    }
  })();
}
