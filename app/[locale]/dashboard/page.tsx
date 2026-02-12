'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS, he } from 'date-fns/locale';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  source?: 'wizard' | 'editor' | 'interactive' | null;
  status?: string | null;
  tags?: string[];
  category?: string;
  visibility?: 'private' | 'public' | 'unlisted';
  version?: number;
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const dateLocale = locale === 'ru' ? ru : locale === 'he' ? he : enUS;
  const { user, loading: authLoading, isAuthenticated, canAccessEditor } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [darkMode, setDarkMode] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTags, setEditTags] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editVisibility, setEditVisibility] = useState<'private' | 'public' | 'unlisted'>('private');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', next.toString());
    }
  };

  useEffect(() => {
    async function loadProjects() {
      const uid = user?.id;
      if (!uid) return;

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, updated_at, source, status, tags, category, visibility, version')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to load projects:', error);
      } else {
        setProjects((data as Project[]) || []);
      }

      setLoading(false);
    }

    if (!authLoading && user) {
      loadProjects();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleCreateNew = async () => {
    const uid = user?.id ?? (user as { id?: string })?.id;
    if (!uid) return;

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: uid,
        name: `New project ${new Date().toLocaleDateString()}`,
        description: '',
        data: { pages: [{ component: '', styles: [] }] },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create project:', error);
      return;
    }

    router.push(`/${locale}/editor?id=${data.id}`);
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/${locale}/editor?id=${projectId}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Failed to delete project:', error);
      alert(t('deleteError'));
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setEditTags(project.tags?.join(', ') || '');
    setEditCategory(project.category || 'general');
    setEditVisibility(project.visibility || 'private');
  };

  const handleUpdateMetadata = async () => {
    if (!editingProject) return;

    const tags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('projects')
      .update({
        tags,
        category: editCategory,
        visibility: editVisibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingProject.id);

    if (!error) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? { ...p, tags, category: editCategory, visibility: editVisibility }
            : p
        )
      );
      setEditingProject(null);
    } else {
      console.error('Failed to update metadata:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="text-xl text-gray-600 dark:text-[#e5e5e5]">{t('loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push(`/${locale}/auth/login?redirect=/${locale}/dashboard`);
    return null;
  }

  if (!canAccessEditor) {
    router.push(`/${locale}/subscription?reason=editor_access`);
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#1a1a1a]">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#2d2d2d] border-r border-gray-200 dark:border-[#404040] fixed h-full flex flex-col">
        <div className="p-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#e55a28] text-white rounded-lg font-medium transition-colors mb-4 inline-flex w-fit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{t('backHome')}</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#e5e5e5] mb-8">{t('title')}</h2>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                activeTab === 'projects'
                  ? 'bg-orange-50 dark:bg-[#3a3a3a] text-orange-600 dark:text-orange-400'
                  : 'text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <span className="font-medium">{t('tabs.projects')}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                activeTab === 'settings'
                  ? 'bg-orange-50 dark:bg-[#3a3a3a] text-orange-600 dark:text-orange-400'
                  : 'text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">{t('tabs.settings')}</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                activeTab === 'billing'
                  ? 'bg-orange-50 dark:bg-[#3a3a3a] text-orange-600 dark:text-orange-400'
                  : 'text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="font-medium">{t('tabs.billing')}</span>
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                activeTab === 'help'
                  ? 'bg-orange-50 dark:bg-[#3a3a3a] text-orange-600 dark:text-orange-400'
                  : 'text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{t('tabs.help')}</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-full text-left px-4 py-3 rounded-lg text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors flex items-center gap-3"
            >
              {darkMode ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span className="font-medium">{darkMode ? t('theme.light') : t('theme.dark')}</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200 dark:border-[#404040]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-[#e5e5e5] truncate">
                {user?.email ?? ''}
              </p>
              <p className="text-xs text-gray-500 dark:text-[#9ca3af]">{t('freelancer')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {activeTab === 'projects' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-[#2d2d2d] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-[#404040]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1 font-medium">{t('totalProjects')}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-[#e5e5e5]">{projects.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-[#3a3a3a] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#2d2d2d] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-[#404040]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1 font-medium">{t('lastUpdated')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-[#e5e5e5]">
                      {projects.length > 0
                        ? formatDistanceToNow(new Date(projects[0].updated_at), { addSuffix: true, locale: dateLocale })
                        : t('noProjects')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-[#3a3a3a] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#2d2d2d] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-[#404040]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1 font-medium">{t('activeProjects')}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-[#e5e5e5]">
                      {projects.filter((p) => p.status === 'draft' || !p.status).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-[#3a3a3a] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Grid - Create New card always first, no separate empty state */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* New Project Card - always visible */}
              <button
                onClick={handleCreateNew}
                className="group relative bg-gradient-to-br from-orange-50 to-orange-100 dark:from-[#2d2d2d] dark:to-[#3a3a3a] border-2 border-dashed border-orange-300 dark:border-[#404040] rounded-xl p-8 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-lg min-h-[280px] flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 bg-orange-100 dark:bg-[#3a3a3a] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e5e5e5] mb-2">{t('createNew')}</h3>
                <p className="text-sm text-gray-600 dark:text-[#9ca3af] text-center">
                  {t('createNewHint')}
                </p>
              </button>

              {/* Project Cards */}
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-white dark:bg-[#2d2d2d] rounded-xl shadow-sm border border-gray-200 dark:border-[#404040] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="h-32 bg-gradient-to-br from-orange-400 to-orange-600 dark:from-[#3a3a3a] dark:to-[#4a4a4a] relative">
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          project.source === 'wizard'
                            ? 'bg-green-100 dark:bg-[#3a3a3a] text-green-800 dark:text-green-400'
                            : project.source === 'editor'
                              ? 'bg-orange-100 dark:bg-[#3a3a3a] text-orange-800 dark:text-orange-400'
                              : 'bg-gray-100 dark:bg-[#3a3a3a] text-gray-800 dark:text-[#9ca3af]'
                        }`}
                      >
                        {project.source === 'wizard' ? t('source.wizard') : project.source === 'editor' ? t('source.editor') : t('source.interactive')}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e5e5e5] mb-2 line-clamp-2">
                      {project.name || t('untitled')}
                    </h3>

                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-[#9ca3af] mb-3 line-clamp-2">{project.description}</p>
                    )}

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs font-medium rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Category + Version row */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#9ca3af] mb-2">
                      {project.category && project.category !== 'general' && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#3a3a3a]">
                          {t(`categories.${project.category}`)}
                        </span>
                      )}
                      <span>v{project.version || 1}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#9ca3af] mb-4">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProject(project.id)}
                        className="flex-1 px-4 py-2 bg-[#FF6B35] hover:bg-[#e55a28] text-white rounded-lg font-medium transition-colors"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => openEditModal(project)}
                        className="px-3 py-2 bg-gray-100 dark:bg-[#3a3a3a] hover:bg-gray-200 dark:hover:bg-[#4a4a4a] text-gray-600 dark:text-[#9ca3af] rounded-lg transition-colors"
                        aria-label={t('settings')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        aria-label={t('delete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#e5e5e5] mb-6">{t('tabs.settings')}</h2>
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl p-8 border border-gray-200 dark:border-[#404040]">
              <p className="text-gray-600 dark:text-[#9ca3af]">{t('placeholders.settings')}</p>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#e5e5e5] mb-6">{t('tabs.billing')}</h2>
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl p-8 border border-gray-200 dark:border-[#404040]">
              <p className="text-gray-600 dark:text-[#9ca3af]">{t('placeholders.billing')}</p>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#e5e5e5] mb-6">{t('tabs.help')}</h2>
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl p-8 border border-gray-200 dark:border-[#404040]">
              <p className="text-gray-600 dark:text-[#9ca3af]">{t('placeholders.help')}</p>
            </div>
          </div>
        )}
      </main>

      {/* Metadata Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#404040]">
            <h3 className="text-xl font-bold text-gray-900 dark:text-[#e5e5e5] mb-6">{t('settings')}</h3>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-orange-600 dark:text-orange-400">
                {t('meta.tags')}
              </label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full px-3 py-2 border border-orange-300 dark:border-[#FF6B35] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="landing, business, portfolio"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-orange-600 dark:text-orange-400">
                {t('meta.category')}
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border border-orange-300 dark:border-[#FF6B35] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="general">{t('categories.general')}</option>
                <option value="business">{t('categories.business')}</option>
                <option value="portfolio">{t('categories.portfolio')}</option>
                <option value="ecommerce">{t('categories.ecommerce')}</option>
                <option value="blog">{t('categories.blog')}</option>
              </select>
            </div>

            {/* Visibility */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-orange-600 dark:text-orange-400">
                {t('meta.visibility')}
              </label>
              <select
                value={editVisibility}
                onChange={(e) => setEditVisibility(e.target.value as 'private' | 'public' | 'unlisted')}
                className="w-full px-3 py-2 border border-orange-300 dark:border-[#FF6B35] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="private">{t('visibility.private')}</option>
                <option value="unlisted">{t('visibility.unlisted')}</option>
                <option value="public">{t('visibility.public')}</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateMetadata}
                className="flex-1 px-4 py-2.5 bg-[#FF6B35] hover:bg-[#e55a28] text-white rounded-lg font-medium transition-colors"
              >
                {t('save')}
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2.5 bg-gray-200 dark:bg-[#3a3a3a] hover:bg-gray-300 dark:hover:bg-[#4a4a4a] text-gray-700 dark:text-[#e5e5e5] rounded-lg font-medium transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
