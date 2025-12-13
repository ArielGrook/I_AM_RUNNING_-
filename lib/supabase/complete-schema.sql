-- I AM RUNNING - Complete Supabase Database Schema
-- 
-- This file contains ALL tables, columns, RLS policies, and functions needed for the application.
-- Copy and paste this entire file into Supabase SQL Editor to set up the database.
--
-- Project ID: vwsalirdcgabznrdruyy
-- Created: November 2025

-- ============================================================================
-- 1. COMPONENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom', 'auth', 'database')),
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

-- Indexes for components
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_style ON components(style);
CREATE INDEX IF NOT EXISTS idx_components_user_id ON components(user_id);
CREATE INDEX IF NOT EXISTS idx_components_public ON components(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_components_tags ON components USING GIN(tags);

-- ============================================================================
-- 2. PROJECTS TABLE
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ============================================================================
-- 3. USER PACKAGES TABLE (Monetization)
-- ============================================================================
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

-- ============================================================================
-- 4. ANALYTICS TABLE (User Interactions Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'signup', 'edit', 'save', 'export', 'import', 'payment', 'page_view', 'component_add', 'chat_message', 'preview', 'admin_action')),
  event_data JSONB, -- Additional event data
  session_id TEXT, -- Browser session ID
  ip_address TEXT,
  user_agent TEXT,
  page_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);

-- ============================================================================
-- 5. USER ROLES TABLE (Admin Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'freelancer')),
  permissions JSONB DEFAULT '{}'::jsonb, -- Additional permissions
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who assigned this role
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ============================================================================
-- 6. FRONTEND BLOCKS TABLE (Auth/DB Blocks Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS frontend_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('auth', 'database')),
  config JSONB NOT NULL, -- Block configuration (e.g., { "type": "supabase", "anon_key": "...", "tables": [...] })
  price_paid DECIMAL(10, 2), -- Amount paid for this block
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frontend_blocks_project_id ON frontend_blocks(project_id);
CREATE INDEX IF NOT EXISTS idx_frontend_blocks_user_id ON frontend_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_frontend_blocks_type ON frontend_blocks(block_type);

-- ============================================================================
-- 7. ADMIN TASKS TABLE (Freelancer Delegation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Freelancer/admin
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who created task
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes JSONB DEFAULT '[]'::jsonb, -- Task notes/updates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_assigned_to ON admin_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_project_id ON admin_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE frontend_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;

-- Components policies
CREATE POLICY "Public components are viewable by everyone"
  ON components FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own components"
  ON components FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own components"
  ON components FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own components"
  ON components FOR DELETE
  USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Projects are viewable by owner and admins"
  ON projects FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'freelancer')
  ));

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'freelancer')
  ));

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- User packages policies
CREATE POLICY "Users can view their own packages"
  ON user_packages FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can insert their own packages"
  ON user_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own packages"
  ON user_packages FOR UPDATE
  USING (auth.uid() = user_id);

-- Analytics policies (users can only see their own, admins see all)
CREATE POLICY "Users can view their own analytics"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- User roles policies (only admins can manage)
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Frontend blocks policies
CREATE POLICY "Users can view their own frontend blocks"
  ON frontend_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own frontend blocks"
  ON frontend_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own frontend blocks"
  ON frontend_blocks FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin tasks policies
CREATE POLICY "Users can view assigned tasks"
  ON admin_tasks FOR SELECT
  USING (
    auth.uid() = assigned_to 
    OR auth.uid() = assigned_by
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'freelancer')
    )
  );

CREATE POLICY "Admins can insert tasks"
  ON admin_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'freelancer')
  ));

CREATE POLICY "Assigned users can update tasks"
  ON admin_tasks FOR UPDATE
  USING (
    auth.uid() = assigned_to 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 9. FUNCTIONS
-- ============================================================================

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

CREATE TRIGGER update_user_packages_updated_at
  BEFORE UPDATE ON user_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frontend_blocks_updated_at
  BEFORE UPDATE ON frontend_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_tasks_updated_at
  BEFORE UPDATE ON admin_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Function to log analytics event
CREATE OR REPLACE FUNCTION log_analytics_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_page_path TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    user_id,
    event_type,
    event_data,
    session_id,
    ip_address,
    user_agent,
    page_path
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_data,
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_page_path
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- ============================================================================
-- 10. INITIAL DATA (Optional - Seed Data)
-- ============================================================================

-- Insert default admin role (update with your admin user ID after creating account)
-- Example: INSERT INTO user_roles (user_id, role) VALUES ('your-admin-user-id', 'admin');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Verification queries (run after setup):
-- SELECT COUNT(*) FROM components;
-- SELECT COUNT(*) FROM projects;
-- SELECT COUNT(*) FROM user_packages;
-- SELECT COUNT(*) FROM analytics_events;
-- SELECT COUNT(*) FROM user_roles;
-- SELECT COUNT(*) FROM frontend_blocks;
-- SELECT COUNT(*) FROM admin_tasks;



