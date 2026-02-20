-- SEO site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_title TEXT DEFAULT 'I AM RUNNING — Website Builder',
  meta_description TEXT DEFAULT 'Create professional websites in minutes. No code required.',
  meta_keywords TEXT DEFAULT 'website builder, landing page, no-code, saas',
  og_title TEXT DEFAULT 'I AM RUNNING — Website Builder',
  og_description TEXT DEFAULT 'Create professional websites in minutes.',
  og_image TEXT DEFAULT '',
  twitter_card TEXT DEFAULT 'summary_large_image',
  canonical_url TEXT DEFAULT 'https://iamrunning.online',
  google_analytics_id TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert one row with defaults (only if empty)
INSERT INTO site_settings (id, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, twitter_card, canonical_url, google_analytics_id, updated_at)
SELECT gen_random_uuid(), 'I AM RUNNING — Website Builder', 'Create professional websites in minutes. No code required.', 'website builder, landing page, no-code, saas', 'I AM RUNNING — Website Builder', 'Create professional websites in minutes.', '', 'summary_large_image', 'https://iamrunning.online', '', now()
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- RLS: only admin can edit
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON site_settings;
DROP POLICY IF EXISTS "Admin write" ON site_settings;
CREATE POLICY "Public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admin write" ON site_settings FOR ALL
  USING (auth.jwt() ->> 'email' = 'marcenko.artiom@gmail.com');
