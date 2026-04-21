'use client';

/**
 * Web Installer tab — generates a personalised bootstrap.sh for a new
 * IAM Client OS installation.
 *
 * Two flows:
 *  1. Pick an existing client from the registry → fields auto-populate.
 *  2. Enter all fields manually for a one-off install.
 *
 * Generated script is shown in a preview box and downloadable as a file.
 * The GitHub PAT is never logged — it's either baked into the generated
 * script (if provided here) or prompted at bootstrap time.
 */

import { useEffect, useState, useMemo } from 'react';
import { Loader2, Download, Copy, AlertCircle, Info, Check, RefreshCw } from 'lucide-react';

type ClientKind = 'real' | 'test';
type ClientStatus = 'lead' | 'paid' | 'installing' | 'installed' | 'failed' | 'churned';

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
}

interface Settings {
  productVersion: string;
  defaultInstallerPort: number;
  defaultInstallPath: string;
  defaultMode: 'team' | 'solo';
  skeletonRepo: string;
  operatorContactEmail: string;
}

interface GenerateResult {
  filename: string;
  script: string;
  generated: {
    at: string;
    domain: string;
    name: string;
    port: number;
    mode: 'team' | 'solo';
    installPath: string;
    adminPath: string;
    skipSecurity: boolean;
    skipNginx: boolean;
    noLanding: boolean;
    dryRun: boolean;
    tokenEmbedded: boolean;
    installerUrl: string;
  };
}

// TODO: move to Settings (operator IP) once we support multi-server deployments.
// For now this is the single production server IP that all client installs point at.
const OPERATOR_SERVER_IP = '94.176.238.108';

