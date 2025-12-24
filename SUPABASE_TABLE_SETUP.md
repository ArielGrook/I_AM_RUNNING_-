# Supabase Components Table Setup

## Issue
Getting 404 error when querying Supabase components table:
```
Failed to load resource: the server responded with a status of 404
vwsalirdcgabznrdruyy.supabase.co/rest/v1/components?select=*&is_public=eq.true
```

## Root Cause
The `components` table does not exist in your Supabase database. The 404 error indicates the table needs to be created.

## Solution: Create the Components Table

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Schema SQL
Copy and paste the following SQL into the editor:

```sql
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

-- Enable Row Level Security
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

-- Components policies
CREATE POLICY "Public components are viewable by everyone"
  ON components FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own components"
  ON components FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own components"
  ON components FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own components"
  ON components FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_components_updated_at
  BEFORE UPDATE ON components
  FOR EACH ROW
  EXECUTE FUNCTION update_components_updated_at();

-- Function to increment component usage count
CREATE OR REPLACE FUNCTION increment_component_usage(component_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE components
  SET usage_count = usage_count + 1
  WHERE id = component_id;
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Execute the Query
1. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
2. Wait for confirmation that all statements executed successfully

### Step 4: Verify Table Creation
Run this query to verify the table exists:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'components';
```

You should see `components` in the results.

### Step 5: Test Component Query
Test that you can query the table:

```sql
SELECT * FROM components LIMIT 5;
```

This should return empty results (or any existing components if you have them).

## Alternative: Use Migration Tool

If you prefer using Supabase migrations:

1. Install Supabase CLI: `npm install -g supabase`
2. Initialize migrations: `supabase init`
3. Create migration: `supabase migration new create_components_table`
4. Copy the SQL from `lib/supabase/schema.sql` into the migration file
5. Run migration: `supabase db push`

## Verification After Setup

After creating the table, refresh your application. You should:
- ✅ No more 404 errors in console
- ✅ Components load (or fallback to static catalog if empty)
- ✅ Be able to save components to Supabase
- ✅ See components in the component panel

## Troubleshooting

### If you still get 404:
1. Check table name spelling (should be `components`, not `site_components`)
2. Verify you're connected to the correct Supabase project
3. Check Row Level Security policies allow SELECT for public components
4. Verify your Supabase API key has proper permissions

### If you get permission errors:
- Make sure RLS policies are created correctly
- Verify `is_public = true` components can be read by anyone
- Check that authenticated users can INSERT their own components

### Table Name Note:
- ✅ Use: `components` (correct table name per schema)
- ❌ Don't use: `site_components` (old/legacy name)

The code uses `components` which matches the schema, so the table name in Supabase must be `components`.



