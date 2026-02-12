'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  source?: 'wizard' | 'editor' | 'interactive' | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading: authLoading, isAuthenticated, canAccessEditor } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      const uid = user?.id;
      if (!uid) return;

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, updated_at, source')
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
    if (!confirm('Are you sure you want to delete this project?')) return;

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Failed to delete project:', error);
      alert('Could not delete project');
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-600 mt-1">Manage your sites and projects</p>
          </div>
        </div>

        <Button
          onClick={handleCreateNew}
          className="mb-6 bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create new project
        </Button>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">You have no projects yet</p>
            <Button
              variant="outline"
              onClick={handleCreateNew}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              Create your first project →
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {project.name || 'Untitled'}
                    </h3>
                    {project.description && (
                      <p className="text-gray-600 mb-3">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Updated:{' '}
                        {formatDistanceToNow(new Date(project.updated_at), {
                          addSuffix: true,
                          locale: locale === 'ru' ? ru : undefined,
                        })}
                      </span>
                      {project.source && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                          {project.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleEditProject(project.id)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
