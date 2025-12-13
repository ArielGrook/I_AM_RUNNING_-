-- Supabase Database Functions
-- 
-- Helper functions for component system
-- Stage 2 Module 5: Component System from Supabase

-- Function to increment component usage count
CREATE OR REPLACE FUNCTION increment_component_usage(component_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE components
  SET usage_count = usage_count + 1
  WHERE id = component_id;
END;
$$;

-- Function to search components by tags
CREATE OR REPLACE FUNCTION search_components(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  style TEXT,
  html TEXT,
  description TEXT,
  thumbnail TEXT,
  tags TEXT[],
  usage_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.category,
    c.style,
    c.html,
    c.description,
    c.thumbnail,
    c.tags,
    c.usage_count
  FROM components c
  WHERE 
    (c.is_public = true OR c.user_id = auth.uid())
    AND (
      c.name ILIKE '%' || search_term || '%'
      OR c.description ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(c.tags) AS tag
        WHERE tag ILIKE '%' || search_term || '%'
      )
    )
  ORDER BY c.usage_count DESC, c.created_at DESC;
END;
$$;








