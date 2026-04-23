'use client';

/**
 * Client Projects tab — IAM Client OS installation management.
 *
 * UI architecture (v2, operator-integrated, 23.04.2026):
 *  - Stacked cards, one per client. Collapsed row shows status dot, name,
 *    domain, version, last seen, kind tag.
 *  - Click a card → expands inline (accordion). Other cards stay in list.
 *  - Expanded card has a badge grid. Each badge represents a category:
 *      Server | Status | Access | Files | Billing | Notes | Danger
 *    Tap a badge → expands inline within the card, details/actions below.
 *  - Only one card open at a time; only one badge open at a time inside.
 *  - Top bar: centered "+ Add client" pill, filter chips, search.
 *
 * Superseded the earlier table + right-side drawer layout. See spec at
 * iam-clients-os/specs/OPERATOR_SPEC.md §5.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Loader2, Plus, X, Search, Eye, EyeOff, Copy, Trash2, Save, AlertCircle,
  Server as ServerIcon, Activity, Lock, FolderTree, DollarSign, StickyNote,
  AlertTriangle, RefreshCw, ChevronDown, Edit3,
  Upload, History as HistoryIcon, Github, Undo2, CheckCircle2, XCircle, Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

type ClientStatus = 'lead' | 'paid' | 'installing' | 'installed' | 'failed' | 'churned';
type ClientKind = 'real' | 'test';
type ContactType = 'email' | 'telegram' | 'whatsapp' | 'phone' | 'other';
type HeartbeatStatus = 'ok' | 'degraded' | 'starting';

interface ClientContact { type: ContactType; value: string }
interface ClientPayment { amount: number; currency: string; date: string; note?: string }
interface MaskedSecret { hasValue: boolean; preview: string }

interface ClientPublic {
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
  instanceId?: string;
  operatorToken: MaskedSecret;
  operatorUrl?: string;
  lastSeen?: string;
  lastSeenUptime?: number;
  heartbeatStatus?: HeartbeatStatus;
  githubRepo?: string;
  githubPat: MaskedSecret;
  githubBranch?: string;
  autoSnapshotAfterPush?: boolean;
  contacts: ClientContact[];
  payments: ClientPayment[];
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

type BadgeKey = 'server' | 'status' | 'access' | 'files' | 'updates' | 'activity' | 'notes' | 'billing' | 'danger';

const STATUS_LABELS: Record<ClientStatus, string> = {
  lead: 'Lead', paid: 'Paid', installing: 'Installing',
  installed: 'Installed', failed: 'Failed', churned: 'Churned',
};

const STATUS_COLORS: Record<ClientStatus, { bg: string; fg: string; border: string }> = {
  lead:       { bg: '#f3f4f6', fg: '#374151', border: '#d1d5db' },
  paid:       { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' },
  installing: { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  installed:  { bg: '#d1fae5', fg: '#065f46', border: '#6ee7b7' },
  failed:     { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
  churned:    { bg: '#e5e7eb', fg: '#6b7280', border: '#9ca3af' },
};

const ALL_STATUSES: ClientStatus[] = ['lead', 'paid', 'installing', 'installed', 'failed', 'churned'];
const ALL_KINDS: ClientKind[] = ['real', 'test'];

// ── Health dot — derived from lastSeen + heartbeatStatus ───────────────────

type HealthLevel = 'never' | 'stale' | 'warning' | 'ok' | 'degraded';

function computeHealth(c: ClientPublic): HealthLevel {
  if (!c.lastSeen) return 'never';
  const ageSec = (Date.now() - new Date(c.lastSeen).getTime()) / 1000;
  if (ageSec > 3600) return 'stale';
  if (ageSec > 600) return 'warning';
  if (c.heartbeatStatus === 'degraded') return 'degraded';
  return 'ok';
}

const HEALTH_COLORS: Record<HealthLevel, { color: string; label: string }> = {
  never:    { color: '#9ca3af', label: 'Never seen' },
  stale:    { color: '#ef4444', label: 'Stale (>1h)' },
  warning:  { color: '#f59e0b', label: 'Warning (>10m)' },
  ok:       { color: '#10b981', label: 'Online' },
  degraded: { color: '#f59e0b', label: 'Degraded' },
};

// ── Form state for edit/create ─────────────────────────────────────────────

interface FormState {
  name: string;
  domain: string;
  kind: ClientKind;
  status: ClientStatus;
  mode: 'team' | 'solo';
  port: string;
  installPath: string;
  productVersion: string;
  installDate: string;
  serverIp: string;
  sshUser: string;
  sshPort: string;
  sshPassword: string;
  sshKey: string;
  superAdminToken: string;
  githubRepo: string;
  githubPat: string;
  githubBranch: string;
  autoSnapshotAfterPush: boolean;
  contacts: ClientContact[];
  payments: ClientPayment[];
  notes: string;
  tags: string;
}

function emptyForm(): FormState {
  return {
    name: '', domain: '', kind: 'real', status: 'lead', mode: 'team',
    port: '4742', installPath: '/var/www/iam',
    productVersion: '', installDate: '',
    serverIp: '', sshUser: '', sshPort: '22',
    sshPassword: '', sshKey: '', superAdminToken: '',
    githubRepo: '', githubPat: '', githubBranch: 'main', autoSnapshotAfterPush: false,
    contacts: [], payments: [], notes: '', tags: '',
  };
}

function clientToForm(c: ClientPublic): FormState {
  return {
    name: c.name, domain: c.domain, kind: c.kind, status: c.status,
    mode: c.mode, port: String(c.port), installPath: c.installPath,
    productVersion: c.productVersion || '', installDate: c.installDate || '',
    serverIp: c.serverIp || '', sshUser: c.sshUser || '',
    sshPort: c.sshPort ? String(c.sshPort) : '22',
    sshPassword: '', sshKey: '', superAdminToken: '',
    githubRepo: c.githubRepo || '', githubPat: '',
    githubBranch: c.githubBranch || 'main',
    autoSnapshotAfterPush: !!c.autoSnapshotAfterPush,
    contacts: c.contacts || [], payments: c.payments || [],
    notes: c.notes || '', tags: (c.tags || []).join(', '),
  };
}

// ── Main component ─────────────────────────────────────────────────────────

export function ClientProjectsTab({ isMobile }: { isMobile: boolean }) {
  const [clients, setClients] = useState<ClientPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<ClientKind | 'all'>('all');

  // Accordion state — only one card expanded at a time. Create mode uses
  // a special key `__create__`.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedBadge, setExpandedBadge] = useState<BadgeKey | null>(null);

  // Edit state — which client is in edit mode (only one at a time)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Reveal cache for sensitive fields per-client per-field
  const [revealed, setRevealed] = useState<Record<string, Record<string, string>>>({});
  const [revealLoading, setRevealLoading] = useState<string | null>(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<ClientPublic | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Periodic refresh while at least one card is expanded (brings in fresh
  // lastSeen / heartbeatStatus). 30s seems right — heartbeat is every 5min.
  useEffect(() => {
    if (!expandedId) return;
    const id = setInterval(() => { load({ silent: true }); }, 30_000);
    return () => clearInterval(id);
     
  }, [expandedId]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/iam-clients-os/clients');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setClients(data.clients || []);
    } catch (err) {
      if (!opts?.silent) setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return clients.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (kindFilter !== 'all' && c.kind !== kindFilter) return false;
      if (s) {
        const hay = `${c.name} ${c.domain} ${c.serverIp || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [clients, search, statusFilter, kindFilter]);

  // ── Expand / collapse ──

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      // collapse
      setExpandedId(null);
      setExpandedBadge(null);
      setEditingId(null);
      setCardError(null);
    } else {
      const c = clients.find(x => x.id === id);
      if (c) {
        setExpandedId(id);
        setExpandedBadge('server'); // sensible default
        setEditingId(null);
        setForm(clientToForm(c));
        setCardError(null);
      }
    }
  };

  const openCreate = () => {
    setExpandedId('__create__');
    setExpandedBadge(null);
    setEditingId('__create__');
    setForm(emptyForm());
    setCardError(null);
  };

  const startEdit = (c: ClientPublic) => {
    setEditingId(c.id);
    setForm(clientToForm(c));
    setCardError(null);
  };

  const cancelEdit = () => {
    if (editingId === '__create__') {
      setExpandedId(null);
      setExpandedBadge(null);
    }
    setEditingId(null);
    setCardError(null);
  };

  // ── Reveal sensitive field ──

  const reveal = async (clientId: string, field: string) => {
    const cached = revealed[clientId]?.[field];
    if (cached !== undefined) {
      setRevealed(prev => {
        const next = { ...prev };
        const clientFields = { ...(next[clientId] || {}) };
        delete clientFields[field];
        if (Object.keys(clientFields).length === 0) delete next[clientId];
        else next[clientId] = clientFields;
        return next;
      });
      return;
    }
    const key = `${clientId}/${field}`;
    setRevealLoading(key);
    try {
      const res = await fetch(`/api/admin/iam-clients-os/clients/${clientId}?reveal=${field}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRevealed(prev => ({
        ...prev,
        [clientId]: { ...(prev[clientId] || {}), [field]: data.plaintext || '' },
      }));
    } catch (err) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally {
      setRevealLoading(null);
    }
  };

  // ── Save (create + edit) ──

  const buildPayload = (isCreate: boolean) => {
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      domain: form.domain.trim().toLowerCase(),
      kind: form.kind,
      status: form.status,
      mode: form.mode,
      port: parseInt(form.port, 10) || 4742,
      installPath: form.installPath.trim(),
      productVersion: form.productVersion.trim(),
      installDate: form.installDate.trim() || undefined,
      serverIp: form.serverIp.trim() || undefined,
      sshUser: form.sshUser.trim() || undefined,
      sshPort: form.sshPort ? (parseInt(form.sshPort, 10) || undefined) : undefined,
      githubRepo: form.githubRepo.trim() || undefined,
      githubBranch: form.githubBranch.trim() || 'main',
      autoSnapshotAfterPush: form.autoSnapshotAfterPush,
      contacts: form.contacts.filter(c => c.value.trim()),
      payments: form.payments.filter(p => p.amount > 0),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes,
    };
    if (isCreate || form.sshPassword) payload.sshPassword = form.sshPassword;
    if (isCreate || form.sshKey) payload.sshKey = form.sshKey;
    if (isCreate || form.superAdminToken) payload.superAdminToken = form.superAdminToken;
    if (isCreate || form.githubPat) payload.githubPat = form.githubPat;
    return payload;
  };

  const save = async () => {
    if (!form.name.trim() || !form.domain.trim()) {
      setCardError('Name and domain are required');
      return;
    }
    setSaving(true); setCardError(null);
    try {
      const isCreate = editingId === '__create__';
      const url = isCreate
        ? '/api/admin/iam-clients-os/clients'
        : `/api/admin/iam-clients-os/clients/${editingId}`;
      const method = isCreate ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(isCreate)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const newClient = data.client as ClientPublic;
      await load();
      setEditingId(null);
      setExpandedId(newClient.id);
      setExpandedBadge('server');
    } catch (err) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally { setSaving(false); }
  };

  // ── Delete ──

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/iam-clients-os/clients/${confirmDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (expandedId === confirmDelete.id) {
        setExpandedId(null); setExpandedBadge(null); setEditingId(null);
      }
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally { setDeleting(false); }
  };

  // ── Render ──
  return (
    <div>
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 4px 0' }}>
          Client Projects
          {!loading && (
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginLeft: 8 }}>
              · {filtered.length}{filtered.length !== clients.length ? ` of ${clients.length}` : ''}
            </span>
          )}
        </h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px 0' }}>
          IAM Client OS installations. Click a card to expand. Heartbeat via <code style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>/api/monitor/heartbeat</code>.
        </p>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 22px',
            background: '#FF6B35', color: '#fff', border: 'none',
            borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 2px 8px rgba(255,107,53,0.25)',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#ff7a4b'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#FF6B35'; }}
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text" placeholder="Search name, domain, IP, tags..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 13, outline: 'none', background: '#fff' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <FilterChip label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          {ALL_STATUSES.map(s => (
            <FilterChip key={s} label={STATUS_LABELS[s]} active={statusFilter === s} onClick={() => setStatusFilter(s)} color={STATUS_COLORS[s].fg} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <FilterChip label="All kinds" active={kindFilter === 'all'} onClick={() => setKindFilter('all')} />
          {ALL_KINDS.map(k => (
            <FilterChip key={k} label={k} active={kindFilter === k} onClick={() => setKindFilter(k)} />
          ))}
        </div>
        <button onClick={() => load()} disabled={loading} style={{ padding: '6px 10px', background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── States ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
          <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading clients...
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
          ❌ {error}
          <button onClick={() => load()} style={{ marginLeft: 10, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && expandedId !== '__create__' && (
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 10, border: '1px dashed #e5e7eb', color: '#6b7280' }}>
          {clients.length === 0 ? (
            <>
              <p style={{ fontSize: 14, marginBottom: 6 }}>No clients yet.</p>
              <p style={{ fontSize: 12 }}>Click <strong>Add Client</strong> above to add your first installation.</p>
            </>
          ) : (
            <p style={{ fontSize: 13 }}>No clients match the current filters.</p>
          )}
        </div>
      )}

      {/* ── Create card (appears at top when +Add is pressed) ── */}
      {expandedId === '__create__' && (
        <CreateCard
          isMobile={isMobile}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={save}
          onCancel={cancelEdit}
          cardError={cardError}
        />
      )}

      {/* ── Client cards (accordion) ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              isMobile={isMobile}
              expanded={expandedId === c.id}
              expandedBadge={expandedBadge}
              onToggleExpand={() => toggleExpand(c.id)}
              onSetBadge={setExpandedBadge}
              editing={editingId === c.id}
              form={form}
              setForm={setForm}
              saving={saving}
              onStartEdit={() => startEdit(c)}
              onCancelEdit={cancelEdit}
              onSave={save}
              onDelete={() => setConfirmDelete(c)}
              cardError={expandedId === c.id ? cardError : null}
              revealedForClient={revealed[c.id] || {}}
              revealLoadingKey={revealLoading}
              onReveal={field => reveal(c.id, field)}
              onClientsRefresh={() => load({ silent: true })}
            />
          ))}
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => !deleting && setConfirmDelete(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 20, maxWidth: 400, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginTop: 0 }}>Delete client?</h3>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              <strong>{confirmDelete.name}</strong> ({confirmDelete.domain}) will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={{ padding: '8px 14px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={doDelete} disabled={deleting} style={{ padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: deleting ? 'default' : 'pointer' }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ClientCard ─────────────────────────────────────────────────────────────

function ClientCard(props: {
  client: ClientPublic;
  isMobile: boolean;
  expanded: boolean;
  expandedBadge: BadgeKey | null;
  onToggleExpand: () => void;
  onSetBadge: (b: BadgeKey | null) => void;
  editing: boolean;
  form: FormState;
  setForm: (f: FormState) => void;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  cardError: string | null;
  revealedForClient: Record<string, string>;
  revealLoadingKey: string | null;
  onReveal: (field: string) => void;
  onClientsRefresh: () => void;
}) {
  const {
    client: c, isMobile, expanded, expandedBadge, onToggleExpand, onSetBadge,
    editing, form, setForm, saving, onStartEdit, onCancelEdit, onSave, onDelete,
    cardError, revealedForClient, revealLoadingKey, onReveal, onClientsRefresh,
  } = props;

  const health = computeHealth(c);
  const healthInfo = HEALTH_COLORS[health];

  return (
    <div style={{
      background: '#fff',
      border: expanded ? '1px solid #fdba9c' : '1px solid #e5e7eb',
      borderLeft: expanded ? '3px solid #FF6B35' : '1px solid #e5e7eb',
      borderRadius: 10,
      boxShadow: expanded ? '0 4px 16px rgba(255,107,53,0.08)' : '0 1px 2px rgba(0,0,0,0.02)',
      overflow: 'hidden',
      transition: 'border 0.15s, box-shadow 0.15s',
    }}>
      {/* Collapsed row — always visible */}
      <button
        onClick={onToggleExpand}
        style={{
          width: '100%',
          padding: isMobile ? '10px 12px' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 8 : 12,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Health dot */}
        <HealthDot level={health} />

        {/* Name + domain */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#111', fontSize: 14 }}>{c.name}</span>
            {c.kind === 'test' && (
              <span style={{ fontSize: 10, padding: '1px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 3, fontWeight: 700 }}>TEST</span>
            )}
            <StatusBadge status={c.status} />
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', marginTop: 2 }}>
            {c.domain}
            {c.productVersion && <span style={{ marginLeft: 8, color: '#9ca3af' }}>v{c.productVersion}</span>}
          </div>
        </div>

        {/* Last seen + chevron */}
        {!isMobile && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              {c.lastSeen ? relTime(c.lastSeen) : healthInfo.label}
            </div>
            {c.lastSeenUptime !== undefined && c.lastSeenUptime > 0 && (
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>up {formatUptime(c.lastSeenUptime)}</div>
            )}
          </div>
        )}
        <ChevronDown
          className="w-4 h-4"
          style={{
            color: '#9ca3af',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: isMobile ? 12 : 16, background: '#fafafa' }}>
          {cardError && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ marginTop: 1 }} />
              <span>{cardError}</span>
            </div>
          )}

          {/* Badge grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            <Badge icon={<ServerIcon className="w-3.5 h-3.5" />} label="Server" active={expandedBadge === 'server'} onClick={() => onSetBadge(expandedBadge === 'server' ? null : 'server')} />
            <Badge icon={<Activity className="w-3.5 h-3.5" />} label="Status" active={expandedBadge === 'status'} onClick={() => onSetBadge(expandedBadge === 'status' ? null : 'status')} healthColor={healthInfo.color} />
            <Badge icon={<Lock className="w-3.5 h-3.5" />} label="Access" active={expandedBadge === 'access'} onClick={() => onSetBadge(expandedBadge === 'access' ? null : 'access')} />
            <Badge icon={<FolderTree className="w-3.5 h-3.5" />} label="Files" active={expandedBadge === 'files'} onClick={() => onSetBadge(expandedBadge === 'files' ? null : 'files')} disabled={!c.operatorToken.hasValue} disabledHint={!c.operatorToken.hasValue ? 'Waiting for first heartbeat' : undefined} />
            <Badge icon={<Upload className="w-3.5 h-3.5" />} label="Updates" active={expandedBadge === 'updates'} onClick={() => onSetBadge(expandedBadge === 'updates' ? null : 'updates')} disabled={!c.operatorToken.hasValue} disabledHint={!c.operatorToken.hasValue ? 'Waiting for first heartbeat' : undefined} />
            <Badge icon={<Activity className="w-3.5 h-3.5" />} label="Activity" active={expandedBadge === 'activity'} onClick={() => onSetBadge(expandedBadge === 'activity' ? null : 'activity')} />
            <Badge icon={<StickyNote className="w-3.5 h-3.5" />} label="Notes" active={expandedBadge === 'notes'} onClick={() => onSetBadge(expandedBadge === 'notes' ? null : 'notes')} />
            <Badge icon={<DollarSign className="w-3.5 h-3.5" />} label="Billing" active={expandedBadge === 'billing'} onClick={() => onSetBadge(expandedBadge === 'billing' ? null : 'billing')} />
            <Badge icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Danger" active={expandedBadge === 'danger'} onClick={() => onSetBadge(expandedBadge === 'danger' ? null : 'danger')} variant="danger" />
            <div style={{ flex: 1 }} />
            {!editing && (
              <button
                onClick={onStartEdit}
                style={{ padding: '4px 10px', background: '#fff', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {editing && (
              <>
                <button onClick={onCancelEdit} disabled={saving} style={{ padding: '4px 10px', background: '#fff', color: '#4b5563', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button onClick={onSave} disabled={saving} style={{ padding: '4px 12px', background: saving ? '#fdb89a' : '#FF6B35', color: '#fff', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>

          {/* Badge content */}
          {expandedBadge && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
              {expandedBadge === 'server' && <ServerBadge client={c} editing={editing} form={form} setForm={setForm} />}
              {expandedBadge === 'status' && <StatusDetailBadge client={c} health={health} />}
              {expandedBadge === 'access' && <AccessBadge client={c} editing={editing} form={form} setForm={setForm} revealed={revealedForClient} revealLoadingKey={revealLoadingKey} onReveal={onReveal} />}
              {expandedBadge === 'files' && <FilesBadge client={c} onStagingChanged={onClientsRefresh} />}
              {expandedBadge === 'updates' && <UpdatesBadge client={c} onRefresh={onClientsRefresh} />}
              {expandedBadge === 'activity' && <ActivityBadge client={c} />}
              {expandedBadge === 'notes' && <NotesBadge client={c} editing={editing} form={form} setForm={setForm} />}
              {expandedBadge === 'billing' && <BillingBadge client={c} editing={editing} form={form} setForm={setForm} />}
              {expandedBadge === 'danger' && <DangerBadge client={c} onDelete={onDelete} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CreateCard ─────────────────────────────────────────────────────────────

function CreateCard(props: {
  isMobile: boolean;
  form: FormState;
  setForm: (f: FormState) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  cardError: string | null;
}) {
  const { form, setForm, saving, onSave, onCancel, cardError } = props;

  return (
    <div style={{
      marginBottom: 12,
      background: '#fff',
      border: '2px solid #FF6B35',
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(255,107,53,0.1)',
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FF6B35', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-4 h-4" /> New Client
        </h3>
        <button onClick={onCancel} disabled={saving} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {cardError && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ marginTop: 1 }} /> <span>{cardError}</span>
        </div>
      )}

      <ServerEditFields form={form} setForm={setForm} />

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={onCancel} disabled={saving} style={{ padding: '8px 14px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        <button onClick={onSave} disabled={saving} style={{ padding: '8px 16px', background: saving ? '#fdb89a' : '#FF6B35', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save className="w-4 h-4" /> {saving ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  );
}

// ── Server badge ───────────────────────────────────────────────────────────

function ServerBadge({ client: c, editing, form, setForm }: { client: ClientPublic; editing: boolean; form: FormState; setForm: (f: FormState) => void }) {
  if (editing) return <ServerEditFields form={form} setForm={setForm} />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
      <KV label="Name" value={c.name} />
      <KV label="Domain" value={c.domain} mono />
      <KV label="Install Path" value={c.installPath || '—'} mono />
      <KV label="Port" value={String(c.port)} mono />
      <KV label="Product Version" value={c.productVersion || '—'} />
      <KV label="Install Date" value={c.installDate || '—'} />
      <KV label="Mode" value={c.mode} />
      <KV label="Kind" value={c.kind} />
      <KV label="Instance ID" value={c.instanceId || '(waiting)'} mono />
      <KV label="Server IP" value={c.serverIp || '—'} mono />
      <KV label="Operator URL" value={c.operatorUrl || '—'} mono small />
      <KV label="Tags" value={(c.tags || []).join(', ') || '—'} />
      <KV label="Created" value={new Date(c.createdAt).toLocaleString()} small />
      <KV label="Updated" value={new Date(c.updatedAt).toLocaleString()} small />
    </div>
  );
}

function ServerEditFields({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  return (
    <div>
      <Row>
        <Field label="Name" required>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Acme Corp" />
        </Field>
        <Field label="Kind">
          <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as ClientKind })} style={inputStyle}>
            {ALL_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Domain" required>
          <input type="text" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="acme.iamrunning.online" />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ClientStatus })} style={inputStyle}>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Mode">
          <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value as 'team' | 'solo' })} style={inputStyle}>
            <option value="team">Team</option>
            <option value="solo">Solo</option>
          </select>
        </Field>
        <Field label="Port">
          <input type="text" value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="4742" />
        </Field>
      </Row>
      <Row>
        <Field label="Install Path">
          <input type="text" value={form.installPath} onChange={e => setForm({ ...form, installPath: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="/var/www/iam" />
        </Field>
        <Field label="Product Version">
          <input type="text" value={form.productVersion} onChange={e => setForm({ ...form, productVersion: e.target.value })} style={inputStyle} placeholder="1.0.0-beta" />
        </Field>
      </Row>
      <Row>
        <Field label="Install Date">
          <input type="date" value={form.installDate} onChange={e => setForm({ ...form, installDate: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Server IP">
          <input type="text" value={form.serverIp} onChange={e => setForm({ ...form, serverIp: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="185.5.55.111" />
        </Field>
      </Row>
      <Row>
        <Field label="Tags (comma-separated)">
          <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} style={inputStyle} placeholder="vip, ru-speaking" />
        </Field>
      </Row>
    </div>
  );
}

// ── Status badge content ───────────────────────────────────────────────────

function StatusDetailBadge({ client: c, health }: { client: ClientPublic; health: HealthLevel }) {
  const hi = HEALTH_COLORS[health];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: hi.color, boxShadow: `0 0 0 3px ${hi.color}22` }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{hi.label}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{c.heartbeatStatus ? `Heartbeat reports: ${c.heartbeatStatus}` : 'No heartbeat yet'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        <KV label="Last Heartbeat" value={c.lastSeen ? `${relTime(c.lastSeen)} (${new Date(c.lastSeen).toLocaleString()})` : 'Never'} small />
        <KV label="Uptime" value={c.lastSeenUptime !== undefined ? formatUptime(c.lastSeenUptime) : '—'} mono />
        <KV label="Heartbeat Status" value={c.heartbeatStatus || '—'} />
        <KV label="Install Status" value={STATUS_LABELS[c.status]} />
      </div>

      <div style={{ marginTop: 14, padding: 10, background: '#f9fafb', borderRadius: 6, fontSize: 11, color: '#6b7280' }}>
        Heartbeat is sent every 5 min from cron on the client via <code style={{ fontFamily: 'monospace' }}>scripts/iam-heartbeat.sh</code>.
        Warning threshold: 10 min. Stale threshold: 60 min.
      </div>
    </div>
  );
}

// ── Access badge ───────────────────────────────────────────────────────────

function AccessBadge({ client: c, editing, form, setForm, revealed, revealLoadingKey, onReveal }: {
  client: ClientPublic; editing: boolean;
  form: FormState; setForm: (f: FormState) => void;
  revealed: Record<string, string>;
  revealLoadingKey: string | null;
  onReveal: (field: string) => void;
}) {
  if (editing) {
    return (
      <div>
        <Row>
          <Field label="SSH User">
            <input type="text" value={form.sshUser} onChange={e => setForm({ ...form, sshUser: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="root" />
          </Field>
          <Field label="SSH Port">
            <input type="text" value={form.sshPort} onChange={e => setForm({ ...form, sshPort: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="22" />
          </Field>
        </Row>
        <SecretInput label="SSH Password" value={form.sshPassword} onChange={v => setForm({ ...form, sshPassword: v })} masked={c.sshPassword} />
        <SecretInput label="SSH Private Key" value={form.sshKey} onChange={v => setForm({ ...form, sshKey: v })} masked={c.sshKey} multiline />
        <SecretInput label="Super Admin Token" value={form.superAdminToken} onChange={v => setForm({ ...form, superAdminToken: v })} masked={c.superAdminToken} />

        <div style={{ margin: '14px 0 6px 0', borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>GitHub snapshot backup</h4>
          <Row>
            <Field label="Repo (owner/repo)">
              <input type="text" value={form.githubRepo} onChange={e => setForm({ ...form, githubRepo: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="ArielGrook/iam-acme-backup" />
            </Field>
            <Field label="Branch">
              <input type="text" value={form.githubBranch} onChange={e => setForm({ ...form, githubBranch: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="main" />
            </Field>
          </Row>
          <SecretInput label="GitHub PAT (fine-grained, Contents: R/W)" value={form.githubPat} onChange={v => setForm({ ...form, githubPat: v })} masked={c.githubPat} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1f2937', marginTop: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.autoSnapshotAfterPush} onChange={e => setForm({ ...form, autoSnapshotAfterPush: e.target.checked })} />
            Auto-snapshot to GitHub after every successful push
          </label>
        </div>

        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 10 }}>
          <strong>Operator Token</strong> is managed automatically — rotated via heartbeat (coming Phase 3).
        </p>
      </div>
    );
  }

  return (
    <div>
      <SecretRow label="MCP Endpoint" value={`https://${c.domain}/api/mcp`} mono />
      <SecretRow label="Operator URL" value={c.operatorUrl || `https://${c.domain}/api/operator`} mono />
      <SecretRow label="Admin Panel" value={`https://${c.domain}/iam.admin`} mono />

      <div style={{ margin: '12px 0', borderTop: '1px solid #f3f4f6' }} />

      <SecretReveal
        label="Operator Token"
        fieldKey="operatorToken"
        masked={c.operatorToken}
        revealed={revealed.operatorToken}
        onReveal={() => onReveal('operatorToken')}
        loading={revealLoadingKey === `${c.id}/operatorToken`}
        helpText="Shared secret sent by this client on every heartbeat. Changes require reinstall."
      />
      <SecretReveal
        label="Super Admin Token"
        fieldKey="superAdminToken"
        masked={c.superAdminToken}
        revealed={revealed.superAdminToken}
        onReveal={() => onReveal('superAdminToken')}
        loading={revealLoadingKey === `${c.id}/superAdminToken`}
      />
      <SecretReveal
        label="SSH Password"
        fieldKey="sshPassword"
        masked={c.sshPassword}
        revealed={revealed.sshPassword}
        onReveal={() => onReveal('sshPassword')}
        loading={revealLoadingKey === `${c.id}/sshPassword`}
      />
      <SecretReveal
        label="SSH Private Key"
        fieldKey="sshKey"
        masked={c.sshKey}
        revealed={revealed.sshKey}
        onReveal={() => onReveal('sshKey')}
        loading={revealLoadingKey === `${c.id}/sshKey`}
        multiline
      />
      <SecretReveal
        label="GitHub PAT"
        fieldKey="githubPat"
        masked={c.githubPat}
        revealed={revealed.githubPat}
        onReveal={() => onReveal('githubPat')}
        loading={revealLoadingKey === `${c.id}/githubPat`}
        helpText={c.githubRepo ? `Target: ${c.githubRepo} (branch: ${c.githubBranch || 'main'})` : 'No repo configured.'}
      />

      <div style={{ margin: '12px 0', borderTop: '1px solid #f3f4f6' }} />

      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>SSH</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        <KV label="User" value={c.sshUser || '—'} mono />
        <KV label="Port" value={c.sshPort ? String(c.sshPort) : '—'} mono />
        <KV label="Host" value={c.serverIp || c.domain} mono />
      </div>
      {c.serverIp && c.sshUser && (
        <div style={{ marginTop: 10, padding: 10, background: '#1f2937', color: '#f9fafb', borderRadius: 6, fontFamily: 'monospace', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1 }}>ssh {c.sshUser}@{c.serverIp}{c.sshPort && c.sshPort !== 22 ? ` -p ${c.sshPort}` : ''}</span>
          <button onClick={() => navigator.clipboard.writeText(`ssh ${c.sshUser}@${c.serverIp}${c.sshPort && c.sshPort !== 22 ? ` -p ${c.sshPort}` : ''}`)} style={{ padding: 4, background: 'transparent', border: '1px solid #374151', borderRadius: 4, cursor: 'pointer', color: '#9ca3af' }} title="Copy">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Files badge — embedded file browser ────────────────────────────────────

interface FileEntry { name: string; type: 'file' | 'dir'; size?: number; mtime: string }

function FilesBadge({ client: c, onStagingChanged }: { client: ClientPublic; onStagingChanged: () => void }) {
  const [cwd, setCwd] = useState('.');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const [openFile, setOpenFile] = useState<{ path: string; content: string; encoding: string; size: number; mtime: string } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [savingStaged, setSavingStaged] = useState(false);

  const listPath = useCallback(async (path: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/operator/files?client_id=${encodeURIComponent(c.id)}&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setEntries(data.entries || []);
      setCwd(data.path || path);
      setLatency(typeof data.proxy_latency_ms === 'number' ? data.proxy_latency_ms : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setLoading(false); }
  }, [c.id]);

  useEffect(() => { listPath('.'); }, [listPath]);

  const enterDir = (name: string) => {
    const next = cwd === '.' ? name : `${cwd}/${name}`;
    listPath(next);
  };

  const goUp = () => {
    if (cwd === '.' || !cwd.includes('/')) { listPath('.'); return; }
    const next = cwd.split('/').slice(0, -1).join('/') || '.';
    listPath(next);
  };

  const openFileAt = async (name: string) => {
    const path = cwd === '.' ? name : `${cwd}/${name}`;
    setFileLoading(true); setFileError(null); setEditMode(false);
    try {
      const res = await fetch(`/api/admin/operator/files/read?client_id=${encodeURIComponent(c.id)}&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setOpenFile({ path: data.path, content: data.content || '', encoding: data.encoding, size: data.size, mtime: data.mtime });
      setDraftContent(data.content || '');
    } catch (err) {
      setFileError(err instanceof Error ? err.message : String(err));
    } finally { setFileLoading(false); }
  };

  const saveDraftToStaging = async () => {
    if (!openFile) return;
    setSavingStaged(true); setFileError(null);
    try {
      const res = await fetch('/api/admin/operator/staging/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: c.id,
          path: openFile.path,
          content: draftContent,
          encoding: openFile.encoding === 'base64' ? 'base64' : 'text',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setEditMode(false);
      setOpenFile(null);
      onStagingChanged();
    } catch (err) {
      setFileError(err instanceof Error ? err.message : String(err));
    } finally { setSavingStaged(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: '#4b5563' }}>Client file system · read + stage (edits queue in Updates badge)</div>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#0f172a' }}>
            {c.installPath}/<span style={{ color: '#4b5563' }}>{cwd === '.' ? '' : cwd + '/'}</span>
          </div>
        </div>
        {latency !== null && <span style={{ fontSize: 10, color: '#6b7280' }}>upstream {latency}ms</span>}
        <button onClick={() => listPath(cwd)} disabled={loading} style={{ padding: '4px 10px', background: '#fff', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 12, marginBottom: 10 }}>
          {error}
        </div>
      )}

      {loading && !entries.length && (
        <div style={{ textAlign: 'center', padding: 20, color: '#4b5563' }}>
          <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading...
        </div>
      )}

      {!loading && !error && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', maxHeight: 400, overflowY: 'auto', background: '#fff' }}>
          {cwd !== '.' && (
            <button onClick={goUp} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid #f3f4f6', textAlign: 'left', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace', color: '#4b5563' }}>
              .. (up)
            </button>
          )}
          {entries.map(e => (
            <button
              key={e.name}
              onClick={() => e.type === 'dir' ? enterDir(e.name) : openFileAt(e.name)}
              style={{
                width: '100%', padding: '8px 12px', background: 'transparent', border: 'none',
                borderBottom: '1px solid #f3f4f6', textAlign: 'left', fontSize: 12, cursor: 'pointer',
                fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseOver={e2 => { e2.currentTarget.style.background = '#f9fafb'; }}
              onMouseOut={e2 => { e2.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: e.type === 'dir' ? '#FF6B35' : '#1f2937', fontWeight: e.type === 'dir' ? 700 : 400 }}>
                {e.type === 'dir' ? '▸' : ' '} {e.name}{e.type === 'dir' ? '/' : ''}
              </span>
              <span style={{ flex: 1 }} />
              {e.size !== undefined && <span style={{ color: '#6b7280', fontSize: 11 }}>{formatBytes(e.size)}</span>}
              <span style={{ color: '#6b7280', fontSize: 11 }}>{relTime(e.mtime)}</span>
            </button>
          ))}
          {entries.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>Empty directory</div>}
        </div>
      )}

      {/* File viewer / editor modal */}
      {(openFile || fileLoading || fileError) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => { setOpenFile(null); setFileError(null); setEditMode(false); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 16, maxWidth: 960, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                  {openFile?.path || 'Loading...'}
                  {editMode && <span style={{ fontSize: 10, marginLeft: 8, padding: '1px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 3, fontWeight: 700 }}>EDITING</span>}
                </div>
                {openFile && (
                  <div style={{ fontSize: 11, color: '#4b5563' }}>
                    {openFile.encoding} · {formatBytes(openFile.size)} · mtime {new Date(openFile.mtime).toLocaleString()}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {openFile && !editMode && openFile.encoding === 'text' && (
                  <button onClick={() => setEditMode(true)} style={{ padding: '6px 12px', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                {openFile && editMode && (
                  <>
                    <button onClick={() => { setEditMode(false); setDraftContent(openFile.content); }} disabled={savingStaged} style={{ padding: '6px 10px', background: '#fff', color: '#4b5563', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={saveDraftToStaging} disabled={savingStaged || draftContent === openFile.content} style={{ padding: '6px 12px', background: draftContent === openFile.content ? '#fdb89a' : '#FF6B35', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: draftContent === openFile.content ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Save className="w-3.5 h-3.5" /> {savingStaged ? 'Saving...' : 'Save to staging'}
                    </button>
                  </>
                )}
                {openFile && !editMode && (
                  <button onClick={() => navigator.clipboard.writeText(openFile.content)} style={{ padding: '6px 10px', background: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                )}
                <button onClick={() => { setOpenFile(null); setFileError(null); setEditMode(false); }} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {fileLoading && (
              <div style={{ textAlign: 'center', padding: 40, color: '#4b5563' }}>
                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading file...
              </div>
            )}
            {fileError && (
              <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{fileError}</div>
            )}
            {openFile && !editMode && (
              <pre style={{
                flex: 1, overflow: 'auto', background: '#1f2937', color: '#f9fafb',
                padding: 12, borderRadius: 6, fontFamily: 'monospace', fontSize: 12,
                whiteSpace: 'pre', margin: 0,
              }}>
                {openFile.encoding === 'base64' ? '[binary content — base64, ' + openFile.content.length + ' chars]\n' + openFile.content.slice(0, 4000) : openFile.content}
              </pre>
            )}
            {openFile && editMode && (
              <textarea
                value={draftContent}
                onChange={e => setDraftContent(e.target.value)}
                style={{
                  flex: 1, resize: 'none', background: '#1f2937', color: '#f9fafb',
                  padding: 12, borderRadius: 6, fontFamily: 'monospace', fontSize: 12,
                  border: '1px solid #374151', outline: 'none', minHeight: 300,
                }}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Updates badge (staging + push + history + github) ─────────────────────

interface StagedFileUI { path: string; size: number; savedAt: string; encoding: 'text' | 'base64' }
interface HistoryEntryUI {
  ts: string; type: 'push' | 'rollback' | 'snapshot';
  snap_id?: string; message?: string; files?: string[];
  deploy_ok?: boolean; deploy_http?: number; note?: string;
}

function UpdatesBadge({ client: c, onRefresh }: { client: ClientPublic; onRefresh: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<StagedFileUI[]>([]);
  const [history, setHistory] = useState<HistoryEntryUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushMessage, setPushMessage] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);
  const [snapshotResult, setSnapshotResult] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sRes, hRes] = await Promise.all([
        fetch(`/api/admin/operator/staging/list?client_id=${encodeURIComponent(c.id)}`),
        fetch(`/api/admin/operator/history?client_id=${encodeURIComponent(c.id)}&limit=30`),
      ]);
      const sData = await sRes.json();
      const hData = await hRes.json();
      if (!sRes.ok) throw new Error(sData.error || `staging HTTP ${sRes.status}`);
      if (!hRes.ok) throw new Error(hData.error || `history HTTP ${hRes.status}`);
      setStagedFiles(sData.files || []);
      setHistory(hData.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setLoading(false); }
  }, [c.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const discardOne = async (path: string) => {
    try {
      const res = await fetch(`/api/admin/operator/staging/list?client_id=${encodeURIComponent(c.id)}&path=${encodeURIComponent(path)}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  const discardAll = async () => {
    if (!confirm('Discard all staged files?')) return;
    try {
      const res = await fetch(`/api/admin/operator/staging/list?client_id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  const doPush = async () => {
    setPushing(true); setPushResult(null); setError(null);
    try {
      const res = await fetch('/api/admin/operator/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: c.id, message: pushMessage || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setPushResult(`❌ ${data.error || `HTTP ${res.status}`}${data.rollback_applied ? ' (rollback applied)' : ''}`);
      else {
        setPushResult(`✓ Pushed ${data.count} file(s) · deploy HTTP ${data.deploy_http}`);
        setPushMessage('');
      }
      await loadData();
      onRefresh();
    } catch (err) {
      setPushResult(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally { setPushing(false); }
  };

  const doRollback = async (snapId: string) => {
    if (!confirm(`Rollback to snapshot ${snapId}?\n\nThis will restore files from that snapshot and redeploy.`)) return;
    setRollingBack(snapId); setError(null);
    try {
      const res = await fetch('/api/admin/operator/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: c.id, snap_id: snapId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await loadData();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setRollingBack(null); }
  };

  const doGitHubSnapshot = async () => {
    setSnapshotting(true); setSnapshotResult(null); setError(null);
    try {
      const res = await fetch('/api/admin/operator/github/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: c.id, message: `Operator snapshot ${new Date().toISOString()}` }),
      });
      const data = await res.json();
      if (!res.ok) setSnapshotResult(`❌ ${data.error || `HTTP ${res.status}`}`);
      else setSnapshotResult(`✓ Pushed to ${data.repo_url}${data.had_changes ? '' : ' (no changes)'} @ ${(data.commit_hash || '').slice(0, 7)}`);
    } catch (err) {
      setSnapshotResult(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally { setSnapshotting(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Staging · <span style={{ color: '#4b5563', fontWeight: 500 }}>{stagedFiles.length} file(s) ready to push</span>
          </h4>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={loadData} disabled={loading} style={{ padding: '4px 10px', background: '#fff', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            {stagedFiles.length > 0 && (
              <button onClick={discardAll} style={{ padding: '4px 10px', background: '#fff', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                Discard all
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{error}</div>
        )}

        {loading && <div style={{ padding: 10, color: '#4b5563', fontSize: 12 }}><Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading...</div>}

        {!loading && stagedFiles.length === 0 && (
          <div style={{ padding: 14, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#4b5563' }}>
            No staged files. Edit a file in the <strong>Files</strong> badge and click &quot;Save to staging&quot; to queue changes.
          </div>
        )}

        {!loading && stagedFiles.length > 0 && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', background: '#fff', marginBottom: 10 }}>
            {stagedFiles.map(f => (
              <div key={f.path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                <span style={{ fontFamily: 'monospace', flex: 1, color: '#1f2937', wordBreak: 'break-all' }}>{f.path}</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{formatBytes(f.size)}</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{relTime(f.savedAt)}</span>
                <button onClick={() => discardOne(f.path)} style={{ padding: 4, background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', color: '#9ca3af' }} title="Discard">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {stagedFiles.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text" value={pushMessage} onChange={e => setPushMessage(e.target.value)}
              placeholder="Push message (optional)"
              style={{ flex: 1, minWidth: 200, padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, color: '#1f2937', background: '#fff' }}
            />
            <button onClick={doPush} disabled={pushing} style={{ padding: '8px 16px', background: pushing ? '#fdb89a' : '#FF6B35', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: pushing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload className="w-4 h-4" />
              {pushing ? 'Pushing...' : `Push ${stagedFiles.length} file(s) to client`}
            </button>
          </div>
        )}

        {pushResult && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: pushResult.startsWith('✓') ? '#f0fdf4' : '#fef2f2', color: pushResult.startsWith('✓') ? '#065f46' : '#991b1b', borderRadius: 6, fontSize: 12, border: `1px solid ${pushResult.startsWith('✓') ? '#86efac' : '#fca5a5'}` }}>
            {pushResult}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Github className="w-3.5 h-3.5" /> GitHub backup
          </h4>
          <button
            onClick={doGitHubSnapshot}
            disabled={snapshotting || !c.githubRepo || !c.githubPat.hasValue}
            title={!c.githubRepo || !c.githubPat.hasValue ? 'Configure githubRepo + githubPat in Access badge first' : ''}
            style={{ padding: '6px 12px', background: snapshotting ? '#fdb89a' : (!c.githubRepo || !c.githubPat.hasValue ? '#e5e7eb' : '#1f2937'), color: !c.githubRepo || !c.githubPat.hasValue ? '#9ca3af' : '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: (snapshotting || !c.githubRepo || !c.githubPat.hasValue) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Github className="w-3.5 h-3.5" />
            {snapshotting ? 'Snapshotting...' : 'Push snapshot now'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#4b5563' }}>
          {c.githubRepo ? (
            <>Target: <code style={{ fontFamily: 'monospace', color: '#1f2937' }}>{c.githubRepo}</code> (branch: <code style={{ fontFamily: 'monospace', color: '#1f2937' }}>{c.githubBranch || 'main'}</code>){c.autoSnapshotAfterPush && ' · auto-snapshot after push: ON'}</>
          ) : (
            <>Configure <strong>githubRepo</strong> + <strong>githubPat</strong> in the Access badge to enable backups.</>
          )}
        </div>
        {snapshotResult && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: snapshotResult.startsWith('✓') ? '#f0fdf4' : '#fef2f2', color: snapshotResult.startsWith('✓') ? '#065f46' : '#991b1b', borderRadius: 6, fontSize: 12, border: `1px solid ${snapshotResult.startsWith('✓') ? '#86efac' : '#fca5a5'}` }}>
            {snapshotResult}
          </div>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <HistoryIcon className="w-3.5 h-3.5" /> Push history
        </h4>
        {history.length === 0 && (
          <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>No pushes yet.</p>
        )}
        {history.length > 0 && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', background: '#fff', maxHeight: 340, overflowY: 'auto' }}>
            {history.map((h, i) => {
              const icon = h.type === 'rollback'
                ? <Undo2 className="w-3.5 h-3.5" style={{ color: '#b45309' }} />
                : h.deploy_ok
                  ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                  : <XCircle className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />;
              return (
                <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    {icon}
                    <span style={{ fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{h.type}</span>
                    <span style={{ color: '#4b5563' }}>{relTime(h.ts)}</span>
                    {h.snap_id && <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280' }}>· snap {h.snap_id.slice(0, 12)}</span>}
                    <span style={{ flex: 1 }} />
                    {h.type === 'push' && h.snap_id && h.deploy_ok && (
                      <button
                        onClick={() => doRollback(h.snap_id!)}
                        disabled={rollingBack === h.snap_id}
                        style={{ padding: '2px 8px', background: 'transparent', color: '#b45309', border: '1px solid #fcd34d', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        <Undo2 className="w-3 h-3" /> {rollingBack === h.snap_id ? 'Rolling...' : 'Rollback to this'}
                      </button>
                    )}
                  </div>
                  {h.message && <div style={{ color: '#1f2937', marginBottom: 2 }}>{h.message}</div>}
                  {h.files && h.files.length > 0 && (
                    <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'monospace', marginTop: 2 }}>
                      {h.files.slice(0, 4).join(', ')}{h.files.length > 4 ? ` · +${h.files.length - 4} more` : ''}
                    </div>
                  )}
                  {h.note && <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{h.note}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity badge ─────────────────────────────────────────────────────────

interface ActivityEventUI {
  ts?: string; user?: string; role?: string; action?: string; detail?: string;
  [k: string]: unknown;
}

function ActivityBadge({ client: c }: { client: ClientPublic }) {
  const [events, setEvents] = useState<ActivityEventUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/operator/activity?client_id=${encodeURIComponent(c.id)}&limit=200`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setLoading(false); }
  }, [c.id]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return events;
    return events.filter(e => {
      const hay = `${e.action || ''} ${e.user || ''} ${e.role || ''} ${e.detail || ''}`.toLowerCase();
      return hay.includes(f);
    });
  }, [events, filter]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Activity log</div>
          <div style={{ fontSize: 11, color: '#4b5563' }}>Posted by the client every 5 min · last {events.length} events</div>
        </div>
        <input
          type="text" value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter by action, user..."
          style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 12, color: '#1f2937', background: '#fff', minWidth: 160 }}
        />
        <button onClick={load} disabled={loading} style={{ padding: '4px 10px', background: '#fff', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 12 }}>{error}</div>
      )}

      {loading && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#4b5563' }}>
          <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading...
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div style={{ padding: 14, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#4b5563' }}>
          {events.length === 0 ? 'No activity yet. Events appear once the client starts reporting.' : `No events match "${filter}".`}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', background: '#fff', maxHeight: 420, overflowY: 'auto' }}>
          {filtered.map((e, i) => (
            <div key={i} style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock className="w-3 h-3" style={{ color: '#9ca3af' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280', minWidth: 90 }}>
                  {e.ts ? new Date(e.ts as string).toLocaleTimeString() : '—'}
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{e.action || '(no action)'}</span>
                {e.user && <span style={{ color: '#4b5563' }}>· {e.user as string}</span>}
                {e.role && (
                  <span style={{ fontSize: 10, padding: '1px 6px', background: '#eff6ff', color: '#1e40af', borderRadius: 3, fontWeight: 700 }}>{e.role as string}</span>
                )}
              </div>
              {e.detail && <div style={{ fontSize: 11, color: '#1f2937', marginTop: 2, marginLeft: 26, wordBreak: 'break-word' }}>{e.detail as string}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notes / Billing / Danger ───────────────────────────────────────────────

function NotesBadge({ client: c, editing, form, setForm }: { client: ClientPublic; editing: boolean; form: FormState; setForm: (f: FormState) => void }) {
  if (editing) {
    return (
      <div>
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={6} style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} placeholder="Anything to remember about this client..." />
        </Field>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Contacts</div>
          {form.contacts.map((contact, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <select value={contact.type} onChange={e => { const next = [...form.contacts]; next[i] = { ...contact, type: e.target.value as ContactType }; setForm({ ...form, contacts: next }); }} style={{ ...inputStyle, width: 'auto', minWidth: 110 }}>
                <option value="email">Email</option><option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="other">Other</option>
              </select>
              <input type="text" value={contact.value} onChange={e => { const next = [...form.contacts]; next[i] = { ...contact, value: e.target.value }; setForm({ ...form, contacts: next }); }} style={inputStyle} placeholder="value" />
              <button onClick={() => setForm({ ...form, contacts: form.contacts.filter((_, idx) => idx !== i) })} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', color: '#9ca3af' }} title="Remove">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => setForm({ ...form, contacts: [...form.contacts, { type: 'email', value: '' }] })} style={{ padding: '6px 10px', background: '#f9fafb', color: '#374151', border: '1px dashed #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus className="w-3.5 h-3.5" /> Add contact
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {c.notes ? (
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, color: '#374151', margin: 0, background: '#fafafa', padding: 10, borderRadius: 6 }}>{c.notes}</pre>
      ) : (
        <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No notes.</p>
      )}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Contacts</div>
        {c.contacts.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No contacts.</p>}
        {c.contacts.map((contact, i) => (
          <div key={i} style={{ fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: '#9ca3af', marginRight: 6 }}>{contact.type}:</span>
            <span style={{ fontFamily: 'monospace', color: '#374151' }}>{contact.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingBadge({ client: c, editing, form, setForm }: { client: ClientPublic; editing: boolean; form: FormState; setForm: (f: FormState) => void }) {
  if (editing) {
    return (
      <div>
        {form.payments.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="number" value={p.amount} onChange={e => { const next = [...form.payments]; next[i] = { ...p, amount: parseFloat(e.target.value) || 0 }; setForm({ ...form, payments: next }); }} style={{ ...inputStyle, width: 100 }} placeholder="0" />
            <input type="text" value={p.currency} onChange={e => { const next = [...form.payments]; next[i] = { ...p, currency: e.target.value.toUpperCase() }; setForm({ ...form, payments: next }); }} style={{ ...inputStyle, width: 70 }} placeholder="USD" />
            <input type="date" value={p.date} onChange={e => { const next = [...form.payments]; next[i] = { ...p, date: e.target.value }; setForm({ ...form, payments: next }); }} style={{ ...inputStyle, width: 140 }} />
            <input type="text" value={p.note || ''} onChange={e => { const next = [...form.payments]; next[i] = { ...p, note: e.target.value }; setForm({ ...form, payments: next }); }} style={{ ...inputStyle, flex: 1, minWidth: 140 }} placeholder="note" />
            <button onClick={() => setForm({ ...form, payments: form.payments.filter((_, idx) => idx !== i) })} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', color: '#9ca3af' }} title="Remove"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button onClick={() => setForm({ ...form, payments: [...form.payments, { amount: 0, currency: 'USD', date: new Date().toISOString().slice(0, 10) }] })} style={{ marginTop: 4, padding: '6px 10px', background: '#f9fafb', color: '#374151', border: '1px dashed #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus className="w-3.5 h-3.5" /> Add payment
        </button>
      </div>
    );
  }

  if (c.payments.length === 0) {
    return <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No payments recorded yet.</p>;
  }

  const total = c.payments.reduce((acc, p) => acc + p.amount, 0);
  const primaryCurrency = c.payments[0]?.currency || 'USD';

  return (
    <div>
      <div style={{ marginBottom: 14, padding: 10, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6 }}>
        <div style={{ fontSize: 11, color: '#065f46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total received</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#065f46', fontFamily: 'monospace' }}>
          {primaryCurrency} {total.toFixed(2)}
        </div>
      </div>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
            <th style={{ padding: '6px 8px', textAlign: 'right', color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
            <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note</th>
          </tr>
        </thead>
        <tbody>
          {c.payments.map((p, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 11, color: '#374151' }}>{p.date}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#111' }}>{p.currency} {p.amount.toFixed(2)}</td>
              <td style={{ padding: '6px 8px', color: '#6b7280' }}>{p.note || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DangerBadge({ client: c, onDelete }: { client: ClientPublic; onDelete: () => void }) {
  return (
    <div>
      <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', margin: '0 0 6px 0' }}>Delete client</h4>
        <p style={{ fontSize: 12, color: '#7f1d1d', marginTop: 0 }}>
          Permanently removes <strong>{c.name}</strong> from the registry. Does not touch the actual install on the client server.
        </p>
        <button
          onClick={onDelete}
          style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete client
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
        Coming in Phase 2: freeze client (block operator pushes), force reinstall.
      </p>
    </div>
  );
}

// ── UI primitives ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6,
  fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff',
};

function Badge({
  icon, label, active, onClick, variant, disabled, disabledHint, healthColor,
}: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
  variant?: 'danger'; disabled?: boolean; disabledHint?: string; healthColor?: string;
}) {
  const bg = active
    ? (variant === 'danger' ? '#fee2e2' : '#FF6B35')
    : disabled ? '#f3f4f6' : '#fff';
  const fg = active
    ? (variant === 'danger' ? '#991b1b' : '#fff')
    : disabled ? '#9ca3af' : (variant === 'danger' ? '#dc2626' : '#374151');
  const border = active
    ? (variant === 'danger' ? '#fca5a5' : '#FF6B35')
    : (variant === 'danger' ? '#fecaca' : '#e5e7eb');
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabledHint}
      style={{
        padding: '5px 12px', background: bg, color: fg,
        border: `1px solid ${border}`, borderRadius: 999,
        fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.1s',
      }}
    >
      {icon}
      {label}
      {healthColor && !active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: healthColor, marginLeft: 2 }} />}
    </button>
  );
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', fontSize: 10, fontWeight: 700,
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`, borderRadius: 999,
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function HealthDot({ level }: { level: HealthLevel }) {
  const info = HEALTH_COLORS[level];
  return (
    <div title={info.label} style={{
      width: 10, height: 10, borderRadius: '50%',
      background: info.color,
      flexShrink: 0,
      boxShadow: `0 0 0 3px ${info.color}22`,
    }} />
  );
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        background: active ? (color || '#111') : '#fff',
        color: active ? '#fff' : (color || '#6b7280'),
        border: `1px solid ${active ? (color || '#111') : '#e5e7eb'}`,
        borderRadius: 999,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        textTransform: 'capitalize',
      }}
    >{label}</button>
  );
}

function KV({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: small ? 11 : 13,
        color: '#111',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-word',
      }}>{value}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SecretRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ fontSize: 11, color: '#6b7280', minWidth: 110 }}>{label}</div>
      <code style={{ flex: 1, fontSize: 12, fontFamily: mono ? 'monospace' : 'inherit', color: '#374151', background: '#f9fafb', padding: '4px 8px', borderRadius: 4, wordBreak: 'break-all' }}>{value}</code>
      <button onClick={() => navigator.clipboard.writeText(value)} style={{ padding: 4, background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', color: '#6b7280' }} title="Copy">
        <Copy className="w-3 h-3" />
      </button>
    </div>
  );
}

function SecretReveal({
  label, fieldKey, masked, revealed, onReveal, loading, helpText, multiline,
}: {
  label: string;
  fieldKey: string;
  masked: MaskedSecret;
  revealed: string | undefined;
  onReveal: () => void;
  loading: boolean;
  helpText?: string;
  multiline?: boolean;
}) {
  const isRevealed = revealed !== undefined;
  if (!masked.hasValue) {
    return (
      <div style={{ marginBottom: 10, padding: 8, background: '#f9fafb', borderRadius: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, minWidth: 120 }}>{label}</div>
          <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
        </div>
        {helpText && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{helpText}</div>}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, minWidth: 120 }}>{label}</div>
        <code style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: isRevealed ? '#111' : '#6b7280', background: isRevealed ? '#fef3c7' : '#f9fafb', padding: '4px 8px', borderRadius: 4, wordBreak: 'break-all' }}>
          {isRevealed ? (multiline ? revealed.slice(0, 80) + (revealed!.length > 80 ? '...' : '') : revealed) : masked.preview}
        </code>
        <button onClick={onReveal} disabled={loading} style={{ padding: '3px 8px', background: isRevealed ? '#fef3c7' : 'transparent', color: '#FF6B35', border: '1px solid #fdba9c', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {loading ? '...' : isRevealed ? 'Hide' : 'Reveal'}
        </button>
        {isRevealed && (
          <button onClick={() => navigator.clipboard.writeText(revealed!)} style={{ padding: 4, background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', color: '#6b7280' }} title="Copy">
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
      {isRevealed && multiline && revealed!.length > 80 && (
        <pre style={{ fontSize: 11, fontFamily: 'monospace', background: '#1f2937', color: '#f9fafb', padding: 10, borderRadius: 6, overflow: 'auto', maxHeight: 200, margin: '4px 0 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{revealed}</pre>
      )}
      {helpText && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{helpText}</div>}
    </div>
  );
}

function SecretInput({ label, value, onChange, masked, multiline }: { label: string; value: string; onChange: (v: string) => void; masked: MaskedSecret; multiline?: boolean }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }} placeholder={masked.hasValue ? '(leave blank to keep current)' : ''} />
      ) : (
        <input type="password" value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder={masked.hasValue ? '(leave blank to keep current)' : ''} />
      )}
      {masked.hasValue && value === '' && (
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>Currently: <code style={{ fontFamily: 'monospace' }}>{masked.preview}</code></div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.round((now - then) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  if (sec < 86400 * 7) return `${Math.round(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatUptime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
}
