/**
 * Phase 1 PoC: Minimal Puck editor with save/load to Supabase.
 * Route: /[locale]/editor-puck?id=<projectId>
 */

'use client';

import '@puckeditor/core/puck.css';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/hooks/useAuth';
import { loadProjectFromSupabase, saveProjectToSupabase } from '@/lib/store/supabase-sync';
import { puckConfig } from '@/lib/editor/puck-config';
import { ArrowLeft } from 'lucide-react';

const Puck = dynamic(
  () => import('@puckeditor/core').then((mod) => mod.Puck),
  { ssr: false, loading: () => <div className="p-8 text-center text-gray-500">Loading Puck...</div> }
);

export default function EditorPuckPage() {
  const locale = useRouter().locale ?? 'en';
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  const { isAuthenticated, loading: authLoading, canAccessEditor } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<{
    id: string;
    name: string;
    projectData: Record<string, unknown>;
    version?: number;
  } | null>(null);
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push(`/${locale}/auth/login?redirect=/${locale}/editor-puck${projectId ? `?id=${projectId}` : ''}`);
      return;
    }
    if (!canAccessEditor && !authLoading) {
      router.push(`/${locale}/subscription?reason=editor_access`);
      return;
    }
    if (!projectId) {
      setError('Missing project id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const loaded = await loadProjectFromSupabase(projectId);
      if (cancelled) return;
      if (!loaded) {
        setError('Project not found');
        setLoading(false);
        return;
      }
      setProject({
        id: loaded.id,
        name: loaded.name,
        projectData: loaded.projectData as Record<string, unknown>,
        version: loaded.version,
      });
      const data = (loaded.projectData as Record<string, unknown>)?.puck;
      setInitialData(typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {});
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, isAuthenticated, authLoading, canAccessEditor, router, locale]);

  const handlePublish = useCallback(
    async (data: Record<string, unknown>) => {
      if (!project) return;
      const result = await saveProjectToSupabase(
        { id: project.id, name: project.name, description: '', pages: [], metadata: {} },
        null,
        { puck: data },
        null,
        project.version ?? 0
      );
      if (result.error) {
        console.error('Puck save failed:', result.error);
      }
    },
    [project]
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Puck editor...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error ?? 'Project not found'}</p>
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 text-[#FF6B35] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#2d2d2d]">
      <header className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-[#404040] shrink-0">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-[#FF6B35]"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="font-semibold text-gray-900 dark:text-white">{project.name}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">(Puck PoC)</span>
      </header>
      <main className="flex-1 min-h-0 puck-editor-wrap">
        <Puck
          config={puckConfig}
          data={initialData}
          onPublish={handlePublish}
        />
      </main>
    </div>
  );
}
