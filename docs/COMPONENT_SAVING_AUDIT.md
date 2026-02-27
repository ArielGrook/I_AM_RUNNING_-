# Component Saving System Audit Report

## FILES FOUND

### Core Implementation Files
1. **`components/editor/SaveComponentDialog.tsx`** - Main save dialog UI component
   - Form with name, category, style, description, tags
   - Extracts HTML/CSS from GrapesJS editor
   - Calls `saveComponent()` from supabase-catalog

2. **`lib/components/supabase-catalog.ts`** - Database operations
   - `saveComponent()` - Inserts component into Supabase
   - `getComponentCatalog()` - Loads components from database
   - `updateComponent()`, `deleteComponent()` - CRUD operations

3. **`lib/schemas/validation.ts`** - Form validation schemas
   - `ComponentSaveFormSchema` - Zod schema for form validation
   - Validates name, category, style, tags, html, css, js

4. **`lib/constants/styles.ts`** - Style definitions
   - 20 predefined styles (modern_dark, modern_light, etc.)
   - Style metadata with colors and compatibility

5. **`lib/constants/tags.ts`** - Tag definitions
   - 49 predefined tags (functional, navigation, style, industry)
   - Tag metadata with categories

### Database Schema Files
6. **`lib/supabase/schema.sql`** - Basic schema (OLD - missing fields)
   - Only has: id, name, category, style, html, description, thumbnail, tags, user_id, is_public, usage_count
   - **MISSING**: css, js, preview_img, type fields

7. **`lib/supabase/complete-schema.sql`** - Complete schema (CURRENT)
   - Same as schema.sql - **STILL MISSING css, js, preview_img, type fields**

8. **`CREATE_COMPONENTS_TABLE.sql`** - Standalone migration script
   - Same structure - **MISSING css, js, preview_img, type fields**

### Integration Files
9. **`app/[locale]/editor/page.tsx`** - Editor page
   - `handleSaveComponent()` - Opens dialog
   - Loads components via `getComponentCatalog()`
   - Renders `SaveComponentDialog`

10. **`components/editor/StyleSelector.tsx`** - Style dropdown component
    - Shows 20 styles grouped by category
    - Visual previews with colors

11. **`components/editor/TagSelector.tsx`** - Tag multi-select component
    - Shows 49 tags grouped by category
    - Search functionality
    - Max 10 tags limit

---

## CURRENT FLOW

### Save Flow (Expected)
```
1. User selects component in GrapesJS editor
   ↓
2. Clicks "Save Component" button
   ↓
3. handleSaveComponent() checks:
   - canSave permission (demo mode check)
   - editor is ready
   - component is selected
   ↓
4. Opens SaveComponentDialog
   ↓
5. Dialog useEffect extracts:
   - HTML: selected.toHTML()
   - CSS: editor.getCss()
   - Generates thumbnail (html2canvas)
   ↓
6. User fills form:
   - Name (required)
   - Category (dropdown)
   - Style (required, from 20 styles)
   - Description (optional)
   - Tags (up to 10, from 49 predefined)
   ↓
7. onSubmit() validates:
   - Style is selected (required)
   - Gets fresh HTML/CSS from editor
   - Cleans HTML (removes <style> tags)
   ↓
8. Calls saveComponent() from supabase-catalog.ts
   ↓
9. saveComponent() inserts into Supabase:
   - Validates HTML is not empty
   - Sets css to empty string if undefined
   - Inserts with user_id (null for anonymous)
   ↓
10. [BREAKS HERE] Database insert fails
    ↓
11. Error handling shows toast message
```

---

## PROBLEMS IDENTIFIED

### 🔴 CRITICAL PROBLEM #1: Database Schema Mismatch

**Location**: `lib/supabase/complete-schema.sql` lines 12-26

**Problem**: 
The database table `components` is missing required fields that the code tries to insert:
- ❌ `css` field - Code tries to insert `css: cssContent` (line 245)
- ❌ `js` field - Code tries to insert `js: component.js || ''` (line 246)
- ❌ `preview_img` field - Code tries to insert `preview_img: component.thumbnail` (line 249)
- ❌ `type` field - Code tries to insert `type: component.type` (line 243)

**Current Schema**:
```sql
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (...),
  style TEXT CHECK (style IN ('minimal', 'modern', 'classic', 'bold', 'elegant', 'playful')),
  html TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  tags TEXT[],
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Code Expects**:
```typescript
.insert({
  name, category, style, type,  // ← type missing
  html, css, js,                 // ← css, js missing
  description, tags,
  preview_img,                   // ← preview_img missing (not thumbnail)
  is_public, user_id
})
```

**Impact**: 
- Database insert will fail with "column does not exist" error
- Components cannot be saved
- Error code: `42703` (undefined column)

---

### 🔴 CRITICAL PROBLEM #2: RLS Policy Blocks Anonymous Saves

**Location**: `lib/supabase/complete-schema.sql` lines 168-170

**Problem**:
RLS policy requires `auth.uid() = user_id` for INSERT, but code allows `user_id = null` for anonymous saves.

**Current Policy**:
```sql
CREATE POLICY "Users can insert their own components"
  ON components FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Code Behavior**:
```typescript
// Line 251 in supabase-catalog.ts
user_id: user?.id || null, // Allow null for anonymous saves
```

**Impact**:
- Anonymous users (demo mode) cannot save components
- Policy check fails: `auth.uid() = null` is FALSE
- Error: RLS policy violation
- Error code: `42501` (insufficient privilege)

---

### 🟡 PROBLEM #3: Style Enum Mismatch

**Location**: `lib/supabase/complete-schema.sql` line 16

**Problem**:
Database CHECK constraint only allows old styles, but code uses new 20-style system.

