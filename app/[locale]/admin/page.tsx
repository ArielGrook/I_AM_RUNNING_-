/**
 * Admin Panel Page
 * 
 * Shadow mode admin interface with real-time monitoring.
 * 
 * Stage 3 Module 8: Shadow Mode
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { subscribeToProjects, unsubscribe, type ProjectUpdate } from '@/lib/supabase/realtime';
import { createSupabaseClient } from '@/lib/supabase/client';
import { generateProjectPreview, getCachedPreview } from '@/lib/utils/preview';
import { cn } from '@/lib/utils';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  email?: string;
  full_name?: string;
  company?: string;
  created_at: string;
}

export default function AdminPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const isRTL = locale === 'he' || locale === 'ar';
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Subscribe to realtime updates when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const channel = subscribeToProjects((update) => {
        handleRealtimeUpdate(update);
      });
      setRealtimeChannel(channel);

      return () => {
        if (channel) {
          unsubscribe(channel);
        }
      };
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (loginInput === 'admin' && passwordInput === 'super.admin') {
      setIsAuthenticated(true);
      setError('');
      loadData();
    } else {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginInput('');
    setPasswordInput('');
    setError('');
    if (realtimeChannel) {
      unsubscribe(realtimeChannel);
      setRealtimeChannel(null);
    }
  };

  const loadData = async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load users from users table (Roadmap v4.0)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, company, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleRealtimeUpdate = (update: ProjectUpdate) => {
    if (update.action === 'INSERT' || update.action === 'UPDATE') {
      // Reload projects to get latest data
      loadData();
    } else if (update.action === 'DELETE') {
      setProjects(prev => prev.filter(p => p.id !== update.id));
    }
  };

  const handleGeneratePreview = async (project: Project) => {
    try {
      const preview = await getCachedPreview(
        project.id,
        () => generateProjectPreview(project.data, 400, 300)
      );
      
      // Update project with preview
      setProjects(prev =>
        prev.map(p =>
          p.id === project.id ? { ...p, thumbnail: preview } : p
        )
      );
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (selectedUserId && p.user_id !== selectedUserId) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
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

          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}

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
      {/* Header */}
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
        {/* Sidebar */}
        <aside className="hidden sm:block w-64 bg-white border-r p-4">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('users')}
              </h2>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className={cn(
                      'w-full text-left px-2 py-1 rounded text-sm',
                      !selectedUserId ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                    )}
                  >
                    {t('allUsers')}
                  </button>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded text-sm truncate',
                        selectedUserId === u.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                      )}
                      title={u.email || u.id}
                    >
                      {u.email || u.full_name || `${u.id.substring(0, 8)}...`}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

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
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
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
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('refresh')}
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
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
        </main>
      </div>
    </div>
  );
}








