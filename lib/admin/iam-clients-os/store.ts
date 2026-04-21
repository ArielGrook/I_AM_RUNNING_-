/**
 * Shared storage layer for IAM Client OS client registry.
 *
 * Used by both the HTTP API (app/api/admin/iam-clients-os/clients/*) and
 * the MCP tools (lib/mcp-server/index.ts). Same logic, single source of
 * truth, no HTTP loop-back.
 *
 * Storage: iam-clients-os/data/clients.json (gitignored)
 * Audit:   iam-clients-os/data/clients-audit.log
 *
 * Sensitive fields (sshPassword, sshKey, superAdminToken) are encrypted
 * at rest via lib/admin/iam-clients-os/crypto.ts. Never returned in
 * plaintext from listClients() or publicView() — only via revealField().
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { encryptString, decryptString, maskSecret } from './crypto';

// ── Paths ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DATA_DIR = path.join(PROJECT_ROOT, 'iam-clients-os', 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const AUDIT_LOG = path.join(DATA_DIR, 'clients-audit.log');

// ── Types ──────────────────────────────────────────────────────────────────

export type ClientStatus = 'lead' | 'paid' | 'installing' | 'installed' | 'failed' | 'churned';
export type ClientKind = 'real' | 'test';
export type ContactType = 'email' | 'telegram' | 'whatsapp' | 'phone' | 'other';

export interface ClientContact { type: ContactType; value: string }
export interface ClientPayment { amount: number; currency: string; date: string; note?: string }

export interface ClientRecord {
  id: string;
  name: string;
  domain: string;
  kind: ClientKind;
  status: ClientStatus;
  mode: 'team' | 'solo';
  port: number;
  installPath: string;
  productVersion: string;
  installDate?: string;
  serverIp?: string;
  sshUser?: string;
  sshPort?: number;
  sshPassword?: string;          // encrypted at rest
  sshKey?: string;               // encrypted at rest
  superAdminToken?: string;      // encrypted at rest
  contacts: ClientContact[];
  payments: ClientPayment[];
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RegistryFile { version: 1; clients: ClientRecord[] }

export interface MaskedSecret { hasValue: boolean; preview: string }

export interface ClientPublic {
  id: string;
  name: string;
  domain: string;
  kind: ClientKind;
  status: ClientStatus;
  mode: 'team' | 'solo';
  port: number;
  installPath: string;
  productVersion: string;
  installDate?: string;
  serverIp?: string;
  sshUser?: string;
  sshPort?: number;
  sshPassword: MaskedSecret;
  sshKey: MaskedSecret;
  superAdminToken: MaskedSecret;
  contacts: ClientContact[];
  payments: ClientPayment[];
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const VALID_STATUSES: ClientStatus[] = ['lead', 'paid', 'installing', 'installed', 'failed', 'churned'];
export const VALID_KINDS: ClientKind[] = ['real', 'test'];
export const VALID_CONTACT_TYPES: ContactType[] = ['email', 'telegram', 'whatsapp', 'phone', 'other'];
export const REVEALABLE_FIELDS = new Set(['sshPassword', 'sshKey', 'superAdminToken']);
export const ENCRYPTED_FIELDS: (keyof ClientRecord)[] = ['sshPassword', 'sshKey', 'superAdminToken'];

// ── File I/O ───────────────────────────────────────────────────────────────

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readRegistry(): RegistryFile {
  try {
    if (!fs.existsSync(CLIENTS_FILE)) return { version: 1, clients: [] };
    const raw = fs.readFileSync(CLIENTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.clients)) {
      return { version: 1, clients: [] };
    }
    return { version: 1, clients: parsed.clients };
  } catch {
    return { version: 1, clients: [] };
  }
}

function writeRegistry(reg: RegistryFile): void {
  ensureDataDir();
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(reg, null, 2) + '\n', 'utf-8');
}

export function audit(line: string, source: string = 'http'): void {
  try {
    ensureDataDir();
    fs.appendFileSync(AUDIT_LOG, `[${new Date().toISOString()}] [${source}] ${line}\n`, 'utf-8');
  } catch {
    // best effort
  }
}

// ── Public-view conversion ─────────────────────────────────────────────────

export function publicView(c: ClientRecord): ClientPublic {
  const masked: Record<string, MaskedSecret> = {};
  for (const f of ENCRYPTED_FIELDS) {
    const raw = (c[f] as string | undefined) || '';
    masked[f] = { hasValue: !!raw, preview: raw ? maskSecret(raw) : '' };
  }
  return {
    id: c.id, name: c.name, domain: c.domain, kind: c.kind, status: c.status,
    mode: c.mode, port: c.port, installPath: c.installPath,
    productVersion: c.productVersion, installDate: c.installDate,
    serverIp: c.serverIp, sshUser: c.sshUser, sshPort: c.sshPort,
    sshPassword: masked.sshPassword, sshKey: masked.sshKey,
    superAdminToken: masked.superAdminToken,
    contacts: c.contacts || [], payments: c.payments || [],
    notes: c.notes || '', tags: c.tags || [],
    createdAt: c.createdAt, updatedAt: c.updatedAt,
  };
}

// ── Sanitization ───────────────────────────────────────────────────────────

export function sanitizePayload(input: unknown): Partial<ClientRecord> {
  if (!input || typeof input !== 'object') return {};
  const i = input as Record<string, unknown>;
  const out: Partial<ClientRecord> = {};

  if (typeof i.name === 'string') out.name = i.name.trim();
  if (typeof i.domain === 'string') out.domain = i.domain.trim().toLowerCase();
  if (typeof i.kind === 'string' && VALID_KINDS.includes(i.kind as ClientKind)) out.kind = i.kind as ClientKind;
  if (typeof i.status === 'string' && VALID_STATUSES.includes(i.status as ClientStatus)) out.status = i.status as ClientStatus;
  if (i.mode === 'team' || i.mode === 'solo') out.mode = i.mode;

  if (typeof i.port === 'number' && Number.isFinite(i.port)) {
    const p = Math.floor(i.port);
    if (p > 0 && p < 65536) out.port = p;
  } else if (typeof i.port === 'string' && i.port) {
    const p = parseInt(i.port as string, 10);
    if (Number.isFinite(p) && p > 0 && p < 65536) out.port = p;
  }

  if (typeof i.installPath === 'string') out.installPath = i.installPath.trim();
  if (typeof i.productVersion === 'string') out.productVersion = i.productVersion.trim();
  if (typeof i.installDate === 'string') out.installDate = i.installDate.trim();
  if (typeof i.serverIp === 'string') out.serverIp = i.serverIp.trim();
  if (typeof i.sshUser === 'string') out.sshUser = i.sshUser.trim();

  if (typeof i.sshPort === 'number' && Number.isFinite(i.sshPort)) {
    const p = Math.floor(i.sshPort);
    if (p > 0 && p < 65536) out.sshPort = p;
  } else if (typeof i.sshPort === 'string' && i.sshPort) {
    const p = parseInt(i.sshPort as string, 10);
    if (Number.isFinite(p) && p > 0 && p < 65536) out.sshPort = p;
  }

  // Encrypt sensitive fields. Empty string = clear out the field.
  if (typeof i.sshPassword === 'string') {
    out.sshPassword = i.sshPassword ? encryptString(i.sshPassword) : '';
  }
  if (typeof i.sshKey === 'string') {
    out.sshKey = i.sshKey ? encryptString(i.sshKey) : '';
  }
  if (typeof i.superAdminToken === 'string') {
    out.superAdminToken = i.superAdminToken ? encryptString(i.superAdminToken) : '';
  }

  if (Array.isArray(i.contacts)) {
    out.contacts = (i.contacts as unknown[])
      .filter((c): c is { type: string; value: string } =>
        !!c && typeof c === 'object' && 'value' in c && 'type' in c
        && typeof (c as Record<string, unknown>).value === 'string'
        && typeof (c as Record<string, unknown>).type === 'string'
        && VALID_CONTACT_TYPES.includes((c as Record<string, unknown>).type as ContactType)
        && !!((c as Record<string, unknown>).value as string).trim())
      .map(c => ({ type: c.type as ContactType, value: c.value.trim() }));
  }
  if (Array.isArray(i.payments)) {
    out.payments = (i.payments as unknown[])
      .map((p: unknown) => {
        if (!p || typeof p !== 'object') return null;
        const pp = p as Record<string, unknown>;
        const amount = typeof pp.amount === 'number' ? pp.amount : Number(pp.amount);
        if (!Number.isFinite(amount) || amount < 0) return null;
        return {
          amount,
          currency: typeof pp.currency === 'string' && pp.currency.trim() ? pp.currency.trim().toUpperCase() : 'USD',
          date: typeof pp.date === 'string' ? pp.date : new Date().toISOString().slice(0, 10),
          note: typeof pp.note === 'string' ? pp.note : undefined,
        };
      })
      .filter((x): x is ClientPayment => x !== null);
  }
  if (Array.isArray(i.tags)) {
    out.tags = (i.tags as unknown[])
      .filter((t): t is string => typeof t === 'string')
      .map(t => t.trim()).filter(Boolean).slice(0, 20);
  }
  if (typeof i.notes === 'string') out.notes = i.notes;

  return out;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function listClients(filters?: {
  status?: ClientStatus;
  kind?: ClientKind;
  search?: string;
}): ClientPublic[] {
  let list = readRegistry().clients;

  if (filters?.status) list = list.filter(c => c.status === filters.status);
  if (filters?.kind) list = list.filter(c => c.kind === filters.kind);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(c => {
      const hay = `${c.name} ${c.domain} ${c.serverIp || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(s);
    });
  }

  return list.map(publicView);
}

/** Find by id OR domain (in that order). */
export function findClient(idOrDomain: string): ClientRecord | null {
  const reg = readRegistry();
  return (
    reg.clients.find(c => c.id === idOrDomain) ||
    reg.clients.find(c => c.domain === idOrDomain.toLowerCase()) ||
    null
  );
}

