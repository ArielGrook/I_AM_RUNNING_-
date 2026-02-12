-- Add metadata fields to projects table for categorization, visibility, and versioning
-- Run this in Supabase SQL Editor

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add check constraint for visibility (ignore if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_visibility_check'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_visibility_check
      CHECK (visibility IN ('private', 'public', 'unlisted'));
  END IF;
END $$;

COMMENT ON COLUMN projects.tags IS 'Array of tags for categorization (e.g. landing, ecommerce)';
COMMENT ON COLUMN projects.category IS 'Primary category (general, business, portfolio, ecommerce, blog)';
COMMENT ON COLUMN projects.visibility IS 'Project visibility (private, public, unlisted)';
COMMENT ON COLUMN projects.version IS 'Project version number, incremented on each save';
COMMENT ON COLUMN projects.metadata IS 'Additional metadata JSON (author, colors, fonts, etc)';
