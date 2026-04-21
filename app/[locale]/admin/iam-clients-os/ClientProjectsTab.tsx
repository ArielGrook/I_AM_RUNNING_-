'use client';

/**
 * Client Projects tab — CRUD for IAM Client OS installations.
 *
 * Architecture:
 *  - Table (left) with filters (status, kind, search by name/domain)
 *  - Detail drawer (right, slides in) for view + edit
 *  - "+ New" button → empty drawer in create mode
 *  - Sensitive fields (sshPassword, sshKey, superAdminToken) shown masked;
 *    explicit "Reveal" button decrypts via /api/admin/iam-clients-os/clients/[id]?reveal=field
 */

import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, X, Search, Eye, EyeOff, Copy, Trash2, Save, Edit3, AlertCircle } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

type ClientStatus = 'lead' | 'paid' | 'installing' | 'installed' | 'failed' | 'churned';
type ClientKind = 'real' | 'test';
type ContactType = 'email' | 'telegram' | 'whatsapp' | 'phone' | 'other';

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
  contacts: ClientContact[];
  payments: ClientPayment[];
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Form state used for both create and edit. Sensitive fields are blank
// strings unless the user actively types something — empty string in PATCH
// means "clear this field", undefined means "leave alone". We always send
// what's in state, so we send '' to clear or the new value to set.
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
  sshPassword: string;          // empty means "no change" in edit mode (we send only if changed)
  sshKey: string;
  superAdminToken: string;
  contacts: ClientContact[];
  payments: ClientPayment[];
  notes: string;
  tags: string;                 // comma-separated input
}

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

