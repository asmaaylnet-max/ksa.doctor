#!/usr/bin/env python3
"""Build a branded Arabic PDF from docs/LAUNCH_READINESS.md."""
from pathlib import Path
import base64
import markdown

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
MD_PATH = DOCS / "LAUNCH_READINESS.md"
HTML_PATH = DOCS / "LAUNCH_READINESS.html"
PDF_PATH = DOCS / "LAUNCH_READINESS.pdf"

text = MD_PATH.read_text(encoding="utf-8")
start = text.index("## 1. الملخص التنفيذي")
body_md = text[start:]
body_html = markdown.markdown(body_md, extensions=["tables", "sane_lists", "fenced_code"])

emblem = base64.b64encode((ROOT / "public/brand/emblem.png").read_bytes()).decode()
font_dir = ROOT / "node_modules/@fontsource/tajawal/files"
def font_url(name: str) -> str:
    return (font_dir / name).as_uri()

gallery = f"""
<section class="appendix">
  <div class="eyebrow">ملحق بصري</div>
  <h2>لقطات من المنصة</h2>
  <p class="lead">لقطات حقيقية من بيئة الإنتاج بعد الاختبار النهائي. لقطات الملف المهني تستخدم بيانات طبيب اختبار مؤقتًا، وقد حُذف الحساب بعد الاختبار.</p>
  <div class="gallery">
    <figure><img src="{(DOCS / 'qa/report-home-mobile.png').as_uri()}" /><figcaption>الرئيسية — جوال</figcaption></figure>
    <figure><img src="{(DOCS / 'qa/report-profile-mobile.png').as_uri()}" /><figcaption>الملف المهني — جوال</figcaption></figure>
    <figure><img src="{(DOCS / 'qa/report-admin-mobile.png').as_uri()}" /><figcaption>لوحة الإشراف — جوال</figcaption></figure>
    <figure><img src="{(DOCS / 'qa/report-dashboard-mobile.png').as_uri()}" /><figcaption>لوحة المستخدم — جوال</figcaption></figure>
  </div>
  <figure class="wide"><img src="{(DOCS / 'qa/home-desktop.png').as_uri()}" /><figcaption>الرئيسية — سطح المكتب</figcaption></figure>
</section>
"""
body_html = body_html.replace('<h2>10. القرار</h2>', gallery + '<h2>10. القرار</h2>')

