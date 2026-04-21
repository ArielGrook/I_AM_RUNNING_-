/**
 * GET    /api/admin/iam-clients-os/clients         → list all
 * POST   /api/admin/iam-clients-os/clients         → create new
 *
 * Stores the registry as JSON at `iam-clients-os/data/clients.json`
 * (git-ignored). Sensitive fields (superAdminToken, sshPassword, sshKey)
 * are encrypted at rest via lib/admin/iam-clients-os/crypto.ts.
 *
 * On read, sensitive fields are NEVER returned in plaintext from the list
 * endpoint — only masked previews. Use GET /[id]?reveal=field for explicit
 * decrypt requests (logged).
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { encryptString, maskSecret } from '@/lib/admin/iam-clients-os/crypto';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DATA_DIR = path.join(PROJECT_ROOT, 'iam-clients-os', 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

// ── Schema ─────────────────────────────────────────────────────────────────

export type ClientStatus = 'lead' | 'paid' | 'installing' | 'installed' | 'failed' | 'churned';
export type ClientKind = 'real' | 'test';
export type ContactType = 'email' | 'telegram' | 'whatsapp' | 'phone' | 'other';

export interface ClientContact {
  type: ContactType;
  value: string;
}

export interface ClientPayment {
  amount: number;        // in major units (USD/EUR/ILS as set by currency)
  currency: string;      // ISO code, e.g. "USD"
  date: string;          // ISO date YYYY-MM-DD
  note?: string;
}

export interface ClientRecord {
  id: string;
  name: string;                       // human label
  domain: string;                     // e.g. "iam-test.lego-base.online"
  kind: ClientKind;                   // real | test
  status: ClientStatus;
  mode: 'team' | 'solo';
  port: number;
  installPath: string;
  productVersion: string;             // version installed
  installDate?: string;               // ISO date YYYY-MM-DD
  serverIp?: string;
  sshUser?: string;
  sshPort?: number;
  sshPassword?: string;               // encrypted at rest
  sshKey?: string;                    // encrypted at rest (private key text)
  superAdminToken?: string;           // encrypted at rest
  contacts: ClientContact[];
  payments: ClientPayment[];
  notes: string;                      // free-form
  tags: string[];
  createdAt: string;                  // ISO datetime
  updatedAt: string;                  // ISO datetime
}

interface RegistryFile {
  version: 1;
  clients: ClientRecord[];
}

const ENCRYPTED_FIELDS: (keyof ClientRecord)[] = ['sshPassword', 'sshKey', 'superAdminToken'];

// ── Storage ────────────────────────────────────────────────────────────────

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

// ── Sanitization ───────────────────────────────────────────────────────────

const VALID_STATUSES: ClientStatus[] = ['lead', 'paid', 'installing', 'installed', 'failed', 'churned'];
const VALID_KINDS: ClientKind[] = ['real', 'test'];
const VALID_CONTACT_TYPES: ContactType[] = ['email', 'telegram', 'whatsapp', 'phone', 'other'];

function sanitizeContacts(input: unknown): ClientContact[] {
  if (!Array.isArray(input)) return [];
  const out: ClientContact[] = [];
  for (const c of input) {
    if (!c || typeof c !== 'object') continue;
    const ctc = c as Record<string, unknown>;
    const type = ctc.type;
    const value = ctc.value;
    if (typeof value !== 'string' || !value.trim()) continue;
    if (typeof type !== 'string' || !VALID_CONTACT_TYPES.includes(type as ContactType)) continue;
    out.push({ type: type as ContactType, value: value.trim() });
  }
  return out;
}

function sanitizePayments(input: unknown): ClientPayment[] {
  if (!Array.isArray(input)) return [];
  const out: ClientPayment[] = [];
  for (const p of input) {
    if (!p || typeof p !== 'object') continue;
    const pp = p as Record<string, unknown>;
    const amount = typeof pp.amount === 'number' ? pp.amount : Number(pp.amount);
    if (!Number.isFinite(amount) || amount < 0) continue;
    const currency = typeof pp.currency === 'string' && pp.currency.trim() ? pp.currency.trim().toUpperCase() : 'USD';
    const date = typeof pp.date === 'string' ? pp.date : new Date().toISOString().slice(0, 10);
    const note = typeof pp.note === 'string' ? pp.note : undefined;
    out.push({ amount, currency, date, note });
  }
  return out;
}

function sanitizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(t => typeof t === 'string')
    .map(t => (t as string).trim())
    .filter(Boolean)
    .slice(0, 20);
}

// Coerce + validate a payload into a partial client record.
// Encryption happens here for sensitive fields.
function sanitizePayload(input: unknown): Partial<ClientRecord> {
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
    const p = parseInt(i.port, 10);
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

  out.contacts = sanitizeContacts(i.contacts);
  out.payments = sanitizePayments(i.payments);
  out.tags = sanitizeTags(i.tags);
  if (typeof i.notes === 'string') out.notes = i.notes;

  return out;
}

// Build the safe public view of a client (encrypted fields → masked previews,
// arrays guaranteed present, never returns plaintext secrets).
export function publicView(c: ClientRecord) {
  const masked: Record<string, { hasValue: boolean; preview: string }> = {};
  for (const f of ENCRYPTED_FIELDS) {
    const raw = (c[f] as string | undefined) || '';
    masked[f] = { hasValue: !!raw, preview: raw ? maskSecret(raw) : '' };
  }
  return {
    id: c.id,
    name: c.name,
    domain: c.domain,
    kind: c.kind,
    status: c.status,
    mode: c.mode,
    port: c.port,
    installPath: c.installPath,
    productVersion: c.productVersion,
    installDate: c.installDate,
    serverIp: c.serverIp,
    sshUser: c.sshUser,
    sshPort: c.sshPort,
    sshPassword: masked.sshPassword,
    sshKey: masked.sshKey,
    superAdminToken: masked.superAdminToken,
    contacts: c.contacts || [],
    payments: c.payments || [],
    notes: c.notes || '',
    tags: c.tags || [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// ── Handlers ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const reg = readRegistry();
    return NextResponse.json({
      clients: reg.clients.map(publicView),
      count: reg.clients.length,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    const patch = sanitizePayload(body);

    if (!patch.name || !patch.domain) {
      return NextResponse.json({ error: 'name and domain are required' }, { status: 400 });
    }

    const reg = readRegistry();

    // Reject duplicate domains (case-insensitive — we lowercased on sanitize)
    if (reg.clients.some(c => c.domain === patch.domain)) {
      return NextResponse.json({ error: `A client with domain "${patch.domain}" already exists` }, { status: 409 });
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

    return NextResponse.json({ client: publicView(created), created: true }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
