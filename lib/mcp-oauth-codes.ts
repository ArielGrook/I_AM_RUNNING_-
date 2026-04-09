import { appendFileSync } from 'fs';

function debugLog(msg: string) {
  try { appendFileSync('/var/www/i_am_running/logs/oauth-debug.log', `[${new Date().toISOString()}] ${msg}\n`); } catch {}
}

export interface StoredAuthCode {
  createdAt: number;
  codeChallenge: string | null;
}
const store = new Map<string, StoredAuthCode>();
const TTL_MS = 5 * 60 * 1000;

function sweep(): void {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now - v.createdAt > TTL_MS) store.delete(k);
  }
}

export function saveAuthCode(code: string, codeChallenge: string | null): void {
  sweep();
  store.set(code, { createdAt: Date.now(), codeChallenge });
  debugLog(`SAVE code=${code.slice(0,8)}... store_size=${store.size}`);
}

export function consumeAuthCode(code: string): StoredAuthCode | null {
  sweep();
  const rec = store.get(code);
  debugLog(`CONSUME code=${code.slice(0,8)}... found=${!!rec} store_size=${store.size} keys=[${[...store.keys()].map(k=>k.slice(0,8)).join(',')}]`);
  if (!rec) return null;
  store.delete(code);
  return rec;
}
