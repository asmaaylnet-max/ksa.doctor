import QRCode from 'qrcode';
import type { UserPublic } from '../../shared/types';
import { CITY_MAP } from '../../shared/data';

function loadEmblem(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = '/brand/emblem.png';
  });
}

export async function qrDataUrl(text: string, width = 512): Promise<string> {
  return QRCode.toDataURL(text, {
    width,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#06341d', light: '#ffffff' }
  });
}

async function drawLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const emblem = await loadEmblem();
  const pad = size * 0.18;
  ctx.save();
  ctx.fillStyle = '#fffdf7';
  ctx.beginPath();
  ctx.roundRect(cx - size / 2 - pad, cy - size / 2 - pad, size + pad * 2, size + pad * 2, size * 0.16);
  ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,.12)';
  ctx.shadowBlur = size * 0.08;
  ctx.drawImage(emblem, cx - size / 2, cy - size / 2, size, size);
  ctx.restore();
}

export async function makeQrCanvas(text: string, size = 1024): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#06341d', light: '#ffffff' }
  });
  const ctx = canvas.getContext('2d');
  if (ctx) await drawLogo(ctx, size / 2, size / 2, size * 0.17);
  return canvas;
}

export async function makeBrandedQr(
  text: string,
  title: string,
  subtitle: string,
  lang: 'ar' | 'en' = 'ar'
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const W = 1080;
  const H = 1320;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, '#022c1c');
  gradient.addColorStop(0.55, '#064b30');
  gradient.addColorStop(1, '#022c1c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(200,164,92,.13)';
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += 52) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.fillStyle = '#f8f4e9';
  ctx.textAlign = 'center';
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
  ctx.font = `800 ${lang === 'ar' ? 48 : 44}px Tajawal, sans-serif`;
  ctx.fillText(title, W / 2, 132);
  ctx.fillStyle = '#d9c28e';
  ctx.font = '500 26px Tajawal, sans-serif';
  ctx.fillText(subtitle, W / 2, 184);

  const qrSize = 780;
  const x = (W - qrSize) / 2;
  const y = 246;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - 26, y - 26, qrSize + 52, qrSize + 52, 38);
  ctx.fill();
  const qrCanvas = await makeQrCanvas(text, qrSize);
  ctx.drawImage(qrCanvas, x, y, qrSize, qrSize);

  ctx.fillStyle = '#f8f4e9';
  ctx.font = '800 30px Tajawal, sans-serif';
  ctx.fillText('KSA.DOCTOR', W / 2, 1148);
  ctx.fillStyle = 'rgba(248,244,233,.62)';
  ctx.font = '500 22px Tajawal, sans-serif';
  ctx.fillText(lang === 'ar' ? 'رأس مال بشري سعودي نفخر به' : 'Saudi human capital we are proud of', W / 2, 1192);
  ctx.fillStyle = '#c8a45c';
  ctx.fillRect(0, H - 8, W, 8);
  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 'image/png');
}

export async function downloadQrSvg(text: string, filename: string) {
  const svg = await QRCode.toString(text, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#06341d', light: '#ffffff' }
  });
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function makeShareCard(profile: UserPublic, lang: 'ar' | 'en', siteUrl: string): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#022c1c');
  grad.addColorStop(0.5, '#064b30');
  grad.addColorStop(1, '#022c1c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(200,164,92,.12)';
  for (let i = -H; i < W; i += 54) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }

  const emblem = await loadEmblem();
  const disc = 250;
  const dx = W / 2 - disc / 2;
  const dy = 110;
  ctx.fillStyle = '#f8f4e9';
  ctx.beginPath();
  ctx.arc(W / 2, dy + disc / 2, disc / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#c8a45c';
  ctx.stroke();
  ctx.drawImage(emblem, W / 2 - disc * 0.3, dy + disc * 0.2, disc * 0.6, disc * 0.6);

  const name = (lang === 'ar' ? profile.fullNameAr : profile.fullNameEn) || profile.fullNameAr || profile.handle;
  const specialty = (lang === 'ar' ? profile.specialtyAr : profile.specialtyEn) || profile.specialtyAr;
  const city = CITY_MAP[profile.city] ? (lang === 'ar' ? CITY_MAP[profile.city].ar : CITY_MAP[profile.city].en) : '';
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8f4e9';
  ctx.font = '800 62px Tajawal, sans-serif';
  wrapText(ctx, name, W / 2, 470, W - 140, 74);
  ctx.fillStyle = '#d9c28e';
  ctx.font = '500 34px Tajawal, sans-serif';
  ctx.fillText(`${specialty}${city ? ` · ${city}` : ''}`, W / 2, 600);

  const qrSize = 420;
  const qx = W / 2 - qrSize / 2;
  const qy = 690;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(qx - 20, qy - 20, qrSize + 40, qrSize + 40, 28);
  ctx.fill();
  const qr = await makeQrCanvas(siteUrl, qrSize);
  ctx.drawImage(qr, qx, qy, qrSize, qrSize);

  ctx.fillStyle = '#f8f4e9';
  ctx.font = '800 32px Tajawal, sans-serif';
  ctx.fillText(`ksa.doctor/${profile.handle}`, W / 2, 1190);
  ctx.fillStyle = 'rgba(248,244,233,.6)';
  ctx.font = '500 22px Tajawal, sans-serif';
  ctx.fillText(lang === 'ar' ? 'أطباء المملكة العربية السعودية' : 'Doctors of Saudi Arabia', W / 2, 1236);
  ctx.fillStyle = '#c8a45c';
  ctx.fillRect(0, H - 10, W, 10);
  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}