css = f"""
@font-face {{ font-family:'Tajawal'; src:url('{font_url('tajawal-arabic-400-normal.woff2')}') format('woff2'); font-weight:400; }}
@font-face {{ font-family:'Tajawal'; src:url('{font_url('tajawal-arabic-500-normal.woff2')}') format('woff2'); font-weight:500; }}
@font-face {{ font-family:'Tajawal'; src:url('{font_url('tajawal-arabic-700-normal.woff2')}') format('woff2'); font-weight:700; }}
@font-face {{ font-family:'Tajawal'; src:url('{font_url('tajawal-arabic-800-normal.woff2')}') format('woff2'); font-weight:800; }}
@font-face {{ font-family:'Tajawal'; src:url('{font_url('tajawal-arabic-900-normal.woff2')}') format('woff2'); font-weight:900; }}
@page {{ size:A4; margin:0; }}
* {{ box-sizing:border-box; }}
html, body {{ margin:0; padding:0; }}
body {{ font-family:'Tajawal', 'Noto Sans Arabic', sans-serif; direction:rtl; color:#17231d; background:#fff; font-size:10.5pt; line-height:1.8; }}
.cover {{ height:297mm; padding:25mm 22mm; background:
  radial-gradient(circle at 18% 22%, rgba(200,164,92,.22), transparent 30%),
  radial-gradient(circle at 88% 85%, rgba(0,104,48,.55), transparent 42%),
  linear-gradient(135deg,#022c1c 0%,#075c3b 58%,#032418 100%);
  color:#fff; position:relative; overflow:hidden; page-break-after:always; }}
.cover:before {{ content:''; position:absolute; width:520mm; height:520mm; border:1px solid rgba(255,255,255,.08); border-radius:50%; top:-210mm; left:-160mm; }}
.cover:after {{ content:''; position:absolute; width:360mm; height:360mm; border:1px solid rgba(255,255,255,.07); border-radius:50%; bottom:-170mm; right:-100mm; }}
.cover .top {{ display:flex; align-items:center; gap:5mm; position:relative; z-index:2; }}
.cover .emblem {{ width:30mm; height:30mm; border-radius:50%; background:#f8f4e9; padding:2mm; border:1px solid rgba(200,164,92,.8); }}
.cover .brand {{ font-size:13pt; font-weight:800; }}
.cover .brand small {{ display:block; font-size:8pt; letter-spacing:.28em; color:#d9c28e; font-weight:700; margin-top:1mm; }}
.cover .rule {{ height:1px; background:linear-gradient(90deg,rgba(200,164,92,.9),rgba(200,164,92,0)); margin:14mm 0 16mm; position:relative; z-index:2; }}
.cover .eyebrow {{ color:#e7d3a4; font-size:10pt; font-weight:700; letter-spacing:.08em; }}
.cover h1 {{ font-size:36pt; line-height:1.15; margin:3mm 0 2mm; font-weight:900; letter-spacing:-.5pt; }}
.cover h2 {{ font-size:18pt; margin:0 0 3mm; font-weight:700; color:#e7d3a4; }}
.cover .slogan {{ font-size:12pt; color:rgba(255,255,255,.72); margin-top:7mm; }}
.cover .status {{ display:inline-block; margin-top:14mm; padding:3mm 7mm; border:1px solid rgba(200,164,92,.55); background:rgba(200,164,92,.14); color:#f8e7bd; border-radius:3mm; font-size:11pt; font-weight:800; position:relative; z-index:2; }}
.cover .meta {{ position:absolute; bottom:22mm; right:22mm; left:22mm; display:flex; justify-content:space-between; gap:8mm; color:rgba(255,255,255,.68); font-size:9pt; border-top:1px solid rgba(255,255,255,.14); padding-top:5mm; z-index:2; }}
.cover .meta strong {{ color:#fff; display:block; font-size:10pt; margin-bottom:1mm; }}
.content {{ padding:19mm 18mm 16mm; }}
.content h1 {{ display:none; }}
h2 {{ font-size:17pt; color:#064b30; font-weight:900; margin:9mm 0 4mm; padding-bottom:2.5mm; border-bottom:2px solid #c8a45c; break-after:avoid; }}
.content > h2:first-of-type {{ margin-top:0; }}

h3 {{ font-size:12.5pt; color:#075c3b; font-weight:800; margin:6mm 0 2mm; break-after:avoid; }}
h4 {{ font-size:11pt; color:#17231d; font-weight:800; margin:4mm 0 1.5mm; }}
p {{ margin:0 0 3mm; }}
strong {{ font-weight:800; color:#083e29; }}
a {{ color:#006830; text-decoration:none; border-bottom:1px solid rgba(0,104,48,.25); }}
ul, ol {{ margin:0 0 3mm; padding-right:5mm; }}
li {{ margin-bottom:1.2mm; }}
table {{ width:100%; border-collapse:collapse; margin:3mm 0 5mm; font-size:9.3pt; break-inside:avoid; }}
thead {{ background:#eef4ef; }}
th {{ text-align:right; color:#064b30; font-weight:800; padding:2.2mm 2.5mm; border-bottom:1px solid #cfdcd2; }}
td {{ padding:2.2mm 2.5mm; border-bottom:1px solid #e5ece6; vertical-align:top; }}
tbody tr:nth-child(even) {{ background:#fafbf8; }}
blockquote {{ margin:3mm 0 5mm; padding:4mm 5mm; background:#f5f1e7; border-right:4px solid #c8a45c; border-radius:2mm; color:#3b4a40; }}
blockquote p {{ margin:0; }}
code {{ font-family:ui-monospace, monospace; background:#f1f4ef; padding:.4mm 1.2mm; border-radius:1mm; font-size:8.5pt; direction:ltr; unicode-bidi:embed; }}
pre {{ direction:ltr; text-align:left; background:#07130d; color:#eaf3ec; padding:4mm; border-radius:2mm; overflow:hidden; font-size:8.3pt; line-height:1.55; break-inside:avoid; }}
pre code {{ background:none; color:inherit; padding:0; }}
input[type=checkbox] {{ accent-color:#006830; }}
.appendix {{ break-before:page; }}
.appendix h2 {{ break-before:auto; }}
.eyebrow {{ color:#a47b2f; font-size:9pt; font-weight:800; letter-spacing:.12em; text-transform:uppercase; margin-bottom:2mm; }}
.lead {{ color:#5d6b62; font-size:10pt; }}
.gallery {{ display:grid; grid-template-columns:1fr 1fr; gap:5mm; margin-top:5mm; }}
figure {{ margin:0; break-inside:avoid; }}
figure img {{ width:100%; height:82mm; object-fit:cover; object-position:top; border:1px solid #dbe4dc; border-radius:2mm; }}
figcaption {{ font-size:8.5pt; color:#5d6b62; margin-top:1.5mm; text-align:center; }}
figure.wide {{ margin-top:5mm; }}
figure.wide img {{ height:95mm; object-fit:cover; object-position:top; }}
.note {{ font-size:8.5pt; color:#6a766d; margin-top:4mm; }}
@media print {{ .cover {{ break-after:page; }} }}
"""

html = f"""<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>تقرير جاهزية الإطلاق التجريبي — ksa.doctor</title><style>{css}</style></head>
<body>
  <section class="cover">
    <div class="top"><img class="emblem" src="data:image/png;base64,{emblem}" alt="" /><div class="brand">أطباء المملكة العربية السعودية<small>KSA.DOCTOR</small></div></div>
    <div class="rule"></div>
    <div class="eyebrow">تقرير تنفيذي · الإصدار 1.0</div>
    <h1>جاهزية الإطلاق التجريبي</h1>
    <h2>منصة أطباء المملكة العربية السعودية</h2>
    <div class="slogan">رأس مال بشري سعودي نفخر به</div>
    <div class="status">GO مشروط · جاهز للتجربة البشرية المحدودة</div>
    <div class="meta">
      <div><strong>أُعدّ لـ</strong>إسماعيل التميمي — الرئيس التنفيذي</div>
      <div><strong>التاريخ</strong>15 نوفمبر 2026</div>
      <div><strong>البيئة</strong>الإنتاج المباشر — ksa.doctor</div>
    </div>
  </section>
  <main class="content">{body_html}</main>
</body></html>
"""
HTML_PATH.write_text(html, encoding="utf-8")
print(HTML_PATH)
