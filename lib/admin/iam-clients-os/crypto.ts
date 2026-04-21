/**
 * AES-256-GCM encryption for sensitive client data (Super Admin tokens, SSH credentials).
 *
 * Key source priority:
 *  1. process.env.IAM_CLIENTS_ENCRYPTION_KEY (32 bytes hex = 64 chars)
 *  2. Derived from process.env.SECRET (HKDF-SHA256, 32 bytes)
 *
 * If neither exists, encryption falls back to plaintext-with-marker (NOT secure)
 * and logs a warning. This lets dev work proceed without setup, but production
 * MUST set a key. Set with: openssl rand -hex 32
 *
 * Output format: "enc:v1:{iv-base64}:{ciphertext-base64}:{authtag-base64}"
 * Plaintext-fallback format: "plain:{value}" (clearly marked, not silently silent).
 */

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;

let cachedKey: Buffer | null = null;
let warned = false;

function getKey(): Buffer | null {
  if (cachedKey) return cachedKey;

  const explicit = process.env.IAM_CLIENTS_ENCRYPTION_KEY;
  if (explicit && /^[0-9a-fA-F]{64}$/.test(explicit)) {
    cachedKey = Buffer.from(explicit, 'hex');
    return cachedKey;
  }

  const secret = process.env.SECRET;
  if (secret && secret.length >= 16) {
    // Derive a stable 32-byte key from SECRET via HKDF
    cachedKey = Buffer.from(
      crypto.hkdfSync('sha256', Buffer.from(secret, 'utf8'), Buffer.alloc(0), Buffer.from('iam-clients-os/v1', 'utf8'), KEY_LEN)
    );
    return cachedKey;
  }

  if (!warned) {
    warned = true;
    console.warn('[iam-clients-os/crypto] No encryption key — sensitive fields will be stored as plaintext. Set IAM_CLIENTS_ENCRYPTION_KEY (64 hex chars) or SECRET (>=16 chars).');
  }
  return null;
}

export function encryptString(plaintext: string): string {
  if (!plaintext) return '';
  const key = getKey();
  if (!key) return `plain:${plaintext}`;

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${ct.toString('base64')}:${tag.toString('base64')}`;
}

export function decryptString(stored: string): string {
  if (!stored) return '';
  if (stored.startsWith('plain:')) return stored.slice('plain:'.length);
  if (!stored.startsWith('enc:v1:')) return stored; // legacy/unknown — return as-is

  const parts = stored.split(':');
  if (parts.length !== 5) return '';
  const [, , ivB64, ctB64, tagB64] = parts;

  const key = getKey();
  if (!key) return ''; // can't decrypt without key

  try {
    const iv = Buffer.from(ivB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    return '';
  }
}

/**
 * Mask a sensitive value for safe display in lists.
 * "ghp_abcdefghij1234567890" → "ghp_…7890"
 * Empty string → "" (so UI can show "Not set" placeholder).
 */
export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '•'.repeat(value.length);
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