function emptyForm(): FormState {
  return {
    name: '', domain: '', kind: 'real', status: 'lead', mode: 'team',
    port: '4742', installPath: '/var/www/iam',
    productVersion: '', installDate: '',
    serverIp: '', sshUser: '', sshPort: '22',
    sshPassword: '', sshKey: '', superAdminToken: '',
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
    sshPassword: '',  // never prefill — user must Reveal first then explicitly edit
    sshKey: '', superAdminToken: '',
    contacts: c.contacts || [], payments: c.payments || [],
    notes: c.notes || '', tags: (c.tags || []).join(', '),
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export function ClientProjectsTab({ isMobile }: { isMobile: boolean }) {
  const [clients, setClients] = useState<ClientPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<ClientKind | 'all'>('all');

  // Drawer state
  const [drawerMode, setDrawerMode] = useState<'closed' | 'view' | 'edit' | 'create'>('closed');
  const [drawerClient, setDrawerClient] = useState<ClientPublic | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Reveal state for sensitive fields in view mode
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealLoading, setRevealLoading] = useState<string | null>(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<ClientPublic | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data load ──
  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/iam-clients-os/clients');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setClients(data.clients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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

  // ── Drawer actions ──

  const openCreate = () => {
    setDrawerClient(null);
    setForm(emptyForm());
    setRevealed({});
    setDrawerError(null);
    setDrawerMode('create');
  };

  const openView = (c: ClientPublic) => {
    setDrawerClient(c);
    setForm(clientToForm(c));
    setRevealed({});
    setDrawerError(null);
    setDrawerMode('view');
  };

  const openEdit = (c: ClientPublic) => {
    setDrawerClient(c);
    setForm(clientToForm(c));
    setRevealed({});
    setDrawerError(null);
    setDrawerMode('edit');
  };

  const closeDrawer = () => {
    setDrawerMode('closed');
    setDrawerClient(null);
    setRevealed({});
  };

  const reveal = async (field: 'sshPassword' | 'sshKey' | 'superAdminToken') => {
    if (!drawerClient) return;
    if (revealed[field] !== undefined) {
      // Toggle hide
      setRevealed(prev => { const n = { ...prev }; delete n[field]; return n; });
      return;
    }
    setRevealLoading(field);
    try {
      const res = await fetch(`/api/admin/iam-clients-os/clients/${drawerClient.id}?reveal=${field}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRevealed(prev => ({ ...prev, [field]: data.plaintext || '' }));
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : String(err));
    } finally {
      setRevealLoading(null);
    }
  };

  const buildPayload = (isCreate: boolean) => {
    // For edit: only include encrypted fields if user actively typed something.
    // For create: always include (they default to '').
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
      contacts: form.contacts.filter(c => c.value.trim()),
      payments: form.payments.filter(p => p.amount > 0),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes,
    };
    // Sensitive fields: only send if create OR user typed something
    if (isCreate || form.sshPassword) payload.sshPassword = form.sshPassword;
    if (isCreate || form.sshKey) payload.sshKey = form.sshKey;
    if (isCreate || form.superAdminToken) payload.superAdminToken = form.superAdminToken;
    return payload;
  };

  const save = async () => {
    if (!form.name.trim() || !form.domain.trim()) {
      setDrawerError('Name and domain are required');
      return;
    }
    setSaving(true); setDrawerError(null);
    try {
      const isCreate = drawerMode === 'create';
      const url = isCreate
        ? '/api/admin/iam-clients-os/clients'
        : `/api/admin/iam-clients-os/clients/${drawerClient!.id}`;
      const method = isCreate ? 'POST' : 'PATCH';
      const payload = buildPayload(isCreate);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await load();
      // Switch to view mode for the new/updated client
      const newClient = data.client as ClientPublic;
      setDrawerClient(newClient);
      setForm(clientToForm(newClient));
      setRevealed({});
      setDrawerMode('view');
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : String(err));
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/iam-clients-os/clients/${confirmDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setConfirmDelete(null);
      if (drawerClient?.id === confirmDelete.id) closeDrawer();
      await load();
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : String(err));
    } finally { setDeleting(false); }
  };

  // ── UI primitives ──

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6,
    fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
  };

  const isEditable = drawerMode === 'edit' || drawerMode === 'create';

  // ── Render ──
  return (
    <div style={{ position: 'relative' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>
            Client Projects {!loading && <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>· {filtered.length}{filtered.length !== clients.length ? ` of ${clients.length}` : ''}</span>}
          </h2>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
            CRUD for IAM Client OS installations. Stored in <code style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>iam-clients-os/data/clients.json</code> (git-ignored).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{ padding: '8px 14px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>↻ Refresh</button>
          <button onClick={openCreate} style={{ padding: '8px 14px', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus className="w-4 h-4" /> New Client
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 400 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text" placeholder="Search name, domain, IP, tags..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ClientStatus | 'all')} style={{ ...inputStyle, width: 'auto', minWidth: 120 }}>
          <option value="all">All statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value as ClientKind | 'all')} style={{ ...inputStyle, width: 'auto', minWidth: 100 }}>
          <option value="all">All kinds</option>
          <option value="real">Real</option>
          <option value="test">Test</option>
        </select>
      </div>

      {/* ── List ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
          <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading clients...
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
          ❌ {error}
          <button onClick={load} style={{ marginLeft: 10, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 10, border: '1px dashed #e5e7eb', color: '#6b7280' }}>
          {clients.length === 0 ? (
            <>
              <p style={{ fontSize: 14, marginBottom: 6 }}>No clients yet.</p>
              <p style={{ fontSize: 12 }}>Click <strong>+ New Client</strong> to add your first installation.</p>
            </>
          ) : (
            <p style={{ fontSize: 13 }}>No clients match the current filters.</p>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={thStyle(isMobile)}>Client</th>
                {!isMobile && <th style={thStyle(isMobile)}>Domain</th>}
                <th style={thStyle(isMobile)}>Status</th>
                {!isMobile && <th style={thStyle(isMobile)}>Mode</th>}
                {!isMobile && <th style={thStyle(isMobile)}>Updated</th>}
                <th style={{ ...thStyle(isMobile), width: 1 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => openView(c)}>
                  <td style={tdStyle(isMobile)}>
                    <div style={{ fontWeight: 600, color: '#111' }}>
                      {c.name}
                      {c.kind === 'test' && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', background: '#fef3c7', color: '#92400e', borderRadius: 3, fontWeight: 700 }}>TEST</span>}
                    </div>
                    {isMobile && <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', marginTop: 2 }}>{c.domain}</div>}
                  </td>
                  {!isMobile && <td style={{ ...tdStyle(isMobile), fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{c.domain}</td>}
                  <td style={tdStyle(isMobile)}>
                    <StatusBadge status={c.status} />
                  </td>
                  {!isMobile && <td style={{ ...tdStyle(isMobile), fontSize: 12, color: '#6b7280' }}>{c.mode}</td>}
                  {!isMobile && <td style={{ ...tdStyle(isMobile), fontSize: 11, color: '#9ca3af' }}>{relTime(c.updatedAt)}</td>}
                  <td style={{ ...tdStyle(isMobile), textAlign: 'right' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(c); }}
                      style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                      title="Delete client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Drawer ── */}
      {drawerMode !== 'closed' && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
            onClick={closeDrawer}
          />
          <div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: isMobile ? '100%' : 540,
              maxWidth: '100vw',
              background: '#fff', zIndex: 201,
              boxShadow: '-8px 0 24px rgba(0,0,0,0.1)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Drawer header */}
            <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>
                  {drawerMode === 'create' ? 'New Client' : drawerClient?.name || 'Client'}
                </h3>
                {drawerMode !== 'create' && drawerClient && (
                  <p style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', margin: '2px 0 0 0' }}>{drawerClient.domain}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {drawerMode === 'view' && drawerClient && (
                  <button
                    onClick={() => openEdit(drawerClient)}
                    style={{ padding: '6px 10px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                <button onClick={closeDrawer} style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {drawerError && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ marginTop: 1 }} />
                  <span>{drawerError}</span>
                </div>
              )}

              {/* Basic */}
              <Section title="Basics">
                <Row>
                  <FieldGroup label="Name" required>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={!isEditable} style={inputStyle} placeholder="Acme Corp" />
                  </FieldGroup>
                  <FieldGroup label="Kind">
                    <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as ClientKind })} disabled={!isEditable} style={inputStyle}>
                      {ALL_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </FieldGroup>
                </Row>
                <Row>
                  <FieldGroup label="Domain" required>
                    <input type="text" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} disabled={!isEditable} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="acme.iamrunning.online" />
                  </FieldGroup>
                  <FieldGroup label="Status">
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ClientStatus })} disabled={!isEditable} style={inputStyle}>
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </FieldGroup>
                </Row>
                <Row>
                  <FieldGroup label="Mode">
                    <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value as 'team' | 'solo' })} disabled={!isEditable} style={inputStyle}>
                      <option value="team">Team</option>
                      <option value="solo">Solo</option>
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Port">
                    <input type="text" value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} disabled={!isEditable} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="4742" />
                  </FieldGroup>
                </Row>
                <Row>
                  <FieldGroup label="Install Path">
                    <input type="text" value={form.installPath} onChange={e => setForm({ ...form, installPath: e.target.value })} disabled={!isEditable} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="/var/www/iam" />
                  </FieldGroup>
                  <FieldGroup label="Product Version">
                    <input type="text" value={form.productVersion} onChange={e => setForm({ ...form, productVersion: e.target.value })} disabled={!isEditable} style={inputStyle} placeholder="1.0.0-beta" />
                  </FieldGroup>
                </Row>
                <Row>
                  <FieldGroup label="Install Date">
                    <input type="date" value={form.installDate} onChange={e => setForm({ ...form, installDate: e.target.value })} disabled={!isEditable} style={inputStyle} />
                  </FieldGroup>
                  <FieldGroup label="Tags (comma-separated)">
                    <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} disabled={!isEditable} style={inputStyle} placeholder="vip, ru-speaking" />
                  </FieldGroup>
                </Row>
              </Section>

              {/* Server access */}
              <Section title="Server Access">
                <Row>
                  <FieldGroup label="Server IP">
                    <input type="text" value={form.serverIp} onChange={e => setForm({ ...form, serverIp: e.target.value })} disabled={!isEditable} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="185.5.55.111" />
                  </FieldGroup>
                  <FieldGroup label="SSH User">
                    <input type="text" value={form.sshUser} onChange={e => setForm({ ...form, sshUser: e.target.value })} disabled={!isEditable} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="root" />
                  </FieldGroup>
                </Row>
                <Row>
                  <FieldGroup label="SSH Port">
                    <input type="text" value={form.sshPort} onChange={e => setForm({ ...form, sshPort: e.target.value })} disabled={!isEditable} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="22" />
                  </FieldGroup>
                  <div style={{ flex: 1 }} />
                </Row>
                <SecretField
                  label="SSH Password"
                  fieldKey="sshPassword"
                  isEditable={isEditable}
                  isCreate={drawerMode === 'create'}
                  formValue={form.sshPassword}
                  onChange={v => setForm({ ...form, sshPassword: v })}
                  masked={drawerClient?.sshPassword}
                  revealedValue={revealed.sshPassword}
                  onReveal={() => reveal('sshPassword')}
                  revealLoading={revealLoading === 'sshPassword'}
                />
                <SecretField
                  label="SSH Private Key"
                  fieldKey="sshKey"
                  isEditable={isEditable}
                  isCreate={drawerMode === 'create'}
                  formValue={form.sshKey}
                  onChange={v => setForm({ ...form, sshKey: v })}
                  masked={drawerClient?.sshKey}
                  revealedValue={revealed.sshKey}
                  onReveal={() => reveal('sshKey')}
                  revealLoading={revealLoading === 'sshKey'}
                  multiline
                />
                <SecretField
                  label="Super Admin Token"
                  fieldKey="superAdminToken"
                  isEditable={isEditable}
                  isCreate={drawerMode === 'create'}
                  formValue={form.superAdminToken}
                  onChange={v => setForm({ ...form, superAdminToken: v })}
                  masked={drawerClient?.superAdminToken}
                  revealedValue={revealed.superAdminToken}
                  onReveal={() => reveal('superAdminToken')}
                  revealLoading={revealLoading === 'superAdminToken'}
                />
              </Section>

              {/* Contacts */}
              <Section title="Contacts">
                {form.contacts.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <select
                      value={c.type}
                      onChange={e => {
                        const next = [...form.contacts]; next[i] = { ...c, type: e.target.value as ContactType };
                        setForm({ ...form, contacts: next });
                      }}
                      disabled={!isEditable} style={{ ...inputStyle, width: 'auto', minWidth: 110 }}>
                      <option value="email">Email</option>
                      <option value="telegram">Telegram</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="phone">Phone</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="text" value={c.value}
                      onChange={e => {
                        const next = [...form.contacts]; next[i] = { ...c, value: e.target.value };
                        setForm({ ...form, contacts: next });
                      }}
                      disabled={!isEditable} style={inputStyle} placeholder="value"
                    />
                    {isEditable && (
                      <button
                        onClick={() => setForm({ ...form, contacts: form.contacts.filter((_, idx) => idx !== i) })}
                        style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', color: '#9ca3af' }}
                        title="Remove">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditable && (
                  <button
                    onClick={() => setForm({ ...form, contacts: [...form.contacts, { type: 'email', value: '' }] })}
                    style={{ marginTop: 4, padding: '6px 10px', background: '#f9fafb', color: '#374151', border: '1px dashed #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus className="w-3.5 h-3.5" /> Add contact
                  </button>
                )}
                {!isEditable && form.contacts.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No contacts.</p>}
              </Section>

              {/* Payments */}
              <Section title="Payments">
                {form.payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <input
                      type="number" value={p.amount}
                      onChange={e => {
                        const next = [...form.payments];
                        next[i] = { ...p, amount: parseFloat(e.target.value) || 0 };
                        setForm({ ...form, payments: next });
                      }}
                      disabled={!isEditable} style={{ ...inputStyle, width: 100 }} placeholder="0"
                    />
                    <input
                      type="text" value={p.currency}
                      onChange={e => {
                        const next = [...form.payments];
                        next[i] = { ...p, currency: e.target.value.toUpperCase() };
                        setForm({ ...form, payments: next });
                      }}
                      disabled={!isEditable} style={{ ...inputStyle, width: 70 }} placeholder="USD"
                    />
                    <input
                      type="date" value={p.date}
                      onChange={e => {
                        const next = [...form.payments];
                        next[i] = { ...p, date: e.target.value };
                        setForm({ ...form, payments: next });
                      }}
                      disabled={!isEditable} style={{ ...inputStyle, width: 140 }}
                    />
                    <input
                      type="text" value={p.note || ''}
                      onChange={e => {
                        const next = [...form.payments];
                        next[i] = { ...p, note: e.target.value };
                        setForm({ ...form, payments: next });
                      }}
                      disabled={!isEditable} style={inputStyle} placeholder="note"
                    />
                    {isEditable && (
                      <button
                        onClick={() => setForm({ ...form, payments: form.payments.filter((_, idx) => idx !== i) })}
                        style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', color: '#9ca3af' }}
                        title="Remove">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditable && (
                  <button
                    onClick={() => setForm({ ...form, payments: [...form.payments, { amount: 0, currency: 'USD', date: new Date().toISOString().slice(0, 10) }] })}
                    style={{ marginTop: 4, padding: '6px 10px', background: '#f9fafb', color: '#374151', border: '1px dashed #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus className="w-3.5 h-3.5" /> Add payment
                  </button>
                )}
                {!isEditable && form.payments.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No payments.</p>}
              </Section>

              {/* Notes */}
              <Section title="Notes">
                <textarea
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  disabled={!isEditable} rows={5}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Anything to remember about this client..."
                />
              </Section>

              {drawerMode === 'view' && drawerClient && (
                <Section title="Metadata">
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                    Created: {new Date(drawerClient.createdAt).toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                    Updated: {new Date(drawerClient.updatedAt).toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0', fontFamily: 'monospace' }}>ID: {drawerClient.id}</p>
                </Section>
              )}
            </div>

            {/* Drawer footer */}
            {isEditable && (
              <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#f9fafb' }}>
                <button
                  onClick={drawerMode === 'create' ? closeDrawer : () => drawerClient && openView(drawerClient)}
                  disabled={saving}
                  style={{ padding: '8px 14px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={save} disabled={saving}
                  style={{ padding: '8px 16px', background: saving ? '#fdb89a' : '#FF6B35', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : drawerMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Delete confirm ── */}
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

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ClientStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`, borderRadius: 999,
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h4 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' }}>{title}</h4>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>{children}</div>;
}

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SecretField({
  label, fieldKey, isEditable, isCreate, formValue, onChange,
  masked, revealedValue, onReveal, revealLoading, multiline,
}: {
  label: string;
  fieldKey: string;
  isEditable: boolean;
  isCreate: boolean;
  formValue: string;
  onChange: (v: string) => void;
  masked?: MaskedSecret;
  revealedValue?: string;
  onReveal: () => void;
  revealLoading: boolean;
  multiline?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6,
    fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff',
    fontFamily: 'monospace',
  };

  const isRevealed = revealedValue !== undefined;
  const hasStored = masked?.hasValue;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        {hasStored && !isCreate && (
          <button
            onClick={onReveal}
            disabled={revealLoading}
            style={{ padding: '2px 8px', background: 'transparent', color: '#FF6B35', border: '1px solid #fdba9c', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {revealLoading ? '...' : isRevealed ? 'Hide' : 'Reveal'}
          </button>
        )}
      </div>

      {/* View mode: show masked or revealed */}
      {!isEditable && (
        <div>
          {!hasStored && <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Not set</p>}
          {hasStored && !isRevealed && (
            <p style={{ fontSize: 13, color: '#374151', fontFamily: 'monospace', background: '#f9fafb', padding: '6px 10px', borderRadius: 4 }}>{masked?.preview}</p>
          )}
          {hasStored && isRevealed && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
              {multiline ? (
                <pre style={{ flex: 1, background: '#f9fafb', padding: '6px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflow: 'auto', margin: 0 }}>{revealedValue}</pre>
              ) : (
                <p style={{ flex: 1, fontSize: 13, color: '#111', fontFamily: 'monospace', background: '#fef3c7', padding: '6px 10px', borderRadius: 4, margin: 0, wordBreak: 'break-all' }}>{revealedValue}</p>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(revealedValue || '')}
                style={{ padding: 6, background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', color: '#6b7280' }}
                title="Copy to clipboard">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit mode: text input. Empty input = no change in edit mode (won't be sent). */}
      {isEditable && (
        <>
          {multiline ? (
            <textarea
              value={formValue}
              onChange={e => onChange(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder={hasStored && !isCreate ? '(leave blank to keep current value, type to replace)' : ''}
            />
          ) : (
            <input
              type="password"
              value={formValue}
              onChange={e => onChange(e.target.value)}
              style={inputStyle}
              placeholder={hasStored && !isCreate ? '(leave blank to keep current)' : ''}
            />
          )}
          {hasStored && !isCreate && formValue === '' && (
            <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, marginBottom: 0 }}>
              Currently: <code style={{ fontFamily: 'monospace' }}>{masked?.preview}</code> · Leave blank to keep, type new value to replace
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function thStyle(isMobile: boolean): React.CSSProperties {
  return {
    textAlign: 'left', padding: isMobile ? '10px 10px' : '10px 14px',
    fontSize: 11, fontWeight: 700, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };
}

function tdStyle(isMobile: boolean): React.CSSProperties {
  return { padding: isMobile ? '10px 10px' : '12px 14px', verticalAlign: 'middle' };
}

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
