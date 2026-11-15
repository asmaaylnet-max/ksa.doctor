#!/usr/bin/env node
/**
 * Decrypt a KSA Doctors encrypted D1 backup.
 *
 * Usage:
 *   node scripts/restore-backup.mjs <backup.enc> <backup.sql>
 *
 * The backup key is read from BACKUP_ENCRYPTION_KEY or .secrets/backup.env.
 * This script only decrypts and decompresses; it never writes to D1.
 * Review the SQL and take a fresh backup before restoring it manually.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error('Usage: node scripts/restore-backup.mjs <backup.enc> <backup.sql>');
  process.exit(2);
}
const keyB64 = process.env.BACKUP_ENCRYPTION_KEY || fs.readFileSync(path.resolve('.secrets/backup.env'), 'utf8').trim();
const key = Buffer.from(keyB64, 'base64');
if (key.length !== 32) throw new Error('Backup key must be 32 bytes after base64 decoding');

const payload = fs.readFileSync(input);
if (payload.subarray(0, 4).toString() !== 'KSA1') throw new Error('Unsupported backup format');
const iv = payload.subarray(4, 16);
const cipher = payload.subarray(16);
if (cipher.length <= 16) throw new Error('Backup payload is truncated');
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(cipher.subarray(cipher.length - 16));
const gzip = Buffer.concat([decipher.update(cipher.subarray(0, cipher.length - 16)), decipher.final()]);
const sql = zlib.gunzipSync(gzip);
if (!sql.includes('CREATE TABLE')) throw new Error('Decrypted backup does not look like a D1 SQL export');
fs.writeFileSync(output, sql, { mode: 0o600 });
console.log(JSON.stringify({ ok: true, inputBytes: payload.length, sqlBytes: sql.length, output }));