**Database Constraint**:
```sql
style TEXT CHECK (style IN ('minimal', 'modern', 'classic', 'bold', 'elegant', 'playful'))
```

**Code Uses**:
```typescript
// lib/constants/styles.ts - 20 styles
'modern_dark', 'modern_light', 'modern_gradient',
'classic_white', 'classic_elegant',
'minimal_dark', 'minimal_light',
// ... 13 more styles
```

**Impact**:
- Any style except the 6 old ones will fail CHECK constraint
- Error: "new row violates check constraint"
- Error code: `23514` (check constraint violation)

---

### 🟡 PROBLEM #4: TypeScript Type Error in Fallback Function

**Location**: `lib/components/supabase-catalog.ts` line 173

**Problem**:
`convertStaticCatalogToSupabase()` uses `StyleVariant` type that doesn't exist.

**Code**:
```typescript
style: style as StyleVariant,  // ← StyleVariant is not imported/defined
```

**Impact**:
- TypeScript compilation error (if strict mode)
- Runtime: works but type is wrong (should be `ComponentStyle`)

---

### 🟡 PROBLEM #5: Missing Type Field in SupabaseComponent Interface

**Location**: `lib/components/supabase-catalog.ts` line 16-33

**Problem**:
`SupabaseComponent` interface has `type?: string`, but database table doesn't have `type` column.

**Code**:
```typescript
export interface SupabaseComponent {
  // ...
  type?: string;  // ← Field exists in interface
  // ...
}
```

**Database**: No `type` column

**Impact**:
- Type mismatch between TypeScript and database
- Insert will fail if `type` is provided

---

### 🟢 MINOR ISSUE: Component Loading on Mount

**Location**: `app/[locale]/editor/page.tsx` lines 277-296

**Observation**:
Components are loaded on mount, but if save fails, the list doesn't refresh automatically. User must reload page to see saved component.

**Impact**: 
- UX issue - saved component doesn't appear immediately
- Not a breaking bug, but confusing

---

## FIX PLAN

### Priority 1: Fix Database Schema (CRITICAL)

**File**: `lib/supabase/complete-schema.sql`

**Changes Needed**:
1. Add missing columns to `components` table:
   ```sql
   ALTER TABLE components ADD COLUMN IF NOT EXISTS css TEXT;
   ALTER TABLE components ADD COLUMN IF NOT EXISTS js TEXT;
   ALTER TABLE components ADD COLUMN IF NOT EXISTS preview_img TEXT;
   ALTER TABLE components ADD COLUMN IF NOT EXISTS type TEXT;
   ```

2. Update style CHECK constraint to allow all 20 styles:
   ```sql
   ALTER TABLE components DROP CONSTRAINT IF EXISTS components_style_check;
   -- Remove CHECK constraint entirely (style is optional, validation happens in app)
   ```

3. Fix RLS policy to allow anonymous inserts:
   ```sql
   DROP POLICY IF EXISTS "Users can insert their own components" ON components;
   CREATE POLICY "Users can insert their own components"
     ON components FOR INSERT
     WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
   ```

**Complexity**: Low
**Estimated Time**: 15 minutes
**Risk**: Low (additive changes, no data loss)

---

### Priority 2: Fix TypeScript Types (HIGH)

**File**: `lib/components/supabase-catalog.ts`

**Changes Needed**:
1. Fix `convertStaticCatalogToSupabase()` type:
   ```typescript
   // Line 173: Change
   style: style as StyleVariant,
   // To:
   style: style as ComponentStyle,
   ```

2. Import `ComponentStyle` if missing:
   ```typescript
   import { ComponentStyle } from '@/lib/constants/styles';
   ```

**Complexity**: Very Low
**Estimated Time**: 2 minutes
**Risk**: None

---

### Priority 3: Update Schema Files (MEDIUM)

**Files**: 
- `lib/supabase/schema.sql`
- `CREATE_COMPONENTS_TABLE.sql`

**Changes Needed**:
Update all schema files to match the fixed `complete-schema.sql` so they're consistent.

**Complexity**: Low
**Estimated Time**: 10 minutes
**Risk**: None (documentation only)

---

### Priority 4: Add Component List Refresh (LOW)

**File**: `app/[locale]/editor/page.tsx`

**Changes Needed**:
After successful save, refresh component list:
```typescript
onSaved={() => {
  // Reload components
  const loadComponents = async () => {
    const catalog = await getComponentCatalog(false);
    setComponents(catalog);
    setFilteredComponents(catalog);
  };
  loadComponents();
}}
```

**Complexity**: Low
**Estimated Time**: 5 minutes
**Risk**: None

---

## SUMMARY

### Root Causes
1. **Database schema is outdated** - Missing css, js, preview_img, type columns
2. **RLS policy too restrictive** - Blocks anonymous saves
3. **Style constraint outdated** - Only allows 6 old styles, not 20 new ones
4. **TypeScript type errors** - StyleVariant doesn't exist

### Expected Errors When Saving
1. `column "css" does not exist` (PostgreSQL error 42703)
2. `new row violates check constraint` (if using new style)
3. `permission denied for table components` (RLS policy violation)

### Fix Order
1. ✅ Update database schema (add columns, fix RLS, remove style constraint)
2. ✅ Fix TypeScript types
3. ✅ Update all schema files for consistency
4. ✅ Add component refresh after save

### Testing Checklist
- [ ] Save component with all fields filled
- [ ] Save component anonymously (no auth)
- [ ] Save component with new style (e.g., modern_dark)
- [ ] Save component with CSS content
- [ ] Save component with JS content
- [ ] Verify component appears in catalog after save
- [ ] Verify component can be loaded and used in editor

---

**Status**: 🔴 System is BROKEN - Database schema mismatch prevents all saves

**Next Step**: Run database migration to add missing columns and fix RLS policy
