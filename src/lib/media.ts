import type { UserPrivate } from '../../shared/types';
import { ApiError } from './api';

export type MediaKind = 'avatar' | 'cover' | 'skill' | 'work';

export function mediaUrl(key: string | null | undefined): string {
  return key ? `/media/${key}` : '';
}

export function avatarUrl(key: string | null | undefined): string {
  return key ? `/media/${key}` : '/brand/default-avatar.png';
}

export function coverUrl(key: string | null | undefined): string {
  return key ? `/media/${key}` : '/brand/default-cover.webp';
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_decode'));
    };
    img.src = url;
  });
}

function drawResized(img: HTMLImageElement, targetW: number, targetH: number, crop: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (crop) {
    const srcRatio = img.width / img.height;
    const targetRatio = targetW / targetH;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    if (srcRatio > targetRatio) {
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
  } else {
    const ratio = Math.min(targetW / img.width, targetH / img.height, 1);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, (targetW - w) / 2, (targetH - h) / 2, w, h);
  }
  return canvas;
}

export async function compressImage(file: File, kind: MediaKind): Promise<File> {
  if (file.size > 20 * 1024 * 1024) throw new ApiError(413, 'file_too_large', 'Image is too large');
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new ApiError(415, 'unsupported_type', 'Unsupported image');
  const img = await loadImage(file);
  let canvas: HTMLCanvasElement;
  if (kind === 'avatar') canvas = drawResized(img, 800, 800, true);
  else if (kind === 'cover') canvas = drawResized(img, 2000, 750, true);
  else {
    const ratio = Math.min(1600 / img.width, 1600 / img.height, 1);
    canvas = drawResized(img, Math.max(1, Math.round(img.width * ratio)), Math.max(1, Math.round(img.height * ratio)), false);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
  const finalBlob = blob || (await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9)));
  if (!finalBlob) throw new Error('compression_failed');
  if (finalBlob.size > 8 * 1024 * 1024) throw new ApiError(413, 'file_too_large', 'Image is too large');
  return new File([finalBlob], `upload.${finalBlob.type === 'image/png' ? 'png' : 'webp'}`, { type: finalBlob.type });
}

export interface UploadResult {
  user: UserPrivate;
  key: string;
}

export async function uploadMedia(
  file: File,
  kind: MediaKind,
  index?: number,
  captionAr = '',
  captionEn = '',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const compressed = await compressImage(file, kind);
  const form = new FormData();
  form.append('file', compressed);
  form.append('kind', kind);
  if (typeof index === 'number') form.append('index', String(index));
  if (captionAr) form.append('captionAr', captionAr);
  if (captionEn) form.append('captionEn', captionEn);
  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/me/media');
    xhr.withCredentials = true;
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as { user?: UserPrivate; key?: string; error?: { code?: string; message?: string } } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.user && body.key) {
        resolve({ user: body.user, key: body.key });
      } else {
        reject(new ApiError(xhr.status, body?.error?.code || 'generic', body?.error?.message || 'Upload failed'));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'network', 'Network error'));
    xhr.send(form);
  });
}

export async function deleteMedia(kind: MediaKind, key: string): Promise<UserPrivate> {
  const res = await fetch('/api/me/media/delete', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, key })
  });
  const body = (await res.json().catch(() => null)) as { user?: UserPrivate; error?: { code?: string; message?: string } } | null;
  if (!res.ok || !body?.user) throw new ApiError(res.status, body?.error?.code || 'generic', body?.error?.message || 'Delete failed');
  return body.user;
}
