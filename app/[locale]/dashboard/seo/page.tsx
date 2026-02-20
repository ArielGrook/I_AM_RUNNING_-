'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface SeoSettings {
  id?: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical_url: string;
  google_analytics_id: string;
}

const DEFAULTS: SeoSettings = {
  meta_title: 'I AM RUNNING — Website Builder',
  meta_description: 'Create professional websites in minutes. No code required.',
  meta_keywords: 'website builder, landing page, no-code, saas',
  og_title: 'I AM RUNNING — Website Builder',
  og_description: 'Create professional websites in minutes.',
  og_image: '',
  canonical_url: 'https://iamrunning.online',
  google_analytics_id: '',
};

export default function SeoPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading: authLoading, isAuthenticated, canAccessEditor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<SeoSettings>(DEFAULTS);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseClient();
      const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      if (data) {
        setForm({
          meta_title: data.meta_title ?? DEFAULTS.meta_title,
          meta_description: data.meta_description ?? DEFAULTS.meta_description,
          meta_keywords: data.meta_keywords ?? DEFAULTS.meta_keywords,
          og_title: data.og_title ?? DEFAULTS.og_title,
          og_description: data.og_description ?? DEFAULTS.og_description,
          og_image: data.og_image ?? '',
          canonical_url: data.canonical_url ?? DEFAULTS.canonical_url,
          google_analytics_id: data.google_analytics_id ?? '',
        });
        if (data.id) setForm((f) => ({ ...f, id: data.id }));
      }
      setLoading(false);
    }
    if (!authLoading) load();
  }, [authLoading]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    const supabase = createSupabaseClient();

    const payload = {
      meta_title: form.meta_title,
      meta_description: form.meta_description,
      meta_keywords: form.meta_keywords,
      og_title: form.og_title,
      og_description: form.og_description,
      og_image: form.og_image,
      canonical_url: form.canonical_url,
      google_analytics_id: form.google_analytics_id,
      updated_at: new Date().toISOString(),
    };

    if (form.id) {
      const { error: err } = await supabase
        .from('site_settings')
        .update(payload)
        .eq('id', form.id);
      if (err) {
        setError(err.message);
      } else {
        setSuccess(true);
      }
    } else {
      const { data, error: err } = await supabase.from('site_settings').insert(payload).select('id').single();
      if (err) {
        setError(err.message);
      } else if (data?.id) {
        setForm((f) => ({ ...f, id: data.id }));
        setSuccess(true);
      }
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="text-xl text-gray-600 dark:text-[#e5e5e5]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push(`/${locale}/auth/login?redirect=/${locale}/dashboard/seo`);
    return null;
  }

  if (!canAccessEditor) {
    router.push(`/${locale}/subscription?reason=editor_access`);
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#1a1a1a]">
      <aside className="w-64 bg-white dark:bg-[#2d2d2d] border-r border-gray-200 dark:border-[#404040] fixed h-full flex flex-col">
        <div className="p-6">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#e55a28] text-white rounded-lg font-medium transition-colors mb-4 inline-flex w-fit"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#e5e5e5]">SEO Settings</h2>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#e5e5e5] mb-6">SEO Metadata</h1>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
              Settings saved successfully.
            </div>
          )}

          <div className="space-y-6 bg-white dark:bg-[#2d2d2d] rounded-xl p-8 border border-gray-200 dark:border-[#404040]">
            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-[#e5e5e5]">
                Meta Title
              </label>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500 dark:text-[#9ca3af]">60 chars recommended</span>
                <span className={form.meta_title.length > 60 ? 'text-red-400 text-sm' : 'text-gray-400 text-sm'}>
                  {form.meta_title.length}/60
                </span>
              </div>
              <input
                type="text"
                value={form.meta_title}
                onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                maxLength={120}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="I AM RUNNING — Website Builder"
              />
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-[#e5e5e5]">
                Meta Description
              </label>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500 dark:text-[#9ca3af]">160 chars recommended</span>
                <span className={form.meta_description.length > 160 ? 'text-red-400 text-sm' : 'text-gray-400 text-sm'}>
                  {form.meta_description.length}/160
                </span>
              </div>
              <textarea
                value={form.meta_description}
                onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                rows={3}
                maxLength={320}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="Create professional websites in minutes. No code required."
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-[#e5e5e5]">
                Keywords
              </label>
              <input
                type="text"
                value={form.meta_keywords}
                onChange={(e) => setForm((f) => ({ ...f, meta_keywords: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="website builder, landing page, no-code, saas"
              />
              <p className="text-xs text-gray-500 dark:text-[#9ca3af] mt-1">Comma-separated keywords</p>
            </div>

            {/* OG Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-[#e5e5e5]">
                OG Title
              </label>
              <input
                type="text"
                value={form.og_title}
                onChange={(e) => setForm((f) => ({ ...f, og_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="I AM RUNNING — Website Builder"
              />
            </div>

            {/* OG Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-[#e5e5e5]">
                OG Description
              </label>
              <textarea
                value={form.og_description}
                onChange={(e) => setForm((f) => ({ ...f, og_description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="Create professional websites in minutes."
              />
            </div>

            {/* OG Image URL */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-[#e5e5e5]">
                OG Image URL
              </label>
              <input
                type="url"
                value={form.og_image}
                onChange={(e) => setForm((f) => ({ ...f, og_image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="https://iamrunning.online/og-image.png"
              />
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-[#e5e5e5]">
                Canonical URL
              </label>
              <input
                type="url"
                value={form.canonical_url}
                onChange={(e) => setForm((f) => ({ ...f, canonical_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="https://iamrunning.online"
              />
            </div>

            {/* Google Analytics ID */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-[#e5e5e5]">
                Google Analytics ID
              </label>
              <input
                type="text"
                value={form.google_analytics_id}
                onChange={(e) => setForm((f) => ({ ...f, google_analytics_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#404040] rounded-lg bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-3 bg-[#FF6B35] hover:bg-[#e55a28] disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