export function getClientPublic(idOrDomain: string): ClientPublic | null {
  const c = findClient(idOrDomain);
  return c ? publicView(c) : null;
}

export interface CreateResult {
  ok: true;
  client: ClientPublic;
}
export interface ErrorResult {
  ok: false;
  error: string;
  status: number;
}

export function createClient(input: unknown, source: string = 'http'): CreateResult | ErrorResult {
  const patch = sanitizePayload(input);
  if (!patch.name || !patch.domain) {
    return { ok: false, error: 'name and domain are required', status: 400 };
  }
  const reg = readRegistry();
  if (reg.clients.some(c => c.domain === patch.domain)) {
    return { ok: false, error: `A client with domain "${patch.domain}" already exists`, status: 409 };
  }
  const now = new Date().toISOString();
  const created: ClientRecord = {
    id: crypto.randomBytes(8).toString('hex'),
    name: patch.name,
    domain: patch.domain,
    kind: (patch.kind as ClientKind) || 'real',
    status: (patch.status as ClientStatus) || 'lead',
    mode: patch.mode || 'team',
    port: patch.port ?? 4742,
    installPath: patch.installPath || '/var/www/iam',
    productVersion: patch.productVersion || '',
    installDate: patch.installDate,
    serverIp: patch.serverIp,
    sshUser: patch.sshUser,
    sshPort: patch.sshPort,
    sshPassword: patch.sshPassword,
    sshKey: patch.sshKey,
    superAdminToken: patch.superAdminToken,
    contacts: patch.contacts || [],
    payments: patch.payments || [],
    notes: patch.notes || '',
    tags: patch.tags || [],
    createdAt: now,
    updatedAt: now,
  };
  reg.clients.push(created);
  writeRegistry(reg);
  audit(`CREATE client=${created.id} domain=${created.domain} kind=${created.kind} status=${created.status}`, source);
  return { ok: true, client: publicView(created) };
}