export function WebInstallerTab({ isMobile }: { isMobile: boolean }) {
  // ── Data sources ──
  const [clients, setClients] = useState<ClientPublic[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Form state ──
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'team' | 'solo'>('team');
  const [port, setPort] = useState('4742');
  const [installPath, setInstallPath] = useState('/var/www/iam');
  const [adminPath, setAdminPath] = useState('/iam.admin');
  const [githubToken, setGithubToken] = useState('');
  const [embedToken, setEmbedToken] = useState(false);
  const [skipSecurity, setSkipSecurity] = useState(false);
  const [skipNginx, setSkipNginx] = useState(false);
  const [noLanding, setNoLanding] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  // ── Generated result ──
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Load clients + settings on mount ──
  const loadAll = async () => {
    setLoading(true); setLoadError(null);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/admin/iam-clients-os/clients'),
        fetch('/api/admin/iam-clients-os/settings'),
      ]);
      if (!cRes.ok) throw new Error(`Clients: HTTP ${cRes.status}`);
      if (!sRes.ok) throw new Error(`Settings: HTTP ${sRes.status}`);
      const cData = await cRes.json();
      const sData = await sRes.json();
      setClients(cData.clients || []);
      setSettings(sData.settings);
      // Apply defaults from settings if nothing typed yet
      if (sData.settings) {
        if (!port || port === '4742') setPort(String(sData.settings.defaultInstallerPort || 4742));
        if (installPath === '/var/www/iam') setInstallPath(sData.settings.defaultInstallPath || '/var/www/iam');
        setMode(sData.settings.defaultMode || 'team');
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // ── Applying a selected client to the form ──
  const applyClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const c = clients.find(x => x.id === clientId);
    if (!c) return;
    setDomain(c.domain);
    setName(c.name);
    setMode(c.mode);
    setPort(String(c.port));
    setInstallPath(c.installPath);
  };

  // ── Generate ──
  const generate = async () => {
    setGenerating(true); setGenerateError(null); setResult(null);
    try {
      const payload: Record<string, unknown> = {
        domain: domain.trim(),
        name: name.trim(),
        mode,
        port: parseInt(port, 10) || undefined,
        installPath: installPath.trim(),
        adminPath: adminPath.trim(),
        skipSecurity, skipNginx, noLanding, dryRun,
      };
      if (embedToken && githubToken.trim()) {
        payload.githubToken = githubToken.trim();
      }
      if (selectedClientId) payload.clientId = selectedClientId;

      const res = await fetch('/api/admin/iam-clients-os/installer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err));
    } finally { setGenerating(false); }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.script], { type: 'application/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = result.filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => { setResult(null); setGenerateError(null); };

  // ── Warnings / hints ──
  const warnings = useMemo(() => {
    const ws: string[] = [];
    if (embedToken && githubToken.trim()) {
      ws.push('The GitHub PAT will be embedded in the generated script in plaintext. Anyone with the script file gets your token. Prefer IAM_GITHUB_TOKEN env var on the target server.');
    }
    if (port && !installPath.endsWith(port)) {
      // Not an error — just common for mistakes
    }
    return ws;
  }, [embedToken, githubToken]);

  // ── UI primitives ──
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6,
    fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
      <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading...
    </div>;
  }
  if (loadError) {
    return <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
      ❌ {loadError}
      <button onClick={loadAll} style={{ marginLeft: 10, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Retry</button>
    </div>;
  }

  const disableGenerate = !domain.trim() || !name.trim() || generating;

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: isMobile ? '1fr' : 'minmax(320px, 1fr) minmax(400px, 1fr)' }}>

      {/* ── LEFT: Form ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 4px 0' }}>Generate Installer</h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px 0' }}>
          Produces a small bootstrap.sh that downloads <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>iam-client.sh</code> and runs it with these settings.
        </p>

        {/* ── Pick existing client ── */}
        <div style={{ marginBottom: 14, padding: 10, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
          <label style={labelStyle}>Use existing client (optional)</label>
          <select
            value={selectedClientId}
            onChange={e => applyClient(e.target.value)}
            style={inputStyle}
          >
            <option value="">— start blank —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.domain} · {c.status}
              </option>
            ))}
          </select>
          {clients.length === 0 && (
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0 0' }}>
              No clients yet. Add one in the <strong>Client Projects</strong> tab first, or fill the form manually.
            </p>
          )}
        </div>

        {/* ── Basic fields ── */}
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Domain <span style={{ color: '#dc2626' }}>*</span></label>
          <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
            placeholder="acme.iamrunning.online"
            style={{ ...inputStyle, fontFamily: 'monospace' }} />
          {/* ── DNS setup hint (required before install) ── */}
          <div style={{ marginTop: 6, padding: '8px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, fontSize: 11, color: '#0c4a6e', lineHeight: 1.5 }}>
            <strong>DNS setup required before install:</strong> add an{' '}
            <code style={{ fontFamily: 'monospace', background: '#e0f2fe', padding: '0 3px', borderRadius: 2 }}>A</code>{' '}
            record for this domain pointing to{' '}
            <code style={{ fontFamily: 'monospace', background: '#e0f2fe', padding: '0 3px', borderRadius: 2 }}>{OPERATOR_SERVER_IP}</code>.
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: 'pointer', fontSize: 11, color: '#0369a1', fontWeight: 600 }}>
                Step-by-step (Namecheap / Cloudflare)
              </summary>
              <div style={{ marginTop: 8, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <strong>Namecheap:</strong> Domain List → Manage → Advanced DNS → Add New Record.
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, listStyle: 'disc', fontSize: 11 }}>
                    <li>Type: <code style={{ fontFamily: 'monospace' }}>A Record</code></li>
                    <li>Host: <code style={{ fontFamily: 'monospace' }}>&lt;subdomain&gt;</code> (only the part before <code>.iamrunning.online</code>)</li>
                    <li>Value: <code style={{ fontFamily: 'monospace' }}>{OPERATOR_SERVER_IP}</code></li>
                    <li>TTL: <code style={{ fontFamily: 'monospace' }}>Automatic</code></li>
                  </ul>
                </div>
                <div>
                  <strong>Cloudflare:</strong> DNS → Records → Add record.
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, listStyle: 'disc', fontSize: 11 }}>
                    <li>Type: <code style={{ fontFamily: 'monospace' }}>A</code></li>
                    <li>Name: <code style={{ fontFamily: 'monospace' }}>&lt;subdomain&gt;</code></li>
                    <li>IPv4 address: <code style={{ fontFamily: 'monospace' }}>{OPERATOR_SERVER_IP}</code></li>
                    <li>Proxy status: <strong style={{ color: '#b45309' }}>DNS only</strong> (grey cloud — orange cloud breaks OAuth callback &amp; certbot).</li>
                  </ul>
                </div>
                <div>
                  <strong>Verify propagation</strong> before running install:
                  <div style={{ marginTop: 2, padding: '4px 6px', background: '#0f172a', color: '#e2e8f0', borderRadius: 3, fontFamily: 'monospace', fontSize: 10 }}>
                    dig +short {domain || '<your-domain>'}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                    Should return <code style={{ fontFamily: 'monospace' }}>{OPERATOR_SERVER_IP}</code>. Propagation usually takes 1–5 minutes.
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Client name <span style={{ color: '#dc2626' }}>*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Acme Corp" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value as 'team' | 'solo')} style={inputStyle}>
              <option value="team">Team</option>
              <option value="solo">Solo</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Port</label>
            <input type="text" value={port} onChange={e => setPort(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'monospace' }} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Install path</label>
          <input type="text" value={installPath} onChange={e => setInstallPath(e.target.value)}
            style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Admin path (URL prefix)</label>
          <input type="text" value={adminPath} onChange={e => setAdminPath(e.target.value)}
            style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </div>

        {/* ── GitHub PAT ── */}
        <div style={{ padding: 10, background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a', marginBottom: 14 }}>
          <label style={{ ...labelStyle, color: '#92400e' }}>GitHub PAT (for skeleton clone)</label>
          <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)}
            placeholder="github_pat_... (Contents: Read-only)"
            style={{ ...inputStyle, fontFamily: 'monospace' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#92400e', cursor: 'pointer' }}>
            <input type="checkbox" checked={embedToken} onChange={e => setEmbedToken(e.target.checked)} />
            Embed token in generated script
          </label>
          <p style={{ fontSize: 11, color: '#92400e', margin: '6px 0 0 0', lineHeight: 1.4 }}>
            If unchecked, the bootstrap script prompts the operator for the PAT at run time, or reads
            <code style={{ fontFamily: 'monospace', fontSize: 10, padding: '0 3px' }}>IAM_GITHUB_TOKEN</code>
            from env. Safer.
          </p>
        </div>

        {/* ── Advanced flags ── */}
        <details style={{ marginBottom: 14 }}>
          <summary style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', cursor: 'pointer', padding: '4px 0' }}>Advanced options</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, paddingLeft: 8 }}>
            <Check3 checked={skipSecurity} onChange={setSkipSecurity}
              label="Skip security (UFW / fail2ban)" hint="--skip-security" />
            <Check3 checked={skipNginx} onChange={setSkipNginx}
              label="Skip nginx + certbot" hint="--skip-nginx (useful if you manage TLS elsewhere)" />
            <Check3 checked={noLanding} onChange={setNoLanding}
              label="Disable landing page" hint="--no-landing (home redirects to /dashboard)" />
            <Check3 checked={dryRun} onChange={setDryRun}
              label="Dry-run only" hint="--dry-run (no side effects, prints plan)" />
          </div>
        </details>

        {warnings.map((w, i) => (
          <div key={i} style={{ marginBottom: 10, padding: '8px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#991b1b', fontSize: 11, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ marginTop: 1 }} />
            {w}
          </div>
        ))}

        {generateError && (
          <div style={{ marginBottom: 10, padding: '8px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', fontSize: 12 }}>
            ❌ {generateError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={generate} disabled={disableGenerate}
            style={{
              padding: '10px 18px', background: disableGenerate ? '#fdb89a' : '#FF6B35',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 14, fontWeight: 700, cursor: disableGenerate ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate'}
          </button>
          {result && (
            <button onClick={reset} style={{ padding: '10px 14px', background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT: Result ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 16px 0' }}>Generated Script</h2>

        {!result && (
          <div style={{ padding: 24, background: '#f9fafb', borderRadius: 6, border: '1px dashed #e5e7eb', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            <Info className="w-5 h-5 inline-block mr-2" style={{ verticalAlign: 'middle' }} />
            Fill the form and click <strong style={{ color: '#6b7280' }}>Generate</strong>. The bootstrap script will appear here, ready to download or copy.
          </div>
        )}

        {result && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              <button onClick={download} style={{ padding: '8px 14px', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Download className="w-3.5 h-3.5" /> Download .sh
              </button>
              <button onClick={copy} style={{ padding: '8px 14px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>

            <div style={{ marginBottom: 10, fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
              <div>Filename: <code style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>{result.filename}</code></div>
              <div>Target: <code style={{ fontFamily: 'monospace' }}>{result.generated.domain}</code> · {result.generated.mode} · port {result.generated.port}</div>
              <div>Token: {result.generated.tokenEmbedded ? <span style={{ color: '#dc2626' }}>embedded in script</span> : <span style={{ color: '#065f46' }}>prompted at run time</span>}</div>
              {result.generated.dryRun && <div style={{ color: '#92400e', fontWeight: 600 }}>⚠ DRY-RUN flag set — no real install will happen.</div>}
            </div>

            <pre style={{
              margin: 0, padding: 12, background: '#0f172a', color: '#e2e8f0',
              borderRadius: 6, fontSize: 11, lineHeight: 1.5,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              maxHeight: 500, overflow: 'auto', whiteSpace: 'pre',
            }}>
              {result.script}
            </pre>

            <div style={{ marginTop: 14, padding: 12, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, fontSize: 12, color: '#14532d', lineHeight: 1.5 }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>Next steps:</strong>
              1. Confirm DNS: <code style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '0 4px', borderRadius: 2 }}>dig +short {result.generated.domain}</code> returns <code style={{ fontFamily: 'monospace' }}>{OPERATOR_SERVER_IP}</code>.<br />
              2. Download the script or copy it.<br />
              3. Transfer to the client's VPS: <code style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '0 4px', borderRadius: 2 }}>scp {result.filename} root@{result.generated.domain}:~/</code><br />
              4. Run: <code style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '0 4px', borderRadius: 2 }}>ssh root@{result.generated.domain} "bash ~/{result.filename}"</code><br />
              5. After successful install, update the client's status to <strong>installed</strong> in Client Projects.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Check3({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ marginTop: 3 }} />
      <div>
        <div style={{ fontSize: 13, color: '#374151' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{hint}</div>
      </div>
    </label>
  );
}
