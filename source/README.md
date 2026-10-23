# Swad portfolio — source

Scroll-driven portfolio (Vite + React + TypeScript, GSAP ticker, Lenis).

```
npm install
npm run dev      # local dev server (copy ../frames into public/frames first)
npm run build    # outputs dist/ — copy its contents to the repo root to deploy
```

All copy lives in `src/data.ts`. Frames (sm/md/hd tiers + manifest.json) live in the repo root `frames/`;
`cut.py` and `pack2.py` regenerate them from the source video.
