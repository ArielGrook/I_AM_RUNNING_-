-- Supabase Database Schema
-- 
-- Component System Tables
-- Stage 2 Module 5: Component System from Supabase

-- Components table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_style ON components(style);
CREATE INDEX IF NOT EXISTS idx_components_user_id ON components(user_id);
CREATE INDEX IF NOT EXISTS idx_components_public ON components(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_components_tags ON components USING GIN(tags);

-- Projects table (for future use)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL, -- Full project JSON
  thumbnail TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public) WHERE is_public = true;

-- User packages table (for monetization)
CREATE TABLE IF NOT EXISTS user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  package_type TEXT NOT NULL CHECK (package_type IN ('landing', 'multipage', 'ecommerce')),
  order_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_status ON user_packages(status) WHERE status = 'active';

-- Row Level Security (RLS) Policies
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Components policies
-- Anyone can read public components
CREATE POLICY "Public components are viewable by everyone"
  ON components FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can insert their own components
CREATE POLICY "Users can insert their own components"
  ON components FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own components
CREATE POLICY "Users can update their own components"
  ON components FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own components
CREATE POLICY "Users can delete their own components"
  ON components FOR DELETE
  USING (auth.uid() = user_id);

-- Projects policies
-- Anyone can read projects (for admin shadow mode)
CREATE POLICY "Projects are viewable by everyone"
  ON projects FOR SELECT
  USING (true);

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can read all projects (for shadow mode)
-- Note: Admin check is done in application code via user_metadata.role

-- User packages policies
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;

-- Users can read their own packages
CREATE POLICY "Users can view their own packages"
  ON user_packages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own packages (via payment)
CREATE POLICY "Users can insert their own packages"
  ON user_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own packages
CREATE POLICY "Users can update their own packages"
  ON user_packages FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_components_updated_at
  BEFORE UPDATE ON components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

