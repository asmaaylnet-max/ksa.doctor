/**
 * Zero-knowledge-ish password hardening for Cloudflare Workers Free CPU limits.
 * The browser performs PBKDF2-SHA256 (310k iterations) over the password with a
 * domain-separated, email-bound salt. The server only receives the derived proof
 * and stores a peppered SHA-256 digest. A database leak therefore does not expose
 * passwords, and offline cracking still requires 310k PBKDF2 iterations per guess.
 */
export const AUTH_KDF_ITERATIONS = 310_000;
export const AUTH_KDF_VERSION = 1;

const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function authSalt(email: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(enc.encode(`ksa.doctor|auth|v${AUTH_KDF_VERSION}|${email.trim().toLowerCase()}`));
}

export async function deriveProof(password: string, email: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: authSalt(email), iterations: AUTH_KDF_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return toBase64Url(new Uint8Array(bits));
}

export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return bytesToHex(new Uint8Array(digest));
}

export async function hashProof(proof: string, pepper: string): Promise<string> {
  return `v1$${await sha256Hex(`${proof}:${pepper}`)}`;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyProof(proof: string, stored: string, pepper: string): Promise<boolean> {
  const computed = await hashProof(proof, pepper);
  return timingSafeEqual(computed, stored);
}

export function randomToken(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64Url(buf);
}

export async function hashToken(token: string): Promise<string> {
  return sha256Hex(`ksa.doctor|token|${token}`);
}
