import { useEffect, useRef } from 'react';
import { frames, getFrame, shotOf } from '../engine/frames';
import { SCENES, subscribe, type World } from '../engine/director';

export default function Stage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const ctx = cv.getContext('2d', { alpha: true, desynchronized: true })!;
    let key = ''; let px = 0, py = 0; let dpr = 1;
    const fit = (w: World) => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(w.vw * dpr), H = Math.round(w.vh * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; key = ''; }
    };
    const drawShot = (w: World, f: number, x: number, k: number, dx: number) => {
      const m = frames.manifest; if (!m) return;
      const i0 = Math.round(f);
      const s = m.shots[shotOf(i0)];
      const [bx, by, bw, bh] = s.box;
      let scale: number, X = x;
      if (w.mobile) { scale = Math.min((w.vh * 0.74) / 900, (w.vw * 1.05) / bw); X = 0.5; }
      else scale = (w.vh * k) / 900;
      const offY = w.vh - 900 * scale;
      const offX = X * w.vw - s.cx * 1600 * scale + px + dx;
      const put = (img: ReturnType<typeof getFrame>) => { if (img) ctx.drawImage(img, offX + bx * scale, offY + by * scale + py, bw * scale, bh * scale); };
      put(getFrame(i0));
    };
    const unsub = subscribe(w => {
      fit(w);
      const tx = w.mobile ? 0 : w.mx * 14, ty = w.mobile ? 0 : w.my * 6;
      px += (tx - px) * 0.06; py += (ty - py) * 0.06;
      if (Math.abs(tx - px) < 0.05) px = tx; if (Math.abs(ty - py) < 0.05) py = ty;
      const F = w.f;
      const k2 = `${frames.level.reduce((a, b) => a + b, 0)}|${Math.round(F.frame)}|${F.t.toFixed(4)}|${F.prev?.frame ?? -1}|${F.active}|${w.vw}x${w.vh}|${frames.loaded}|${px.toFixed(2)}|${py.toFixed(2)}`;
      if (k2 === key) return; key = k2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, w.vw, w.vh);
      const { vw, vh } = w;
      if (F.prev && F.t < 1) {
        const t = F.t, skew = 0.2 * vh, e = -skew + (vw + 2 * skew) * t;
        // outgoing: right of the blade
        ctx.save(); ctx.beginPath();
        ctx.moveTo(e + skew, 0); ctx.lineTo(vw + 20, 0); ctx.lineTo(vw + 20, vh); ctx.lineTo(e - skew, vh); ctx.closePath(); ctx.clip();
        ctx.globalAlpha = 1 - 0.35 * t; drawShot(w, F.prev.frame, F.prev.x, F.prev.k, 60 * t);
        ctx.restore();
        // incoming: left of the blade
        ctx.save(); ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(e + skew, 0); ctx.lineTo(e - skew, vh); ctx.lineTo(-20, vh); ctx.closePath(); ctx.clip();
        drawShot(w, F.frame, F.cur.x, F.cur.k, -60 * (1 - t));
        ctx.restore();
        // blade + trail
        const white = SCENES[F.active].id === 'contact';
        const col = white ? '255,255,255' : '255,31,31';
        ctx.save();
        const g = ctx.createLinearGradient(e - 90, 0, e, 0);
        g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.28)`);
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(e + skew - 90, 0); ctx.lineTo(e + skew, 0); ctx.lineTo(e - skew, vh); ctx.lineTo(e - skew - 90, vh); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgb(${col})`; ctx.lineWidth = 3; ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.moveTo(e + skew, 0); ctx.lineTo(e - skew, vh); ctx.stroke();
        ctx.restore();
      } else {
        drawShot(w, F.frame, F.cur.x, F.cur.k, 0);
      }
    }, { always: true });
    return unsub;
  }, []);
  return <canvas ref={ref} className="stage" aria-label="Swad at his desk, reacting as you scroll" />;
}
