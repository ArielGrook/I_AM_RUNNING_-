/**
 * GET    /api/admin/iam-clients-os/clients/[id]              → public view
 * GET    /api/admin/iam-clients-os/clients/[id]?reveal=field → decrypt one sensitive field
 * PATCH  /api/admin/iam-clients-os/clients/[id]              → update
 * DELETE /api/admin/iam-clients-os/clients/[id]              → delete
 *
 * Reveal endpoint logs the access (operator audit) and only decrypts the
 * one requested field, never bulk-dumps secrets.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/checkAdminAuth';
import { encryptString, decryptString } from '@/lib/admin/iam-clients-os/crypto';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/var/www/i_am_running';
const DATA_DIR = path.join(PROJECT_ROOT, 'iam-clients-os', 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const AUDIT_LOG = path.join(DATA_DIR, 'clients-audit.log');

type ClientStatus = 'lead' | 'paid' | 'installing' | 'installed' | 'failed' | 'churned';
type ClientKind = 'real' | 'test';
type ContactType = 'email' | 'telegram' | 'whatsapp' | 'phone' | 'other';

interface ClientContact { type: ContactType; value: string }
interface ClientPayment { amount: number; currency: string; date: string; note?: string }

interface ClientRecord {
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
  sshPassword?: string;
  sshKey?: string;
  superAdminToken?: string;
  contacts: ClientContact[];
  payments: ClientPayment[];
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RegistryFile { version: 1; clients: ClientRecord[] }

const VALID_STATUSES: ClientStatus[] = ['lead', 'paid', 'installing', 'installed', 'failed', 'churned'];
const VALID_KINDS: ClientKind[] = ['real', 'test'];
const VALID_CONTACT_TYPES: ContactType[] = ['email', 'telegram', 'whatsapp', 'phone', 'other'];
const REVEALABLE_FIELDS = new Set(['sshPassword', 'sshKey', 'superAdminToken']);
const ENCRYPTED_FIELDS: (keyof ClientRecord)[] = ['sshPassword', 'sshKey', 'superAdminToken'];

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

function audit(line: string): void {
  try {
    ensureDataDir();
    fs.appendFileSync(AUDIT_LOG, `[${new Date().toISOString()}] ${line}\n`, 'utf-8');
  } catch {
    // best effort
  }
}

function maskSecretInline(v: string): string {
  if (!v) return '';
  if (v.length <= 8) return '•'.repeat(v.length);
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

function publicView(c: ClientRecord) {
  const masked: Record<string, { hasValue: boolean; preview: string }> = {};
  for (const f of ENCRYPTED_FIELDS) {
    const raw = (c[f] as string | undefined) || '';
    masked[f] = { hasValue: !!raw, preview: raw ? maskSecretInline(raw) : '' };
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

  if (typeof i.sshPassword === 'string') out.sshPassword = i.sshPassword ? encryptString(i.sshPassword) : '';
  if (typeof i.sshKey === 'string') out.sshKey = i.sshKey ? encryptString(i.sshKey) : '';
  if (typeof i.superAdminToken === 'string') out.superAdminToken = i.superAdminToken ? encryptString(i.superAdminToken) : '';

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

// ── Handlers ───────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const reg = readRegistry();
    const client = reg.clients.find(c => c.id === id);
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const reveal = new URL(request.url).searchParams.get('reveal');
    if (reveal) {
      if (!REVEALABLE_FIELDS.has(reveal)) {
        return NextResponse.json({ error: `Field "${reveal}" cannot be revealed` }, { status: 400 });
      }
      const encrypted = (client[reveal as keyof ClientRecord] as string | undefined) || '';
      audit(`REVEAL client=${id} domain=${client.domain} field=${reveal} hasValue=${!!encrypted}`);
      return NextResponse.json({
        id: client.id,
        field: reveal,
        plaintext: encrypted ? decryptString(encrypted) : '',
      });
    }

    return NextResponse.json({ client: publicView(client) });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const patch = sanitizePayload(body);

    const reg = readRegistry();
    const idx = reg.clients.findIndex(c => c.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Domain-conflict check (only if domain is changing)
    if (patch.domain && patch.domain !== reg.clients[idx].domain) {
      if (reg.clients.some(c => c.id !== id && c.domain === patch.domain)) {
        return NextResponse.json({ error: `Domain "${patch.domain}" already used by another client` }, { status: 409 });
      }
    }

    reg.clients[idx] = {
      ...reg.clients[idx],
      ...patch,
      id: reg.clients[idx].id,           // never overwrite id
      createdAt: reg.clients[idx].createdAt, // never overwrite createdAt
      updatedAt: new Date().toISOString(),
    };

    writeRegistry(reg);
    audit(`UPDATE client=${id} domain=${reg.clients[idx].domain} fields=${Object.keys(patch).join(',')}`);
    return NextResponse.json({ client: publicView(reg.clients[idx]), updated: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const reg = readRegistry();
    const idx = reg.clients.findIndex(c => c.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const removed = reg.clients[idx];
    reg.clients.splice(idx, 1);
    writeRegistry(reg);
    audit(`DELETE client=${id} domain=${removed.domain}`);
    return NextResponse.json({ deleted: true, id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