export function updateClient(idOrDomain: string, input: unknown, source: string = 'http'): CreateResult | ErrorResult {
  const reg = readRegistry();
  const idx = reg.clients.findIndex(c => c.id === idOrDomain || c.domain === idOrDomain.toLowerCase());
  if (idx === -1) return { ok: false, error: 'Not found', status: 404 };

  const patch = sanitizePayload(input);

  if (patch.domain && patch.domain !== reg.clients[idx].domain) {
    if (reg.clients.some((c, i) => i !== idx && c.domain === patch.domain)) {
      return { ok: false, error: `Domain "${patch.domain}" already used by another client`, status: 409 };
    }
  }

  reg.clients[idx] = {
    ...reg.clients[idx],
    ...patch,
    id: reg.clients[idx].id,
    createdAt: reg.clients[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };

  writeRegistry(reg);
  audit(`UPDATE client=${reg.clients[idx].id} domain=${reg.clients[idx].domain} fields=${Object.keys(patch).join(',')}`, source);
  return { ok: true, client: publicView(reg.clients[idx]) };
}

export interface DeleteResult { ok: true; id: string; domain: string }

export function deleteClient(idOrDomain: string, source: string = 'http'): DeleteResult | ErrorResult {
  const reg = readRegistry();
  const idx = reg.clients.findIndex(c => c.id === idOrDomain || c.domain === idOrDomain.toLowerCase());
  if (idx === -1) return { ok: false, error: 'Not found', status: 404 };

  const removed = reg.clients[idx];
  reg.clients.splice(idx, 1);
  writeRegistry(reg);
  audit(`DELETE client=${removed.id} domain=${removed.domain}`, source);
  return { ok: true, id: removed.id, domain: removed.domain };
}

export interface RevealResult {
  ok: true;
  id: string;
  domain: string;
  field: string;
  plaintext: string;
}

export function revealField(idOrDomain: string, field: string, source: string = 'http'): RevealResult | ErrorResult {
  if (!REVEALABLE_FIELDS.has(field)) {
    return { ok: false, error: `Field "${field}" cannot be revealed. Allowed: ${[...REVEALABLE_FIELDS].join(', ')}`, status: 400 };
  }
  const c = findClient(idOrDomain);
  if (!c) return { ok: false, error: 'Not found', status: 404 };

  const encrypted = (c[field as keyof ClientRecord] as string | undefined) || '';
  audit(`REVEAL client=${c.id} domain=${c.domain} field=${field} hasValue=${!!encrypted}`, source);
  return {
    ok: true,
    id: c.id,
    domain: c.domain,
    field,
    plaintext: encrypted ? decryptString(encrypted) : '',
  };
}
