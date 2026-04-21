'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users, FileText, Eye, LogOut, RefreshCw, Search, Globe, Terminal,
} from 'lucide-react';
import { subscribeToProjects, unsubscribe, type ProjectUpdate } from '@/lib/supabase/realtime';
import { createSupabaseClient } from '@/lib/supabase/client';
import { generateProjectPreview, getCachedPreview } from '@/lib/utils/preview';
import { cn } from '@/lib/utils';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';
import { RunnerSVG } from '@/components/ui/RunnerSVG';

// ── Role config ────────────────────────────────────────────────────────────
// Each entry: { label, accountType, tier, color, roleNum }
const ROLE_BUTTONS = [
  { label: 'Free',       accountType: 'regular',          tier: null,           color: '#6b7280', roleNum: 1 },
  { label: 'Paid',       accountType: 'paid',             tier: null,           color: '#f59e0b', roleNum: 2 },
  { label: 'Basic',      accountType: 'freelancer',       tier: 'frontend',     color: '#3b82f6', roleNum: 3 },
  { label: 'Pro',        accountType: 'freelancer',       tier: 'full_stack',   color: '#8b5cf6', roleNum: 4 },
  { label: 'Admin',      accountType: 'freelancer',       tier: 'professional', color: '#ef4444', roleNum: 5 },
  { label: 'Agency',     accountType: 'agency_owner',     tier: null,           color: '#0ea5e9', roleNum: 6 },
  { label: 'Employee',   accountType: 'agency_employee',  tier: null,           color: '#14b8a6', roleNum: 7 },
] as const;

const ROLE_LABEL: Record<number, string> = {
  0: 'Anon', 1: 'Free', 2: 'Paid', 3: 'Basic',
  4: 'Pro', 5: 'Admin', 6: 'Agency', 7: 'Employee',
};
const ROLE_COLOR: Record<number, string> = {
  0: '#9ca3af', 1: '#6b7280', 2: '#f59e0b', 3: '#3b82f6',
  4: '#8b5cf6', 5: '#ef4444', 6: '#0ea5e9', 7: '#14b8a6',
};

// ── Types ──────────────────────────────────────────────────────────────────
interface Project {
  id: string; user_id: string; name: string; description?: string;
  data: unknown; thumbnail?: string; created_at: string; updated_at: string;
}

interface AdminUser {
  id: string; user_number?: number; email: string; full_name: string | null;
  account_type: string; freelancer_tier: string | null; role?: number;
  agency_id?: string | null; last_sign_in?: string | null; created_at: string;
}

type TabType = 'users' | 'projects';

// ── Role badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role?: number }) {
  const r = role ?? 1;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11,
      fontWeight: 700, color: '#fff', background: ROLE_COLOR[r] ?? '#6b7280',
    }}>
      {ROLE_LABEL[r] ?? `Role ${r}`}
    </span>
  );
}

