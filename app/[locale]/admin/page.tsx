/**
 * Admin Panel Page
 *
 * Shadow mode admin interface with user management and project monitoring.
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  FileText,
  Eye,
  LogOut,
  RefreshCw,
  Search,
  Globe,
  Terminal,
} from 'lucide-react';
import { subscribeToProjects, unsubscribe, type ProjectUpdate } from '@/lib/supabase/realtime';
import { createSupabaseClient } from '@/lib/supabase/client';
import { generateProjectPreview, getCachedPreview } from '@/lib/utils/preview';
import { cn } from '@/lib/utils';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';

interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  data: unknown;
  thumbnail?: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  user_number?: number;
  email: string;
  full_name: string | null;
  account_type: 'regular' | 'freelancer';
  freelancer_tier: 'frontend' | 'full_stack' | 'professional' | null;
  created_at: string;
}

type TabType = 'users' | 'projects';

export default function AdminPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const isRTL = locale === 'he' || locale === 'ar';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [initLoading, setInitLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    setInitLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
      loadProjects();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const channel = subscribeToProjects((update) => {
        handleRealtimeUpdate(update);
      });
      setRealtimeChannel(channel);
      return () => {
        if (channel) unsubscribe(channel);
      };
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (loginInput === 'admin' && passwordInput === 'super.admin') {
      setIsAuthenticated(true);
      setError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_session', 'true');
      }
    } else {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_session');
    }
    setLoginInput('');
    setPasswordInput('');
    setError('');
    setMessage('');
    if (realtimeChannel) {
      unsubscribe(realtimeChannel);
      setRealtimeChannel(null);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/get-users');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load users');
      }

      setUsers(result.users || []);
    } catch (err) {
      setMessage(`❌ Error loading users: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (projectsError) throw projectsError;
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const updateUserRole = async (
    userId: string,
    accountType: 'regular' | 'freelancer',
    tier: 'frontend' | 'full_stack' | 'professional' | null
  ) => {
    setUpdating(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accountType, freelancerTier: tier }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      setMessage('✅ User updated successfully');
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRealtimeUpdate = (update: ProjectUpdate) => {
    if (update.action === 'INSERT' || update.action === 'UPDATE') {
      loadProjects();
    } else if (update.action === 'DELETE') {
      setProjects((prev) => prev.filter((p) => p.id !== update.id));
    }
  };

  const handleGeneratePreview = async (project: Project) => {
    try {
      const preview = await getCachedPreview(
        project.id,
        () => generateProjectPreview(project.data, 400, 300)
      );
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, thumbnail: preview } : p))
      );
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjects = projects.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  if (initLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gray-100"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          <input
            type="text"
            placeholder="Login"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />
          <input
            type="password"
            placeholder="Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Eye className="w-6 h-6" />
            <h1 className="text-2xl font-bold">{t('title')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">admin</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <aside className="hidden sm:block w-64 bg-white border-r p-4">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('stats')}
              </h2>
              <div className="text-sm space-y-1">
                <div>{t('totalProjects')}: {projects.length}</div>
                <div>{t('totalUsers')}: {users.length}</div>
              </div>
            </div>
            <div>
              <Link
                href={`/${locale}/admin/seo`}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium"
              >
                <Globe className="w-4 h-4" />
                SEO Settings
              </Link>
              <Link
                href={`/${locale}/admin/dev-console`}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium"
              >
                <Terminal className="w-4 h-4" />
                Dev Console
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('users')}
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeTab === 'projects' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('projects')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Projects
            </Button>
          </div>

          {message && (
            <div
              className={cn(
                'mb-4 p-4 rounded',
                message.startsWith('✅')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}
            >
              {message}
            </div>
          )}

          {activeTab === 'users' && (
            <>
              <div className="mb-4 flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <Button variant="outline" size="sm" onClick={loadUsers} disabled={usersLoading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('refresh')}
                </Button>
              </div>

              {usersLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              )}

              {!usersLoading && (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border text-left">#</th>
                        <th className="px-4 py-2 border text-left">Email</th>
                        <th className="px-4 py-2 border text-left">Name</th>
                        <th className="px-4 py-2 border text-left">Account Type</th>
                        <th className="px-4 py-2 border text-left">Tier</th>
                        <th className="px-4 py-2 border text-left">Created</th>
                        <th className="px-4 py-2 border text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border text-sm">
                            {user.user_number ?? '-'}
                          </td>
                          <td className="px-4 py-2 border text-sm">{user.email}</td>
                          <td className="px-4 py-2 border text-sm">
                            {user.full_name || '-'}
                          </td>
                          <td className="px-4 py-2 border">
                            <span
                              className={cn(
                                'px-2 py-1 rounded text-xs',
                                user.account_type === 'freelancer'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              )}
                            >
                              {user.account_type}
                            </span>
                          </td>
                          <td className="px-4 py-2 border text-sm">
                            {user.freelancer_tier || '-'}
                          </td>
                          <td className="px-4 py-2 border text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 border">
                            <div className="flex gap-1 flex-wrap">
                              <button
                                onClick={() => updateUserRole(user.id, 'regular', null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 disabled:opacity-50"
                                disabled={updating}
                              >
                                Regular
                              </button>
                              <button
                                onClick={() =>
                                  updateUserRole(user.id, 'freelancer', 'frontend')
                                }
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                                disabled={updating}
                              >
                                Frontend
                              </button>
                              <button
                                onClick={() =>
                                  updateUserRole(user.id, 'freelancer', 'full_stack')
                                }
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                disabled={updating}
                              >
                                Full Stack
                              </button>
                              <button
                                onClick={() =>
                                  updateUserRole(user.id, 'freelancer', 'professional')
                                }
                                className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50"
                                disabled={updating}
                              >
                                Pro
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!usersLoading && filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">No users found</div>
              )}
            </>
          )}

          {activeTab === 'projects' && (
            <>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('searchProjects')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={loadProjects}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('refresh')}
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg border p-4 hover:shadow-md transition"
                    >
                      <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-2" />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGeneratePreview(project)}
                            >
                              {t('generatePreview')}
                            </Button>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{project.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {project.description || t('noDescription')}
                      </p>
                      <div className="text-xs text-gray-400">
                        {new Date(project.updated_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
