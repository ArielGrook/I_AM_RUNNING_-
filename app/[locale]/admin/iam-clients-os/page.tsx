'use client';

/**
 * Admin page for IAM Client OS product management.
 *
 * Route: /[locale]/admin/iam-clients-os
 *
 * Four subtabs (state-based, not URL):
 *  - Settings         — product-level config (JSON-backed)
 *  - Client Projects  — CRUD of client installations (placeholder in this iteration)
 *  - Web Installer    — pre-configured install.sh generator (placeholder in this iteration)
 *  - Dev Workspace    — file browser for iam-clients-os/workspace/ (read-only, functional)
 *
 * Auth: relies on the existing admin session cookie + sessionStorage flag set by
 * /[locale]/admin/page.tsx after TOTP verification. If no session, redirect to admin login.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Settings as SettingsIcon, Users, Download, FolderTree, Loader2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Settings {
  productVersion: string;
  defaultInstallerPort: number;
  defaultInstallPath: string;
  defaultMode: 'team' | 'solo';
  skeletonRepo: string;
  operatorContactEmail: string;
}

type SubTab = 'settings' | 'clients' | 'installer' | 'workspace';

const TABS: { id: SubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'settings',  label: 'Settings',        icon: SettingsIcon },
  { id: 'clients',   label: 'Client Projects', icon: Users },
  { id: 'installer', label: 'Web Installer',   icon: Download },
  { id: 'workspace', label: 'Dev Workspace',   icon: FolderTree },
];

// ── Main component ─────────────────────────────────────────────────────────

export default function IamClientsOsAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [hasSession, setHasSession] = useState(false);
  const [activeTab, setActiveTab] = useState<SubTab>('settings');
  const [isMobile, setIsMobile] = useState(false);

  // ── Auth gate (mirror of Dev Console pattern) ──
  useEffect(() => {
    const session = sessionStorage.getItem('admin_session');
    if (session !== 'true') {
      router.replace(`/${locale}/admin`);
    } else {
      setHasSession(true);
    }
  }, [locale, router]);

  // ── Mobile detection ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!hasSession) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '10px 16px' : '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.push(`/${locale}/admin`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Back to Admin"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#FF6B35' }}>IAM</span>
          {!isMobile && <span style={{ fontSize: 14, color: '#6b7280' }}>Clients OS — Admin</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            href={`/${locale}/admin`}
            style={{
              padding: '6px 12px',
              background: '#f3f4f6',
              borderRadius: 6,
              fontSize: 13,
              textDecoration: 'none',
              color: '#374151',
            }}
          >
            ← Admin
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '0 8px' : '0 24px',
          display: 'flex',
          gap: 0,
          overflowX: 'auto',
        }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: isMobile ? '12px 12px' : '14px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: isMobile ? 13 : 14,
                fontWeight: 600,
                color: active ? '#FF6B35' : '#6b7280',
                borderBottom: active ? '2px solid #FF6B35' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? 12 : 24, maxWidth: 1200, margin: '0 auto' }}>
        {activeTab === 'settings'  && <SettingsTab isMobile={isMobile} />}
        {activeTab === 'clients'   && <PlaceholderTab title="Client Projects"  description="CRUD for client installations. Coming in the next iteration." />}
        {activeTab === 'installer' && <PlaceholderTab title="Web Installer"    description="Pre-configured install.sh generator. Coming in the next iteration." />}
        {activeTab === 'workspace' && <WorkspaceTab isMobile={isMobile} />}
      </div>
    </div>
  );
}

// ── Placeholder ─────────────────────────────────────────────────────────────

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        padding: 40,
        textAlign: 'center',
        color: '#6b7280',
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 14 }}>{description}</p>
    </div>
  );
}

// ── Settings tab ───────────────────────────────────────────────────────────

function SettingsTab({ isMobile }: { isMobile: boolean }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [defaults, setDefaults] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/iam-clients-os/settings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSettings(data.settings);
      setDefaults(data.defaults);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/iam-clients-os/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSettings(data.settings);
      setMessage('✅ Settings saved');
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!defaults) return;
    if (!window.confirm('Reset all settings to defaults? (Not saved until you click Save)')) return;
    setSettings({ ...defaults });
  };

  // ── UI ──

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading settings...
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div
        style={{
          padding: 16,
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 14,
        }}
      >
        ❌ {error}
        <button
          onClick={load}
          style={{ marginLeft: 10, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!settings) return null;

  const field = (label: string, value: string | number, onChange: (v: string) => void, type: 'text' | 'number' = 'text', placeholder?: string) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          fontSize: 14,
          outline: 'none',
          fontFamily: type === 'text' && label.toLowerCase().includes('port') ? 'monospace' : 'inherit',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        padding: isMobile ? 16 : 24,
        maxWidth: 700,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 4 }}>Product Settings</h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        Defaults used by the Web Installer and client onboarding. Stored in{' '}
        <code style={{ fontFamily: 'monospace', fontSize: 12, background: '#f3f4f6', padding: '1px 6px', borderRadius: 3 }}>
          iam-clients-os/data/settings.json
        </code>
        {' '}(git-ignored).
      </p>

      {message && (
        <div style={{ marginBottom: 14, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, color: '#15803d', fontSize: 13, fontWeight: 600 }}>
          {message}
        </div>
      )}
      {error && settings && (
        <div style={{ marginBottom: 14, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 13 }}>
          ❌ {error}
        </div>
      )}

      {field('Product Version', settings.productVersion, v => setSettings({ ...settings, productVersion: v }), 'text', '1.0.0-beta')}

      {field('Default Installer Port', settings.defaultInstallerPort, v => {
        const n = parseInt(v, 10);
        setSettings({ ...settings, defaultInstallerPort: Number.isFinite(n) ? n : 0 });
      }, 'number', '4742')}

      {field('Default Install Path', settings.defaultInstallPath, v => setSettings({ ...settings, defaultInstallPath: v }), 'text', '/var/www/iam')}

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Default Mode
        </label>
        <select
          value={settings.defaultMode}
          onChange={e => setSettings({ ...settings, defaultMode: e.target.value as 'team' | 'solo' })}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
            background: '#fff',
            boxSizing: 'border-box',
          }}
        >
          <option value="team">Team (recommended)</option>
          <option value="solo">Solo (deprecated in UI, not actively tested)</option>
        </select>
      </div>

      {field('Skeleton Repo', settings.skeletonRepo, v => setSettings({ ...settings, skeletonRepo: v }), 'text', 'ArielGrook/iam-client-skeleton')}

      {field('Operator Contact Email', settings.operatorContactEmail, v => setSettings({ ...settings, operatorContactEmail: v }), 'text', 'iamrunning.online@gmail.com')}

      <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '10px 18px',
            background: saving ? '#fdb89a' : '#FF6B35',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={resetToDefaults}
          disabled={saving}
          style={{
            padding: '10px 18px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reset to defaults
        </button>
        <button
          onClick={load}
          disabled={saving}
          style={{
            padding: '10px 14px',
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
          title="Reload from disk"
        >
          ↻ Reload
        </button>
      </div>
    </div>
  );
}

// ── Dev Workspace tab ──────────────────────────────────────────────────────
// Read-only file browser scoped to iam-clients-os/workspace/.
// Tree comes from /api/admin/iam-clients-os/workspace (scoped).
// File content comes from /api/dev-agent/files/read with the prefix
// `iam-clients-os/workspace/` prepended to the relative path.

interface WsNode {
  name: string;
  path: string;      // relative to iam-clients-os/workspace/
  type: 'file' | 'dir';
  children?: WsNode[];
}

function WorkspaceTab({ isMobile }: { isMobile: boolean }) {
  const [tree, setTree] = useState<WsNode[]>([]);
  const [empty, setEmpty] = useState(false);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLines, setFileLines] = useState(0);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const loadTree = async () => {
    setTreeLoading(true);
    setTreeError(null);
    try {
      const res = await fetch('/api/admin/iam-clients-os/workspace');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setTree(data.tree || []);
      setEmpty(!!data.empty);
      setEmptyReason(data.reason || null);
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : String(err));
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => { loadTree(); }, []);

  // Fetch file contents when selected. Prefix path with iam-clients-os/workspace/
  // because /api/dev-agent/files/read expects paths relative to PROJECT_ROOT.
  useEffect(() => {
    if (!selectedPath) return;
    const controller = new AbortController();
    setFileLoading(true);
    setFileError(null);
    setFileContent(null);
    const fullPath = `iam-clients-os/workspace/${selectedPath}`;
    fetch(`/api/dev-agent/files/read?path=${encodeURIComponent(fullPath)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFileError(data.error); return; }
        setFileContent(data.content);
        setFileLines(data.lines);
      })
      .catch(e => { if (e.name !== 'AbortError') setFileError(e.message); })
      .finally(() => setFileLoading(false));
    return () => controller.abort();
  }, [selectedPath]);

  const toggleFolder = (folderPath: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const renderTree = (nodes: WsNode[], depth = 0): ReactNode =>
    nodes.map(node => {
      const isExpanded = expanded.has(node.path);
      const indent = depth * 14;
      const isActive = selectedPath === node.path;

      if (node.type === 'dir') {
        return (
          <div key={node.path}>
            <button
              onClick={() => toggleFolder(node.path)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: `4px 6px 4px ${8 + indent}px`,
                fontSize: 13,
                cursor: 'pointer',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 4,
              }}
              title={node.path}
            >
              <span style={{ width: 10, color: '#9ca3af', fontSize: 10 }}>{isExpanded ? '▾' : '▸'}</span>
              <span>📁</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
            </button>
            {isExpanded && node.children && <div>{renderTree(node.children, depth + 1)}</div>}
          </div>
        );
      }

      return (
        <button
          key={node.path}
          onClick={() => setSelectedPath(node.path)}
          style={{
            width: '100%',
            textAlign: 'left',
            background: isActive ? '#fff4ec' : 'none',
            border: 'none',
            padding: `4px 6px 4px ${8 + indent}px`,
            fontSize: 13,
            cursor: 'pointer',
            color: isActive ? '#FF6B35' : '#374151',
            fontWeight: isActive ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 4,
          }}
          title={node.path}
        >
          <span style={{ width: 10 }} />
          <span>📄</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
        </button>
      );
    });

  // ── UI ──
  const headerBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>Dev Workspace</h2>
      <span style={{ fontSize: 12, color: '#6b7280' }}>
        Read-only browser for{' '}
        <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f3f4f6', padding: '1px 6px', borderRadius: 3 }}>
          iam-clients-os/workspace/
        </code>
      </span>
      <button
        onClick={loadTree}
        disabled={treeLoading}
        style={{
          marginLeft: 'auto',
          padding: '6px 12px',
          background: '#f3f4f6',
          color: '#374151',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          fontSize: 12,
          cursor: treeLoading ? 'default' : 'pointer',
        }}
        title="Reload tree"
      >
        {treeLoading ? '⟳' : '↻'} Refresh
      </button>
    </div>
  );

  if (treeError) {
    return (
      <div>
        {headerBar}
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
          ❌ {treeError}
          <button onClick={loadTree} style={{ marginLeft: 10, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {headerBar}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {/* LEFT: tree */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 8,
            minHeight: 240,
            maxHeight: isMobile ? 280 : 560,
            overflow: 'auto',
          }}
        >
          {treeLoading && tree.length === 0 && (
            <div style={{ padding: 14, fontSize: 13, color: '#6b7280' }}>
              <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading...
            </div>
          )}

          {!treeLoading && empty && (
            <div style={{ padding: 14, fontSize: 13, color: '#6b7280' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Workspace is empty</div>
              <div style={{ fontSize: 12 }}>
                {emptyReason || 'No files in iam-clients-os/workspace/ yet. Content will appear here after migration Step 4.'}
              </div>
            </div>
          )}

          {!treeLoading && !empty && tree.length > 0 && renderTree(tree)}
        </div>

        {/* RIGHT: viewer */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            minHeight: 240,
            maxHeight: isMobile ? 400 : 560,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {!selectedPath && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13, padding: 20, textAlign: 'center' }}>
              {empty
                ? 'Nothing to view — workspace is empty.'
                : 'Click a file on the left to preview its contents.'}
            </div>
          )}

          {selectedPath && (
            <>
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#374151',
                  background: '#f9fafb',
                }}
              >
                <span style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  iam-clients-os/workspace/{selectedPath}
                </span>
                {!fileLoading && !fileError && fileContent !== null && (
                  <span style={{ marginLeft: 'auto', color: '#9ca3af', flexShrink: 0 }}>{fileLines}L</span>
                )}
              </div>

              <div style={{ flex: 1, overflow: 'auto' }}>
                {fileLoading && (
                  <div style={{ padding: 20, fontSize: 13, color: '#6b7280' }}>
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading {selectedPath}...
                  </div>
                )}
                {fileError && (
                  <div style={{ padding: 14, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
                    ❌ {fileError}
                  </div>
                )}
                {!fileLoading && !fileError && fileContent !== null && (
                  <pre
                    style={{
                      margin: 0,
                      padding: 14,
                      fontSize: 12,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      color: '#111',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {fileContent}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
        Read-only view. Files are editable via the main Dev Console (accessible through the Admin panel header).
      </p>
    </div>
  );
}
