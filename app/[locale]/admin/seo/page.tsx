'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function AdminSeoPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<SeoSettings>(DEFAULTS);

  // Mobile
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const hasSession = typeof window !== 'undefined' && sessionStorage.getItem('admin_session');
    if (!hasSession) {
      router.replace(`/${locale}/admin`);
      return;
    }
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
    load();
  }, [locale, router]);

  // Mobile detection
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsMobile(el.getBoundingClientRect().width < 768);
    check();
    const observer = new ResizeObserver(([e]) => setIsMobile(e.contentRect.width < 768));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const hasSession = typeof window !== 'undefined' && sessionStorage.getItem('admin_session');
  if (!hasSession) {
    return null;
  }

  if (loading) {
    return (
      <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex min-h-screen bg-gray-50">
      {!isMobile && (
        <aside className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
          <div className="p-6">
            <Link
              href={`/${locale}/admin`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors mb-4 inline-flex w-fit"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Admin</span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">SEO Settings</h2>
          </div>
        </aside>
      )}

      <main className={`flex-1 ${isMobile ? 'p-4' : 'ml-64 p-8'}`}>
        {isMobile && (
          <div className="mb-6">
            <Link
              href={`/${locale}/admin`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors inline-flex w-fit"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Admin</span>
            </Link>
          </div>
        )}
        <div className={isMobile ? 'w-full' : 'max-w-2xl'}>
          <h1 className={`font-bold text-gray-900 mb-6 ${isMobile ? 'text-xl' : 'text-2xl'}`}>SEO Metadata</h1>

          <p className="text-sm text-gray-500 mb-4">
            To save changes, you must be logged in to the site with marcenko.artiom@gmail.com (RLS policy).
          </p>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700 text-sm">
              Settings saved successfully.
            </div>
          )}

          <div className={`space-y-6 bg-white rounded-xl border border-gray-200 ${isMobile ? 'p-4' : 'p-8'}`}>
            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                Meta Title
              </label>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">60 chars recommended</span>
                <span className={form.meta_title.length > 60 ? 'text-red-400 text-sm' : 'text-gray-400 text-sm'}>
                  {form.meta_title.length}/60
                </span>
              </div>
              <input
                type="text"
                value={form.meta_title}
                onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                maxLength={120}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="I AM RUNNING — Website Builder"
              />
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                Meta Description
              </label>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">160 chars recommended</span>
                <span className={form.meta_description.length > 160 ? 'text-red-400 text-sm' : 'text-gray-400 text-sm'}>
                  {form.meta_description.length}/160
                </span>
              </div>
              <textarea
                value={form.meta_description}
                onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                rows={3}
                maxLength={320}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Create professional websites in minutes. No code required."
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                Keywords
              </label>
              <input
                type="text"
                value={form.meta_keywords}
                onChange={(e) => setForm((f) => ({ ...f, meta_keywords: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="website builder, landing page, no-code, saas"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated keywords</p>
            </div>

            {/* OG Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                OG Title
              </label>
              <input
                type="text"
                value={form.og_title}
                onChange={(e) => setForm((f) => ({ ...f, og_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="I AM RUNNING — Website Builder"
              />
            </div>

            {/* OG Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                OG Description
              </label>
              <textarea
                value={form.og_description}
                onChange={(e) => setForm((f) => ({ ...f, og_description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Create professional websites in minutes."
              />
            </div>

            {/* OG Image URL */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                OG Image URL
              </label>
              <input
                type="url"
                value={form.og_image}
                onChange={(e) => setForm((f) => ({ ...f, og_image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://iamrunning.online/og-image.png"
              />
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                Canonical URL
              </label>
              <input
                type="url"
                value={form.canonical_url}
                onChange={(e) => setForm((f) => ({ ...f, canonical_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://iamrunning.online"
              />
            </div>

            {/* Google Analytics ID */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">
                Google Analytics ID
              </label>
              <input
                type="text"
                value={form.google_analytics_id}
                onChange={(e) => setForm((f) => ({ ...f, google_analytics_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-lg font-medium transition-colors ${isMobile ? 'py-3 text-base' : 'py-3'}`}
              style={isMobile ? { minHeight: '48px' } : undefined}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
