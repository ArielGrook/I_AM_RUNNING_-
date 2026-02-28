import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SiteRenderer } from '../SiteRenderer';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string; page: string }>;
};

export default async function SitePageRoute({ params }: Props) {
  const { slug, page } = await params;
  if (!slug) return notFound();

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !project) return notFound();

  return <SiteRenderer project={project} initialPageSlug={page} />;
}
