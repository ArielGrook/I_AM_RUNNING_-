-- F03: Components Library - ALTER existing components table
-- Adds new category values, metadata columns, and fixes RLS

-- 1. Drop existing category CHECK constraint (if any) and recreate with new values
-- Note: The constraint name may vary; use DO block for safety
DO $$
BEGIN
  -- Try to drop any existing CHECK on category
  BEGIN
    ALTER TABLE components DROP CONSTRAINT IF EXISTS components_category_check;
  EXCEPTION WHEN undefined_object THEN
    -- Constraint doesn't exist, that's fine
  END;
END $$;

-- Recreate with expanded categories
ALTER TABLE components
  ADD CONSTRAINT components_category_check
  CHECK (category IN (
    'header', 'hero', 'footer', 'section', 'button', 'form',
    'navigation', 'custom', 'auth', 'database',
    'product-card', 'cart'
  ));

-- 2. Add new columns for library components
ALTER TABLE components
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS component_path TEXT,
  ADD COLUMN IF NOT EXISTS animation_preset TEXT DEFAULT 'smooth-fade',
  ADD COLUMN IF NOT EXISTS has_mobile_variant BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100);

-- 3. Index on slug for fast lookup
CREATE INDEX IF NOT EXISTS idx_components_slug ON components(slug);

-- 4. Fix RLS admin policy to use JWT metadata (users.role column does not exist)
-- Drop old policy if it exists
DO $$
BEGIN
  DROP POLICY IF EXISTS "Only admins can manage components" ON components;
EXCEPTION WHEN undefined_object THEN
  -- Policy doesn't exist
END $$;

-- Create correct admin policy using JWT user_metadata
CREATE POLICY "Only admins can manage components"
  ON components FOR ALL
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- Ensure SELECT policy exists for everyone
DO $$
BEGIN
  DROP POLICY IF EXISTS "Components are viewable by everyone" ON components;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

CREATE POLICY "Components are viewable by everyone"
  ON components FOR SELECT
  USING (true);

-- Comments
COMMENT ON COLUMN components.slug IS 'Unique slug identifier, e.g. header-1, cart-1';
COMMENT ON COLUMN components.component_path IS 'React source file path, e.g. headers/Header1';
COMMENT ON COLUMN components.animation_preset IS 'Default GSAP animation preset from F02';
COMMENT ON COLUMN components.has_mobile_variant IS 'Whether component has mobile-responsive design';
COMMENT ON COLUMN components.accessibility_score IS 'WCAG 2.1 AA compliance score 0-100';
