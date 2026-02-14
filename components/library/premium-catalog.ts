import { hero01 } from './heroes/hero-01';
import { hero02 } from './heroes/hero-02';
import { hero03 } from './heroes/hero-03';
import { header01 } from './headers/header-01';
import { header02 } from './headers/header-02';
import { header03 } from './headers/header-03';
import { cta01 } from './ctas/cta-01';
import { cta02 } from './ctas/cta-02';
import { cta03 } from './ctas/cta-03';
import type { SupabaseComponent } from '@/lib/components/supabase-catalog';

interface PremiumComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  style: string;
  tags: string[];
  animation_preset: string;
  html: string;
  css: string;
}

const ALL_PREMIUM: PremiumComponent[] = [
  hero01, hero02, hero03,
  header01, header02, header03,
  cta01, cta02, cta03,
];

export function getPremiumComponents(): SupabaseComponent[] {
  const now = new Date().toISOString();
  return ALL_PREMIUM.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category as SupabaseComponent['category'],
    style: c.style as SupabaseComponent['style'],
    html: c.css
      ? `<style>${c.css}</style>\n${c.html}`
      : c.html,
    css: c.css || '',
    description: c.description,
    tags: c.tags as SupabaseComponent['tags'],
    animation_preset: c.animation_preset,
    is_public: true,
    usage_count: 0,
    created_at: now,
    updated_at: now,
  }));
}

export { ALL_PREMIUM };
