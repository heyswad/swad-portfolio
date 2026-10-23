import { useEffect, useRef } from 'react';
import { frames, getFrame } from '../engine/frames';
import { SCENES, subscribe, type World } from '../engine/director';

export default function Stage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const ctx = cv.getContext('2d', { alpha: true })!;
    let key = ''; let px = 0, py = 0; let dpr = 1;
    const fit = (w: World) => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(w.vw * dpr), H = Math.round(w.vh * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; key = ''; }
    };
    const fade = (x0: number, y0: number, x1: number, y1: number) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) || w0.vw, Math.abs(y1 - y0) || w0.vh);
    };
    let w0: World;
    const drawShot = (w: World, f: number, _x: number, _k: number, dx: number, follow = true) => {
      const m = frames.manifest; if (!m) return;
      const img = getFrame(Math.round(f), follow); if (!img) return;
      const { vw, vh } = w; w0 = w;
      let S: number, offX: number, offY: number;
      if (w.mobile) {
        // portrait: frame fills the upper ~64% of the screen, centred on the face
        S = (vh * 0.64) / m.h;
        const dw = m.w * S;
        offX = Math.min(0, Math.max(vw - dw, vw / 2 - m.focus * dw));
        offY = 52;
      } else {
        // landscape: fit the full height so the head is never cropped
        S = (vh * 1.02) / m.h;
        const dw = m.w * S;
        offX = dw > vw ? Math.min(0, Math.max(vw - dw, (vw - dw) / 2 + px + dx)) : (vw - dw) / 2 + px + dx;
        offY = vh - m.h * S + py * 0.5;
      }
      const dw = m.w * S, dh = m.h * S;
      ctx.drawImage(img, offX, offY, dw, dh);
      // soften the frame edges into the white page
      const e = Math.min(110, dw * 0.08);
      if (offX > -2) fade(offX - 1, 0, offX + e, 0);
      if (offX + dw < vw + 2) fade(offX + dw + 1, 0, offX + dw - e, 0);
      if (w.mobile) { fade(0, offY + dh + 1, 0, offY + dh - e * 1.6); ctx.fillStyle = '#fff'; ctx.fillRect(0, offY + dh, vw, vh); }
      else if (offY > -2) fade(0, offY - 1, 0, offY + e * 0.6);
    };
    const unsub = subscribe(w => {
      fit(w);
      const tx = w.mobile ? 0 : -w.mx * 12, ty = w.mobile ? 0 : -w.my * 6;
      px += (tx - px) * 0.06; py += (ty - py) * 0.06;
      if (Math.abs(tx - px) < 0.05) px = tx; if (Math.abs(ty - py) < 0.05) py = ty;
      const F = w.f;
      const k2 = `${frames.version}|${Math.round(F.frame)}|${F.t.toFixed(4)}|${F.prev?.frame ?? -1}|${F.active}|${w.vw}x${w.vh}|${px.toFixed(2)}|${py.toFixed(2)}`;
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
        ctx.globalAlpha = 1 - 0.35 * t; drawShot(w, F.prev.frame, F.prev.x, F.prev.k, 30 * t, false);
        ctx.restore();
        // incoming: left of the blade
        ctx.save(); ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(e + skew, 0); ctx.lineTo(e - skew, vh); ctx.lineTo(-20, vh); ctx.closePath(); ctx.clip();
        drawShot(w, F.frame, F.cur.x, F.cur.k, -30 * (1 - t));
        ctx.restore();
        // blade + trail
        const white = SCENES[F.active].id === 'contact';
        const col = white ? '255,255,255' : '255,31,31';
        ctx.save();
        const g = ctx.createLinearGradient(e - 90, 0, e, 0);
        g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.28)`);
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(e + skew - 90, 0); ctx.lineTo(e + skew, 0); ctx.lineTo(e - skew, vh); ctx.lineTo(e - skew - 90, vh); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgb(${col})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(e + skew, 0); ctx.lineTo(e - skew, vh); ctx.stroke();
        ctx.globalAlpha = 0.25; ctx.lineWidth = 14; ctx.stroke();
        ctx.restore();
      } else {
        drawShot(w, F.frame, F.cur.x, F.cur.k, 0);
      }
    }, { always: true });
    return unsub;
  }, []);
  return <canvas ref={ref} className="stage" aria-label="Swad at his desk, reacting as you scroll" />;
}
