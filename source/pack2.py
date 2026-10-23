import json, os, shutil
import numpy as np
from PIL import Image, ImageFilter
OUT = '/home/claude/swadfolio/public/frames'
for t in ['lg', 'sm', 'md', 'hd']:
    shutil.rmtree(f'{OUT}/{t}', ignore_errors=True)
for t in ['sm', 'md', 'hd']:
    os.makedirs(f'{OUT}/{t}', exist_ok=True)
files = sorted(os.listdir('alpha_hd')); N = len(files)
first = Image.open(f'alpha_hd/{files[0]}'); NW, NH = first.size
K = NH / 900.0  # native px per virtual px
SHOTS = [(0, 24), (25, 66), (67, 95), (96, N - 1)]
shots = []
for a, b in SHOTS:
    x0, y0, x1, y1 = NW, NH, 0, 0; cxs = []
    for i in range(a, b + 1):
        al = np.asarray(Image.open(f'alpha_hd/f{i:03d}.png'))[..., 3]
        ys, xs = np.where(al > 6)
        x0 = min(x0, xs.min()); y0 = min(y0, ys.min()); x1 = max(x1, xs.max() + 1); y1 = max(y1, ys.max() + 1)
        top = al[:int(NH * 0.45)].astype(np.float64)
        cxs.append((top.sum(0) * np.arange(NW)).sum() / top.sum() / NW)
    box = [round(x0 / K), round(y0 / K), round((x1 - x0) / K), round((y1 - y0) / K)]
    for i in range(a, b + 1):
        im = Image.open(f'alpha_hd/f{i:03d}.png')
        arr = np.asarray(im).astype(np.float32)
        lum = arr[..., :3] @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
        al = arr[..., 3] / 255.0
        from scipy import ndimage as ndi
        local = ndi.uniform_filter(np.where(al > 0.5, lum, 255), size=21)
        chroma = arr[..., :3].max(2) - arr[..., :3].min(2)
        zone = (np.arange(NH)[:, None] < NH * 0.32) & (local < 135) & (chroma < 20) & (lum > 135)
        al[zone] *= 1 - np.clip((lum[zone] - 135) / 50, 0, 1)
        al = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255.0
        arr[..., 3] = al * 255
        im = Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGBA').crop((x0, y0, x1, y1))
        rgb, al = im.convert('RGB'), im.getchannel('A')
        rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
        hd = Image.merge('RGBA', (*rgb.split(), al))
        hd.save(f'{OUT}/hd/f{i:03d}.webp', quality=80, alpha_quality=88, method=6)
        md = hd.resize((box[2], box[3]), Image.LANCZOS)
        md.save(f'{OUT}/md/f{i:03d}.webp', quality=80, alpha_quality=88, method=6)
        md.resize((box[2] // 2, box[3] // 2), Image.LANCZOS).save(f'{OUT}/sm/f{i:03d}.webp', quality=78, alpha_quality=85, method=6)
    shots.append({'from': a, 'to': b, 'box': box, 'cx': round(float(np.median(cxs)), 4)})
json.dump({'w': 1600, 'h': 900, 'count': N, 'shots': shots, 'tiers': {'sm': 0.5, 'md': 1, 'hd': round(K, 4)}}, open(f'{OUT}/manifest.json', 'w'))
print(json.dumps(shots))