// ── Role buttons row ───────────────────────────────────────────────────────
function RoleButtons({
  userId, currentRole, onUpdate, disabled,
}: {
  userId: string; currentRole?: number; onUpdate: (userId: string, accountType: string, tier: string | null) => void; disabled: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {ROLE_BUTTONS.map(({ label, accountType, tier, color, roleNum }) => {
        const isCurrent = currentRole === roleNum;
        return (
          <button
            key={label}
            onClick={() => onUpdate(userId, accountType, tier)}
            disabled={disabled || isCurrent}
            style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
              color: isCurrent ? '#fff' : '#fff',
              background: isCurrent ? color : color + 'aa',
              border: isCurrent ? `2px solid ${color}` : '2px solid transparent',
              opacity: disabled ? 0.5 : 1,
              cursor: disabled || isCurrent ? 'default' : 'pointer',
              minHeight: 32,
              transition: 'all 0.15s',
            }}
          >
            {isCurrent ? `✓ ${label}` : label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const isRTL = locale === 'he' || locale === 'ar';
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [totpInput, setTotpInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState('');
  const [initLoading, setInitLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Mobile detection via ResizeObserver approach (window.innerWidth for full-page)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('admin_session') === 'true') setIsAuthenticated(true);
      const lockUntil = sessionStorage.getItem('admin_lock_until');
      if (lockUntil && Date.now() < parseInt(lockUntil)) setIsLocked(true);
    }
    setInitLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadUsers();
    loadProjects();
    const channel = subscribeToProjects((update: ProjectUpdate) => {
      if (update.action === 'INSERT' || update.action === 'UPDATE') loadProjects();
      else if (update.action === 'DELETE') setProjects(prev => prev.filter(p => p.id !== update.id));
    });
    setRealtimeChannel(channel);
    return () => { if (channel) unsubscribe(channel); };
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (isLocked || totpInput.length !== 6) return;
    try {
      const res = await fetch('/api/admin/verify-totp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true); setError(''); setAttempts(0);
        sessionStorage.setItem('admin_session', 'true');
      } else {
        const n = attempts + 1; setAttempts(n);
        if (n >= 5) {
          setIsLocked(true);
          sessionStorage.setItem('admin_lock_until', String(Date.now() + 15 * 60 * 1000));
          setError('Too many attempts. Locked 15 min.');
        } else { setError(data.error || 'Invalid code'); }
        setTotpInput('');
      }
    } catch { setError('Connection error.'); }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_session');
    if (realtimeChannel) { unsubscribe(realtimeChannel); setRealtimeChannel(null); }
    router.push('/');
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/get-users');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setUsers(result.users || []);
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : 'Error loading users'}`);
    } finally { setUsersLoading(false); }
  };

  const loadProjects = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data } = await supabase.from('projects').select('*')
        .order('updated_at', { ascending: false }).limit(100);
      setProjects(data || []);
    } catch (err) { console.error('Failed to load projects:', err); }
  };

  const updateUserRole = async (userId: string, accountType: string, tier: string | null) => {
    setUpdating(true); setMessage('');
    try {
      const res = await fetch('/api/admin/update-user-role', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accountType, freelancerTier: tier }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setMessage('✅ Role updated');
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : 'Error'}`);
    } finally { setUpdating(false); }
  };

  const handleGeneratePreview = async (project: Project) => {
    try {
      const preview = await getCachedPreview(project.id, () => generateProjectPreview(project.data, 400, 300));
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, thumbnail: preview } : p));
    } catch (err) { console.error('Preview failed:', err); }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredProjects = projects.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q) ?? false);
  });

  // ── Login screen ──────────────────────────────────────────────────────────
  if (initLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f3f4f6', padding: 16 }} dir={isRTL ? 'rtl' : 'ltr'}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: 360 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <RunnerSVG size={32} color="#FF6B35" />
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FF6B35' }}>I AM RUNNING</div>
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Admin Panel — enter TOTP code</div>
          <input
            type="text" inputMode="numeric" placeholder="000000" maxLength={6}
            value={totpInput}
            onChange={e => setTotpInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus disabled={isLocked}
            style={{
              width: '100%', padding: '14px 0', border: '2px solid #e5e7eb', borderRadius: 8,
              textAlign: 'center', fontSize: 28, fontFamily: 'monospace', letterSpacing: '0.3em',
              outline: 'none', marginBottom: 12, boxSizing: 'border-box',
            }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button
            onClick={handleLogin} disabled={isLocked || totpInput.length !== 6}
            style={{
              width: '100%', padding: 14, borderRadius: 8, border: 'none',
              background: isLocked || totpInput.length !== 6 ? '#e5e7eb' : '#FF6B35',
              color: '#fff', fontWeight: 700, fontSize: 16, cursor: isLocked || totpInput.length !== 6 ? 'default' : 'pointer',
            }}
          >
            {isLocked ? '🔒 Locked' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  // ── Main admin UI ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '10px 16px' : '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#FF6B35' }}>IAM</span>
          {!isMobile && <span style={{ fontSize: 14, color: '#6b7280' }}>Admin Panel</span>}
          <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#d97706', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
            {users.length}u · {projects.length}p
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMobile ? (
            <>
              <button onClick={() => setShowMobileNav(!showMobileNav)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer' }}>
                {showMobileNav ? '✕' : '☰'}
              </button>
              <button onClick={handleLogout} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#ef4444' }}>
                Exit
              </button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/admin/seo`} style={{ padding: '6px 12px', background: '#f3f4f6', borderRadius: 6, fontSize: 13, textDecoration: 'none', color: '#374151' }}>SEO</Link>
              <Link href={`/${locale}/admin/dev-console`} style={{ padding: '6px 12px', background: '#f3f4f6', borderRadius: 6, fontSize: 13, textDecoration: 'none', color: '#374151' }}>Dev Console</Link>
              <Link href={`/${locale}/admin/iam-clients-os`} style={{ padding: '6px 12px', background: '#f3f4f6', borderRadius: 6, fontSize: 13, textDecoration: 'none', color: '#374151' }}>IAM Clients OS</Link>
              <button onClick={handleLogout} style={{ padding: '6px 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {isMobile && showMobileNav && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href={`/${locale}/admin/seo`} style={{ padding: '10px 14px', background: '#f3f4f6', borderRadius: 8, fontSize: 14, textDecoration: 'none', color: '#374151' }} onClick={() => setShowMobileNav(false)}>
            🌐 SEO Settings
          </Link>
          <Link href={`/${locale}/admin/dev-console`} style={{ padding: '10px 14px', background: '#f3f4f6', borderRadius: 8, fontSize: 14, textDecoration: 'none', color: '#374151' }} onClick={() => setShowMobileNav(false)}>
            💻 Dev Console
          </Link>
          <Link href={`/${locale}/admin/iam-clients-os`} style={{ padding: '10px 14px', background: '#f3f4f6', borderRadius: 8, fontSize: 14, textDecoration: 'none', color: '#374151' }} onClick={() => setShowMobileNav(false)}>
            🖥️ IAM Clients OS
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '0 16px' : '0 24px', display: 'flex', gap: 0 }}>
        {(['users', 'projects'] as TabType[]).map(tab => (
          <button
            key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: isMobile ? '12px 16px' : '14px 20px',
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: isMobile ? 13 : 14, fontWeight: 600,
              color: activeTab === tab ? '#FF6B35' : '#6b7280',
              borderBottom: activeTab === tab ? '2px solid #FF6B35' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab === 'users' ? '👥' : '📁'} {tab === 'users' ? `Users (${users.length})` : `Projects (${projects.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? 12 : 24, maxWidth: 1400, margin: '0 auto' }}>

        {/* Status message */}
        {message && (
          <div style={{
            padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 600,
            background: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
            color: message.startsWith('✅') ? '#15803d' : '#dc2626',
            border: `1px solid ${message.startsWith('✅') ? '#86efac' : '#fca5a5'}`,
          }}>
            {message}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div>
            {/* Search + refresh */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text" placeholder="Search by email or name..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
              <button onClick={loadUsers} disabled={usersLoading} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                {usersLoading ? '...' : '↻'}
              </button>
            </div>

            {usersLoading && <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading users...</div>}

            {!usersLoading && filteredUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>No users found</div>
            )}

            {/* Mobile: cards */}
            {!usersLoading && isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredUsers.map(user => (
                  <div key={user.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', wordBreak: 'break-all' }}>{user.email}</div>
                        {user.full_name && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{user.full_name}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <RoleBadge role={user.role} />
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>#{user.user_number ?? '-'}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                      {user.last_sign_in && (
                        <span style={{ marginLeft: 8 }}>
                          · Last seen: {new Date(user.last_sign_in).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <RoleButtons userId={user.id} currentRole={user.role} onUpdate={updateUserRole} disabled={updating} />
                  </div>
                ))}
              </div>
            )}

            {/* Desktop: table */}
            {!usersLoading && !isMobile && (
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {['#', 'Email', 'Name', 'Role', 'Joined', 'Last seen', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, i) => (
                      <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#9ca3af' }}>{user.user_number ?? '-'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#111' }}>{user.email}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{user.full_name || '—'}</td>
                        <td style={{ padding: '10px 14px' }}><RoleBadge role={user.role} /></td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#9ca3af' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#9ca3af' }}>{user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <RoleButtons userId={user.id} currentRole={user.role} onUpdate={updateUserRole} disabled={updating} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PROJECTS TAB ── */}
        {activeTab === 'projects' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text" placeholder="Search projects..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
              <button onClick={loadProjects} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>↻</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {filteredProjects.map(project => (
                <div key={project.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '16/9', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {project.thumbnail
                      ? <img src={project.thumbnail} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (
                        <button onClick={() => handleGeneratePreview(project)} style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>
                          Generate Preview
                        </button>
                      )
                    }
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{project.name}</div>
                    {project.description && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{project.description}</div>}
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(project.updated_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>No projects found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
