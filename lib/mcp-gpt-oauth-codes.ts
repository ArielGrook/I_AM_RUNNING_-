/**
 * In-memory OAuth codes for ChatGPT-safe MCP endpoint.
 * Separate store from main MCP to avoid token cross-contamination.
 */
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
}

export function consumeAuthCode(code: string): StoredAuthCode | null {
  sweep();
  const rec = store.get(code);
  if (!rec) return null;
  store.delete(code);
  return rec;
}
