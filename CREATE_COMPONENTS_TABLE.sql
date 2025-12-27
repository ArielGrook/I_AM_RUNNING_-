-- ============================================================================
-- CREATE COMPONENTS TABLE FOR I AM RUNNING
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Project: https://iamrunning.online
-- Table: components
-- ============================================================================

-- 1. CREATE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom')),
  style TEXT CHECK (style IN ('minimal', 'modern', 'classic', 'bold', 'elegant', 'playful')),
  html TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT, -- Base64 or URL
  tags TEXT[], -- Array of tags for search
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system components
  is_public BOOLEAN DEFAULT false, -- Public components visible to all
  usage_count INTEGER DEFAULT 0, -- Track popularity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_style ON components(style);
CREATE INDEX IF NOT EXISTS idx_components_user_id ON components(user_id);
CREATE INDEX IF NOT EXISTS idx_components_public ON components(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_components_tags ON components USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_components_created_at ON components(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Policy: Anyone can read public components, users can read their own
CREATE POLICY "Public components are viewable by everyone"
  ON components FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Policy: Users can insert their own components
CREATE POLICY "Users can insert their own components"
  ON components FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own components
CREATE POLICY "Users can update their own components"
  ON components FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own components
CREATE POLICY "Users can delete their own components"
  ON components FOR DELETE
  USING (auth.uid() = user_id);

-- 5. CREATE HELPER FUNCTION FOR UPDATED_AT TIMESTAMP
-- ============================================================================
CREATE OR REPLACE FUNCTION update_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE TRIGGER TO AUTO-UPDATE UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_components_updated_at
  BEFORE UPDATE ON components
  FOR EACH ROW
  EXECUTE FUNCTION update_components_updated_at();

-- 7. CREATE FUNCTION TO INCREMENT USAGE COUNT
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_component_usage(component_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE components
  SET usage_count = usage_count + 1
  WHERE id = component_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify setup)
-- ============================================================================

-- Check if table exists:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'components';

-- Check table structure:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'components';

-- Check indexes:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'components';

-- Check RLS policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'components';

-- Test query (should return empty result set initially):
-- SELECT * FROM components LIMIT 5;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================






