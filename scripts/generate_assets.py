#!/usr/bin/env python3
"""Generate all brand assets for ksa.doctor from the master logo."""
from __future__ import annotations

import base64
import io
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
BRAND = PUBLIC / 'brand'
BRAND.mkdir(parents=True, exist_ok=True)
LOGO_PATH = Path('/home/ubuntu/upload/ksa.doctor.logo.png')

GREEN = (0, 104, 48, 255)
CREAM = (248, 244, 233, 255)
GOLD = (200, 164, 92, 255)


def load_logo() -> Image.Image:
    im = Image.open(LOGO_PATH).convert('RGBA')
    # Master logo has a transparent canvas with content in the middle.
    bbox = im.getbbox()
    full = im.crop(bbox)
    full.save(BRAND / 'logo-full.png', optimize=True)

    # The wordmark starts below a clear gap; keep the emblem only.
    alpha = full.getchannel('A')
    rows = [y for y in range(full.height) if alpha.crop((0, y, full.width, y + 1)).getextrema()[1] > 8]
    gap_start = None
    for a, b in zip(rows, rows[1:]):
        if b - a > 30:
            gap_start = a
            break
    if gap_start:
        emblem = full.crop((0, 0, full.width, gap_start + 2))
    else:
        emblem = full.crop((0, 0, full.width, int(full.height * 0.82)))
    eb = emblem.getbbox()
    emblem = emblem.crop(eb)
    # square canvas with breathing room
    side = max(emblem.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(emblem, ((side - emblem.width) // 2, (side - emblem.height) // 2))
    canvas.save(BRAND / 'emblem.png', optimize=True)
    return canvas


def recolor(im: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    out = Image.new('RGBA', im.size, color)
    out.putalpha(im.getchannel('A'))
    return out


def rounded_icon(emblem: Image.Image, size: int, bg: tuple[int, int, int, int], fg: Image.Image, radius_ratio: float = 0.22) -> Image.Image:
    scale = 4
    s = size * scale
    base = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)
    r = int(s * radius_ratio)
    draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=bg)
    # subtle inner border
    draw.rounded_rectangle([int(s * 0.012), int(s * 0.012), s - int(s * 0.012), s - int(s * 0.012)], radius=r, outline=(0, 104, 48, 50), width=max(1, int(s * 0.004)))
    target = int(s * 0.66)
    fg2 = fg.copy()
    fg2.thumbnail((target, target), Image.Resampling.LANCZOS)
    base.alpha_composite(fg2, ((s - fg2.width) // 2, (s - fg2.height) // 2))
    return base.resize((size, size), Image.Resampling.LANCZOS)


def generate_icons(emblem: Image.Image):
    cream_emblem = recolor(emblem, CREAM)
    icon512 = rounded_icon(emblem, 512, CREAM, emblem, 0.22)
    icon512.save(BRAND / 'icon-512.png', optimize=True)
    icon512.resize((192, 192), Image.Resampling.LANCZOS).save(BRAND / 'icon-192.png', optimize=True)
    icon512.resize((180, 180), Image.Resampling.LANCZOS).save(BRAND / 'apple-touch-icon.png', optimize=True)
    icon512.resize((64, 64), Image.Resampling.LANCZOS).save(PUBLIC / 'favicon.png', optimize=True)
    icon512.save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    # Maskable: full-bleed brand green, emblem inside 60% safe zone.
    s = 2048
    base = Image.new('RGBA', (s, s), GREEN)
    target = int(s * 0.56)
    fg = cream_emblem.copy()
    fg.thumbnail((target, target), Image.Resampling.LANCZOS)
    base.alpha_composite(fg, ((s - fg.width) // 2, (s - fg.height) // 2))
    base.resize((512, 512), Image.Resampling.LANCZOS).save(BRAND / 'maskable-512.png', optimize=True)

    # Default avatar: cream disc, green emblem, thin gold ring.
    s = 1024
    av = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(av)
    d.ellipse([8, 8, s - 8, s - 8], fill=CREAM, outline=GOLD, width=10)
    fg = emblem.copy()
    fg.thumbnail((int(s * 0.62), int(s * 0.62)), Image.Resampling.LANCZOS)
    av.alpha_composite(fg, ((s - fg.width) // 2, (s - fg.height) // 2))
    av.resize((512, 512), Image.Resampling.LANCZOS).save(BRAND / 'default-avatar.png', optimize=True)


def b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()


def font_face(family: str, weight: int, files: list[tuple[str, str]]) -> str:
    return '\n'.join(
        f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};src:url(data:font/woff2;base64,{data}) format('woff2');unicode-range:{urange};}}"
        for data, urange in files
    )


def render_with_browser(emblem_path: Path):
    from playwright.sync_api import sync_playwright

    arabic_800 = b64(ROOT / 'node_modules/@fontsource/tajawal/files/tajawal-arabic-800-normal.woff2')
    latin_800 = b64(ROOT / 'node_modules/@fontsource/tajawal/files/tajawal-latin-800-normal.woff2')
    arabic_500 = b64(ROOT / 'node_modules/@fontsource/tajawal/files/tajawal-arabic-500-normal.woff2')
    latin_500 = b64(ROOT / 'node_modules/@fontsource/tajawal/files/tajawal-latin-500-normal.woff2')
    arabic_range = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF'
    latin_range = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
    fonts = font_face('TajawalX', 800, [(arabic_800, arabic_range), (latin_800, latin_range)]) + font_face(
        'TajawalX', 500, [(arabic_500, arabic_range), (latin_500, latin_range)]
    )
    emblem_data = b64(emblem_path)

    pattern = """
      background-image:
        repeating-linear-gradient(60deg, rgba(200,164,92,.075) 0 1px, transparent 1px 52px),
        repeating-linear-gradient(-60deg, rgba(200,164,92,.055) 0 1px, transparent 1px 52px),
        repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px);
    """

    cover = f"""<!doctype html><html><head><meta charset="utf-8"><style>
      {fonts}
      *{{box-sizing:border-box}} html,body{{margin:0;width:2000px;height:750px;overflow:hidden}}
      body{{font-family:'TajawalX';background:
        radial-gradient(1100px 700px at 10% 10%, #0b7a45 0%, transparent 62%),
        radial-gradient(900px 600px at 92% 100%, #0a5c36 0%, transparent 60%),
        linear-gradient(135deg,#022c1c 0%,#064b30 52%,#022c1c 100%);position:relative}}
      .pattern{{position:absolute;inset:0;{pattern};opacity:.9}}
      .vignette{{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.28) 100%)}}
      .ring{{position:absolute;width:760px;height:760px;border-radius:50%;border:1px solid rgba(200,164,92,.22);left:40px;top:-20px}}
      .ring2{{position:absolute;width:980px;height:980px;border-radius:50%;border:1px solid rgba(200,164,92,.1);left:-70px;top:-130px}}
      .disc{{position:absolute;left:150px;top:118px;width:515px;height:515px;border-radius:50%;
        background:radial-gradient(circle at 35% 30%,#fffdf6,#efe7d3 70%);
        box-shadow:0 30px 90px rgba(0,0,0,.35), inset 0 0 0 10px rgba(200,164,92,.55);display:flex;align-items:center;justify-content:center}}
      .disc img{{width:360px;height:360px;object-fit:contain;filter:drop-shadow(0 12px 24px rgba(0,64,30,.18))}}
      .gold{{position:absolute;left:150px;top:660px;width:515px;height:2px;background:linear-gradient(90deg,transparent,#c8a45c,transparent);opacity:.7}}
      .wm{{position:absolute;right:110px;bottom:78px;font-weight:800;font-size:64px;letter-spacing:14px;color:rgba(248,244,233,.16)}}
      .ar{{position:absolute;right:110px;top:250px;text-align:right;color:#f8f4e9;font-weight:800;font-size:76px;line-height:1.25;text-shadow:0 6px 30px rgba(0,0,0,.25)}}
      .ar small{{display:block;font-weight:500;font-size:30px;color:#d9c28e;letter-spacing:2px;margin-bottom:16px}}
      .ar span{{color:#e8cf9a}}
    </style></head><body>
      <div class="pattern"></div><div class="ring2"></div><div class="ring"></div>
      <div class="disc"><img src="data:image/png;base64,{emblem_data}"></div><div class="gold"></div>
      <div class="wm">KSA.DOCTOR</div>
      <div class="ar"><small>أطباء المملكة العربية السعودية</small>رأس مال بشري<br><span>نفخر به</span></div>
      <div class="vignette"></div>
    </body></html>"""

    og = f"""<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
      {fonts}
      *{{box-sizing:border-box}} html,body{{margin:0;width:1200px;height:630px;overflow:hidden}}
      body{{font-family:'TajawalX';background:
        radial-gradient(900px 600px at 8% 10%, #0b7a45 0%, transparent 60%),
        radial-gradient(700px 500px at 100% 100%, #0a5c36 0%, transparent 60%),
        linear-gradient(135deg,#022c1c 0%,#064b30 55%,#022c1c 100%);position:relative;color:#f8f4e9}}
      .pattern{{position:absolute;inset:0;{pattern}}}
      .ring{{position:absolute;width:600px;height:600px;border-radius:50%;border:1px solid rgba(200,164,92,.2);left:-40px;top:15px}}
      .ring2{{position:absolute;width:760px;height:760px;border-radius:50%;border:1px solid rgba(200,164,92,.09);left:-120px;top:-65px}}
      .disc{{position:absolute;left:72px;top:165px;width:300px;height:300px;border-radius:50%;
        background:radial-gradient(circle at 35% 30%,#fffdf6,#efe7d3 70%);
        box-shadow:0 24px 70px rgba(0,0,0,.35), inset 0 0 0 7px rgba(200,164,92,.55);display:flex;align-items:center;justify-content:center}}
      .disc img{{width:212px;height:212px;object-fit:contain}}
      .content{{position:absolute;right:64px;top:74px;width:760px;text-align:right}}
      .eyebrow{{font-weight:500;font-size:23px;color:#d9c28e;letter-spacing:1px}}
      h1{{font-weight:800;font-size:58px;line-height:1.18;margin:16px 0 14px;text-wrap:balance}}
      .slogan{{font-weight:800;font-size:33px;color:#e8cf9a;margin-top:4px}}
      .desc{{font-weight:500;font-size:22px;color:#cfe3d6;margin-top:18px;line-height:1.6}}
      .foot{{position:absolute;right:64px;bottom:52px;display:flex;align-items:center;gap:16px;font-weight:800;letter-spacing:6px;font-size:23px;color:#f8f4e9}}
      .dot{{width:8px;height:8px;border-radius:50%;background:#c8a45c}}
      .line{{position:absolute;left:0;bottom:0;width:100%;height:6px;background:linear-gradient(90deg,#c8a45c,#006830,#c8a45c)}}
    </style></head><body>
      <div class="pattern"></div><div class="ring2"></div><div class="ring"></div>
      <div class="disc"><img src="data:image/png;base64,{emblem_data}"></div>
      <div class="content">
        <div class="eyebrow">منصة الملفات المهنية للأطباء</div>
        <h1>أطباء المملكة العربية السعودية</h1>
        <div class="slogan">رأس مال بشري سعودي نفخر به</div>
        <div class="desc">ملفك المهني الموثوق في رابط واحد · رمز QR · بطاقة أعمال رقمية</div>
      </div>
      <div class="foot"><span>KSA.DOCTOR</span><span class="dot"></span><span style="font-weight:500;letter-spacing:0;font-size:20px;color:#cfe3d6">ملفك في رابط واحد</span></div>
      <div class="line"></div>
    </body></html>"""

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 2000, 'height': 750}, device_scale_factor=1)
        page.set_content(cover, wait_until='load')
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(500)
        page.screenshot(path=str(BRAND / '_cover.png'), type='png')
        page2 = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
        page2.set_content(og, wait_until='load')
        page2.evaluate('document.fonts.ready')
        page2.wait_for_timeout(500)
        page2.screenshot(path=str(BRAND / '_og.png'), type='png')
        browser.close()


def finalize_images():
    cover = Image.open(BRAND / '_cover.png').convert('RGB')
    cover.save(BRAND / 'default-cover.webp', 'WEBP', quality=88, method=6)
    og = Image.open(BRAND / '_og.png').convert('RGB')
    og.save(BRAND / 'og-default.jpg', 'JPEG', quality=91, optimize=True, progressive=True)
    os.remove(BRAND / '_cover.png')
    os.remove(BRAND / '_og.png')


if __name__ == '__main__':
    emblem = load_logo()
    generate_icons(emblem)
    render_with_browser(BRAND / 'emblem.png')
    finalize_images()
    for p in sorted(BRAND.iterdir()):
        print(p.name, p.stat().st_size)
