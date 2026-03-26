'use client';

import { useState, useEffect, useCallback } from 'react';

interface MemoryFile { name: string; size: number; modified: string; }
interface GitCommit { hash: string; message: string; date: string; }
interface DashboardData { [filename: string]: Record<string, unknown>; }

const ORANGE = '#FF6B35';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [totpInput, setTotpInput] = useState('');
  const [totpError, setTotpError] = useState('');
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [toast, setToast] = useState('');

  const clientName = process.env.NEXT_PUBLIC_CLIENT_NAME || 'Client';

  const handleTotp = async () => {
    setTotpError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verify-totp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpInput }),
      });
      const data = await res.json();
      if (data.success) setAuthed(true);
      else setTotpError(data.error || 'Invalid code');
    } catch { setTotpError('Connection error'); }
    setLoading(false);
  };

  const api = useCallback(async (action: string, params?: Record<string, string>) => {
    const url = new URL('/api/admin/panel', window.location.origin);
    url.searchParams.set('action', action);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (res.status === 401) { setAuthed(false); return null; }
    return res.json();
  }, []);

  const apiPost = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/panel', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 401) { setAuthed(false); return null; }
    return res.json();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    const [fileData, dashData, gitData] = await Promise.all([api('list'), api('dashboard'), api('git-log')]);
    if (fileData?.files) setFiles(fileData.files);
    if (dashData?.dashboard) setDashboard(dashData.dashboard);
    if (gitData?.commits) setCommits(gitData.commits);
  }, [api]);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  const openFile = async (name: string) => {
    const data = await api('read', { file: `memory/${name}` });
    if (data?.content) { setActiveFile(name); setFileContent(data.content); }
  };

  const saveFile = async () => {
    if (!activeFile) return;
    setSaving(true);
    const data = await apiPost({ action: 'save', file: `memory/${activeFile}`, content: fileContent });
    if (data?.success) { showToast(`Saved: ${activeFile}`); loadData(); }
    else showToast(`Error: ${data?.error || 'Save failed'}`);
    setSaving(false);
  };

  const handleDeploy = async () => {
    if (!confirm('Deploy will restart the server. Continue?')) return;
    setDeploying(true);
    const data = await apiPost({ action: 'deploy' });
    if (data?.success) showToast('Deploy started! Server restarts in ~30s.');
    else showToast(`Error: ${data?.error || 'Deploy failed'}`);
    setDeploying(false);
  };

  const handleSnapshot = async () => {
    const msg = prompt('Commit message:', `Manual snapshot ${new Date().toISOString().slice(0, 16)}`);
    if (!msg) return;
    const data = await apiPost({ action: 'git-snapshot', content: msg });
    if (data?.success) { showToast('Snapshot created'); loadData(); }
  };

  // ── TOTP Screen ───────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 14, padding: 36, width: 340, textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🔐</div>
          <h2 style={{ color: '#111', fontSize: 18, margin: '8px 0 12px', fontWeight: 700 }}>Admin Panel</h2>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Enter your Google Authenticator code</p>
          <input
            type="text" inputMode="numeric" maxLength={6} placeholder="000000"
            value={totpInput}
            onChange={e => setTotpInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handleTotp()}
            style={{
              width: '100%', padding: '10px 12px', fontSize: 20, textAlign: 'center',
              letterSpacing: 8, background: '#fafafa', border: '1px solid #e0e0e0',
              borderRadius: 8, color: '#111', outline: 'none', boxSizing: 'border-box',
            }}
            autoFocus
          />
          {totpError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{totpError}</p>}
          <button
            onClick={handleTotp}
            disabled={loading || totpInput.length !== 6}
            style={{
              width: '100%', marginTop: 16, padding: '10px 0', background: ORANGE,
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer', opacity: totpInput.length !== 6 ? 0.5 : 1,
            }}
          >
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  // ── Main Panel (Light Theme) ──────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', color: '#333', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, background: '#fff', border: '1px solid #e0e0e0',
          borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#333', zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #eee', padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{clientName} — Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSnapshot} style={btnStyle('#f5f5f5', '#333')}>📸 Snapshot</button>
          <button onClick={handleDeploy} disabled={deploying} style={btnStyle(ORANGE, '#fff')}>
            {deploying ? '⏳ Deploying...' : '🚀 Deploy'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, minHeight: 'calc(100vh - 52px)' }}>
        {/* Sidebar */}
        <div style={{ width: 280, background: '#fff', borderRight: '1px solid #eee', padding: 16, flexShrink: 0 }}>
          <h3 style={sectionTitle}>Dashboard</h3>
          {dashboard['CURRENT_GOAL.md'] && (
            <div style={card}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Current Goal</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                {String(dashboard['CURRENT_GOAL.md'].goal_title || '(not set)')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                <span style={{ color: statusColor(String(dashboard['CURRENT_GOAL.md'].status || '')) }}>
                  {String(dashboard['CURRENT_GOAL.md'].status || 'unknown')}
                </span>
                <span style={{ color: '#999' }}>{String(dashboard['CURRENT_GOAL.md'].progress_percent || 0)}%</span>
              </div>
              <div style={{ height: 3, background: '#f0f0f0', borderRadius: 2, marginTop: 6 }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: ORANGE,
                  width: `${Math.min(100, Number(dashboard['CURRENT_GOAL.md'].progress_percent || 0))}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}
          {dashboard['SYSTEM_IDENTITY.md'] && (
            <div style={card}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Identity</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{String(dashboard['SYSTEM_IDENTITY.md'].business_name || '(not set)')}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{String(dashboard['SYSTEM_IDENTITY.md'].business_type || '')}</div>
            </div>
          )}

          <h3 style={{ ...sectionTitle, marginTop: 20 }}>memory/</h3>
          {files.map(f => (
            <div
              key={f.name} onClick={() => openFile(f.name)}
              style={{
                padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                background: activeFile === f.name ? ORANGE_LIGHT : 'transparent',
                border: activeFile === f.name ? `1px solid ${ORANGE_BORDER}` : '1px solid transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 13, color: f.name === 'RULES.md' ? '#ef4444' : '#333' }}>
                {f.name === 'RULES.md' ? '🔒 ' : '📄 '}{f.name}
              </span>
              <span style={{ fontSize: 11, color: '#bbb' }}>{formatSize(f.size)}</span>
            </div>
          ))}

          <h3 style={{ ...sectionTitle, marginTop: 20 }}>Git History</h3>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {commits.map(c => (
              <div key={c.hash} style={{ padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: ORANGE, fontFamily: 'monospace' }}>{c.hash}</span>
                  <span style={{ color: '#777', marginLeft: 6 }}>{c.message}</span>
                </div>
                <div style={{ fontSize: 10, color: '#ccc' }}>{c.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff' }}>
          {activeFile ? (
            <>
              <div style={{
                borderBottom: '1px solid #eee', padding: '8px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                  memory/{activeFile}
                  {activeFile === 'RULES.md' && <span style={{ color: '#ef4444', marginLeft: 8, fontSize: 11 }}>🔒 READ ONLY</span>}
                </span>
                {activeFile !== 'RULES.md' && (
                  <button onClick={saveFile} disabled={saving} style={btnStyle('#f0fdf4', '#16a34a')}>
                    {saving ? '⏳ Saving...' : '💾 Save'}
                  </button>
                )}
              </div>
              <textarea
                value={fileContent}
                onChange={e => setFileContent(e.target.value)}
                readOnly={activeFile === 'RULES.md'}
                spellCheck={false}
                style={{
                  flex: 1, padding: 16, background: '#fafafa', color: '#333',
                  border: 'none', outline: 'none', resize: 'none', fontFamily: 'monospace',
                  fontSize: 13, lineHeight: 1.6, tabSize: 2,
                }}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <div style={{ fontSize: 14 }}>Select a file from memory/ to view or edit</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ORANGE_LIGHT = 'rgba(255,107,53,0.06)';
const ORANGE_BORDER = 'rgba(255,107,53,0.2)';

const sectionTitle: React.CSSProperties = {
  fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#aaa', marginBottom: 10, fontWeight: 700,
};

const card: React.CSSProperties = {
  background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: 12, marginBottom: 10,
};

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '6px 14px', background: bg, border: '1px solid #e5e5e5',
    borderRadius: 7, color, fontSize: 12, cursor: 'pointer', fontWeight: 600,
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}b`;
  return `${(bytes / 1024).toFixed(1)}k`;
}

function statusColor(status: string): string {
  if (status === 'completed' || status === 'done') return '#22c55e';
  if (status === 'in_progress') return ORANGE;
  if (status === 'blocked') return '#ef4444';
  return '#999';
}
