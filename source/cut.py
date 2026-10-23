import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from rembg import remove, new_session

SRC = 'full'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
os.makedirs(f'{OUT}/lg', exist_ok=True); os.makedirs(f'{OUT}/sm', exist_ok=True); os.makedirs('alpha_hd', exist_ok=True)
files = sorted(os.listdir(SRC))
N = len(files)
SHOTS = [(0, 24), (25, 66), (67, 95), (96, N - 1)]
VW, VH = 1600, 900
sess = new_session('u2net_human_seg')

def process(i):
    im = Image.open(f'{SRC}/{files[i]}').convert('RGB')
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    k = 24
    corners = np.concatenate([a[:k, :k].reshape(-1, 3), a[:k, -k:].reshape(-1, 3), a[h//2:h//2+k, :k].reshape(-1, 3), a[h//2:h//2+k, -k:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    person = np.asarray(remove(im, session=sess, only_mask=True)).astype(np.float32) / 255.0
    dist = np.max(np.abs(a - bg), axis=2)
    props = np.clip((dist - 14) / (40 - 14), 0, 1)
    binm = ndimage.binary_opening(props > 0.5, structure=np.ones((3, 3)))
    lab, n = ndimage.label(binm)
    if n:
        sizes = ndimage.sum(binm, lab, range(1, n + 1))
        keep = np.isin(lab, np.where(sizes > 4000)[0] + 1)
    else:
        keep = binm
    keep = ndimage.binary_dilation(keep, iterations=4)
    props = props * keep
    alpha = np.maximum(person, props)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255.0
    # un-premultiply against background
    bgv = bg.mean()
    m = alpha > 0.05
    rgb = a.copy()
    for c in range(3):
        ch = rgb[..., c]
        ch[m] = (ch[m] - (1 - alpha[m]) * bg[c]) / alpha[m]
    rgb = np.clip(rgb, 0, 255)
    # erode
    mn = ndimage.minimum_filter(alpha, size=3)
    alpha = 0.35 * alpha + 0.65 * mn
    alpha = np.clip((alpha - 0.14) / 0.86, 0, 1) ** 1.4
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    edge = alpha < 0.95
    alpha[edge] *= 1 - 0.8 * np.clip((lum[edge] - 150) / 70, 0, 1)
    # kill background specks trapped inside the hair (head zone only)
    yy = np.arange(h)[:, None] < h * 0.30
    near_bg = np.clip((dist - 12) / 18, 0, 1)
    bright = lum > 165
    local = ndimage.uniform_filter(lum, size=15)
    zone = yy & bright & (local < 120)
    alpha[zone] *= near_bg[zone]
    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, 'RGBA')
    # native resolution: 1248 tall == 900 virtual (scale 1248/900)
    NW = round(VW * h / VH)
    canvas = Image.new('RGBA', (NW, h), (0, 0, 0, 0))
    canvas.paste(img, ((NW - w) // 2, 0))
    canvas.save(f'alpha_hd/f{i:03d}.png')
    return i

if __name__ == '__main__':
    lo, hi = int(sys.argv[2]), int(sys.argv[3])
    for i in range(lo, hi):
        process(i)
        print(i, flush=True)
