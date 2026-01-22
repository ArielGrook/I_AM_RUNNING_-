# I AM RUNNING - Codebase Analysis Report

**Project:** I AM RUNNING  
**Domain:** iamrunning.online  
**Stack:** Next.js 15, TypeScript, Supabase Auth, GrapesJS Editor  
**Repository:** https://github.com/ArielGrook/I_AM_RUNNING_-

---

## SECTION 1: AUTHENTICATION SYSTEM

### 1.1 Authentication Files Location

**Login Page:**
- **Path:** `app/[locale]/auth/login/page.tsx`
- **Type:** Client component (`'use client'`)
- **Lines:** 1-227

**Signup Page:**
- **Path:** `app/[locale]/auth/signup/page.tsx`
- **Type:** Client component (`'use client'`)
- **Lines:** 1-211

**OAuth Callback Page:**
- **Path:** `app/[locale]/auth/callback/page.tsx`
- **Type:** Client component (`'use client'`)
- **Lines:** 1-83

**Auth Hook:**
- **Path:** `lib/hooks/useAuth.ts`
- **Type:** Custom React hook
- **Lines:** 1-518

**Auth Utilities:**
- **Path:** `lib/supabase/auth.ts`
- **Functions:** `signIn()`, `signUp()`, `signInWithGoogle()`, `signOut()`, `getCurrentUser()`, `isAdmin()`, `requireAdmin()`
- **Lines:** 1-211

**Supabase Client:**
- **Path:** `lib/supabase/client.ts`
- **Functions:** `createSupabaseClient()`, `getSupabaseClient()`
- **Lines:** 1-81

### 1.2 Current Auth Flow

#### Sign In Flow (Email/Password):

```typescript
// app/[locale]/auth/login/page.tsx:56-69
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  try {
    console.log('🔐 Attempting email/password login...');
    await signIn(email, password);
    // Redirect happens via useEffect when isAuthenticated becomes true
  } catch (error) {
    console.error('❌ Login failed:', error);
  }
};
```

**Flow Steps:**
1. User submits form → `handleSubmit()` called
2. Form validation (email format, password length)
3. Calls `signIn()` from `useAuth` hook
4. `useAuth.signInUser()` → calls `lib/supabase/auth.ts:signIn()`
5. Supabase `signInWithPassword()` API call (10s timeout)
6. Auth state listener (`onAuthStateChange`) detects `SIGNED_IN` event
7. Profile loaded/created via `loadProfile()` or `createProfile()`
8. `isAuthenticated` becomes `true`
9. `useEffect` in login page redirects to `/editor`

**Loading State Management:**
- Managed in `useAuth` hook: `loading: boolean` state
- Set to `true` when auth operations start
- Cleared after 1 second delay OR on error
- **ISSUE:** Timeout-based clearing (1s delay) may cause race conditions

**API Calls:**
```typescript
// lib/supabase/auth.ts:33-36
const authPromise = supabase.auth.signInWithPassword({
  email,
  password,
});
```

#### Sign Up Flow:

```typescript
// app/[locale]/auth/signup/page.tsx:61-76
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  try {
    await signUp(email, password, {
      full_name: fullName.trim() || undefined,
    });
    router.push('/editor'); // IMMEDIATE redirect
  } catch (error) {
    console.error('Signup failed:', error);
  }
};
```

**Flow Steps:**
1. Form validation (email, password, confirm password)
2. Calls `signUp()` with metadata
3. Supabase `signUp()` API call (10s timeout, `email_confirm: false`)
4. **ISSUE:** Redirect happens immediately, not waiting for auth state
5. Profile creation happens in `useAuth` listener

**Critical Code Snippets:**

```typescript
// lib/hooks/useAuth.ts:251-280
const signInUser = async (email: string, password: string) => {
  setAuthState(prev => ({ ...prev, loading: true, error: null }));
  
  try {
    const result = await signIn(email, password);
    
    // Auth state will be updated by the listener
    // Clear loading state after a short delay
    setTimeout(() => {
      if (mountedRef.current) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 1000);
  } catch (error) {
    setAuthState(prev => ({
      ...prev,
      loading: false,
      error: errorMessage
    }));
  }
};
```

```typescript
// lib/hooks/useAuth.ts:388-469
useEffect(() => {
  // Initial auth check
  refreshAuth();
  
  // Auth state change listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const user = session?.user;
        if (user) {
          let profile = await loadProfile(user.id);
          if (!profile) {
            profile = await createProfile(user);
          }
          
          setAuthState({
            user,
            profile,
            loading: false,
            isAuthenticated: true,
            error: null,
          });
        }
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

### 1.3 Session Persistence

**Storage Mechanism:**
- **Cookie Consent Based:** Session storage depends on cookie consent
- **Code:** `lib/supabase/client.ts:42-64`

```typescript
export function createSupabaseClient(cookieConsent?: 'accepted' | 'declined' | null) {
  const persistSession = cookieConsent === 'accepted';
  
  browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
      detectSessionInUrl: true,
    },
  });
}
```

**Session Storage:**
- If cookie consent = `'accepted'`: Uses `localStorage` (persistent)
- If cookie consent = `'declined'` or `null`: Uses `sessionStorage` (temporary)
- Cookie consent stored in `localStorage.getItem('cookie-consent')`

**Session Check on Page Load:**
```typescript
// lib/hooks/useAuth.ts:147-246
const refreshAuth = async () => {
  setAuthState(prev => ({ ...prev, loading: true }));
  
  // 15 second timeout to prevent infinite loading
  authTimeoutRef.current = setTimeout(() => {
    setAuthState(prev => ({
      ...prev,
      loading: false,
      error: 'Authentication request timed out.'
    }));
  }, 15000);
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (session?.user) {
    let profile = await loadProfile(user.id);
    if (!profile) {
      profile = await createProfile(user);
    }
    setAuthState({ user, profile, loading: false, isAuthenticated: true });
  }
};
```

**Auto-Refresh Token:**
- Enabled when `persistSession === true`
- Configured in Supabase client: `autoRefreshToken: persistSession`
- Handled automatically by Supabase SDK

### 1.4 Google OAuth

**Existing Implementation:**
- **YES, Google OAuth is implemented**

**Code Location:**
- `lib/supabase/auth.ts:100-132` - `signInWithGoogle()` function
- `lib/hooks/useAuth.ts:319-348` - `signInWithGoogleUser()` wrapper
- `app/[locale]/auth/login/page.tsx:71-80` - Button handler
- `app/[locale]/auth/callback/page.tsx` - OAuth callback handler

**Implementation Details:**

```typescript
// lib/supabase/auth.ts:100-132
export async function signInWithGoogle() {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  return data;
}
```

**OAuth Flow:**
1. User clicks "Sign in with Google" button
2. `signInWithGoogle()` called → redirects to Google
3. User authenticates with Google
4. Google redirects to `/auth/callback`
5. Callback page waits for `isAuthenticated` to become `true`
6. Redirects to `/editor`

**What's Needed:**
- ✅ OAuth code exists and appears functional
- ⚠️ **Potential Issue:** Callback page has 10s timeout, may not be enough for slow networks
- ⚠️ **Potential Issue:** No error handling if OAuth fails mid-flow

### 1.5 Potential Infinite Loading Bug Causes

**Identified Issues:**

1. **Race Condition in Loading State:**
```typescript
// lib/hooks/useAuth.ts:262-267
setTimeout(() => {
  if (mountedRef.current) {
    setAuthState(prev => ({ ...prev, loading: false }));
  }
}, 1000);
```
- Loading cleared after 1s delay, but listener may update state later
- If listener fails silently, loading stays `true`

2. **Timeout Race Condition:**
```typescript
// lib/hooks/useAuth.ts:158-167
authTimeoutRef.current = setTimeout(() => {
  if (mountedRef.current) {
    setAuthState(prev => ({
      ...prev,
      loading: false,
      error: 'Authentication request timed out.'
    }));
  }
}, 15000);
```
- 15s timeout may fire before auth completes
- Timeout cleared only if `getSession()` succeeds, but if it hangs, timeout fires

3. **Missing Error Handling in Listener:**
```typescript
// lib/hooks/useAuth.ts:450-457
} catch (error) {
  console.error('❌ Error handling auth state change:', error);
  setAuthState(prev => ({
    ...prev,
    loading: false, // ✅ Sets loading to false
    error: error instanceof Error ? error.message : 'Auth state update failed',
  }));
}
```
- Error handler exists but may not catch all cases

4. **Signup Immediate Redirect:**
```typescript
// app/[locale]/auth/signup/page.tsx:71
router.push('/editor'); // Redirects BEFORE auth state updates
```
- Redirects immediately, doesn't wait for `isAuthenticated`
- May cause editor to load before user is authenticated

5. **Component Unmount Check:**
```typescript
// lib/hooks/useAuth.ts:150-153
if (!mountedRef.current) {
  console.log('🚫 Component unmounted, skipping auth refresh');
  return;
}
```
- Good: Prevents state updates after unmount
- But: If component unmounts during auth, loading never clears

**Missing Error Handling:**
- No retry logic for failed auth calls
- No network error detection
- No handling for Supabase service unavailability

**Redirect Issues:**
- Signup redirects immediately (doesn't wait for auth)
- Login redirects via `useEffect` dependency on `isAuthenticated` (better)

**Race Conditions:**
- Multiple auth state updates can conflict
- Timeout and listener can both update state simultaneously

---

## SECTION 2: GRAPESJS EDITOR

### 2.1 GrapesJS Initialization

**File Path:**
- `components/editor/GrapeEditor.tsx`
- **Lines:** 114-984

**Initialization Code:**

```typescript
// components/editor/GrapeEditor.tsx:164-268
useEffect(() => {
  if (!editorRef.current) return;
  
  // Get block definitions BEFORE init
  let blockDefinitions: BlockDefinition[] = [];
  if (components && components.length > 0) {
    blockDefinitions = getSupabaseBlockDefinitions(components);
  } else {
    blockDefinitions = getAllCatalogBlockDefinitions();
  }
  
  // Initialize with minimal config first
  let editor: grapesjs.Editor;
  
  editor = grapesjs.init({
    container: editorRef.current!,
    height: '100%',
    width: 'auto',
    fromElement: false,
    storageManager: false, // ⚠️ No built-in storage
    
    allowScripts: true,
    dragMode: 'translate',
    dragAutoScroll: true,
    dragMultipleComponent: true,
    showOffsets: true,
    
    deviceManager: {
      devices: [
        { name: 'Desktop', width: '1200px', widthMedia: '' },
        { name: 'Tablet', width: '768px', widthMedia: '991px' },
        { name: 'Mobile', width: '320px', widthMedia: '767px' },
      ],
    },
    
    undoManager: {
      trackSelection: false,
    },
    
    canvas: {
      styles: ['https://cdn.tailwindcss.com'],
      scripts: [],
      frameStyle: `/* CSS for canvas frame */`,
    },
    
    blockManager: {
      appendTo: '#blocks-container',
      blocks: [], // Empty initially
    },
  });
  
  // Add blocks AFTER init succeeds
  if (blockDefinitions.length > 0) {
    const blocks = editor.BlockManager;
    blockDefinitions.forEach((def) => {
      blocks.add(def.id, {
        label: def.label,
        category: def.category,
        content: def.content,
        // ...
      });
    });
  }
  
  grapesEditorRef.current = editor;
}, [isRTL, components]);
```

**Key Configuration:**
- `storageManager: false` - No built-in GrapesJS storage
- Custom storage via Zustand + localStorage
- Blocks added dynamically after initialization
- Tailwind CSS loaded in canvas for component styling

### 2.2 Save/Load Methods

**NOT using `editor.store()` and `editor.load()`**

**Current Implementation:**

**Save:**
```typescript
// components/editor/GrapeEditor.tsx:598-620
editor.on('update', () => {
  const html = editor.getHtml();
  const css = editor.getCss();
  
  // Update project store
  if (currentProject) {
    const currentPage = currentProject.pages[0];
    if (currentPage) {
      updateProject({
        pages: [
          {
            ...currentPage,
            components: [], // TODO: Parse HTML to components
            styles: css,
          },
        ],
      });
    }
  }
  
  onUpdate?.(html, css);
});
```

**Load:**
```typescript
// components/editor/GrapeEditor.tsx:758-888
useEffect(() => {
  const editor = grapesEditorRef.current;
  if (!isReady || !editor) return;
  
  const firstPage = currentProject.pages[0];
  
  // Build HTML from parsed components
  const htmlFromComponents = firstPage.components
    ?.map((component) => component?.props?.html || '')
    .filter(Boolean)
    .join('\n') || '';
  
  const css = [currentProject.globalStyles, firstPage.styles]
    .filter(Boolean)
    .join('\n');
  
  // Convert CSS to inline styles
  if (css) {
    htmlWithInlineStyles = convertCssToInlineStyles(htmlFromComponents, css);
  }
  
  // Set components
  editor.setComponents(htmlWithInlineStyles);
  editor.setStyle(css); // For non-inlineable CSS (media queries, etc.)
}, [currentProject, isReady]);
```

**Methods Used:**
- `editor.getHtml()` - Get HTML string
- `editor.getCss()` - Get CSS string
- `editor.setComponents(html)` - Load HTML into editor
- `editor.setStyle(css)` - Load CSS into editor

**Custom Serialization:**
- Project data stored in Zustand store (`lib/store/project-store.ts`)
- Format: Custom `Project` type (see Section 2.3)
- Persisted to localStorage via Zustand `persist` middleware

### 2.3 Editor Data Format

**Format:** Custom JSON structure (NOT GrapesJS native format)

**Data Structure:**

```typescript
// lib/types/project.ts:46-77
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pages: z.array(PageSchema),
  globalStyles: z.string().optional(),
  globalScripts: z.string().optional(),
  assets: z.array(AssetSchema).optional(),
  settings: z.object({
    favicon: z.string().optional(),
    language: z.string().default('en'),
    theme: z.object({
      colors: ColorTokenSchema.optional(),
      fonts: z.object({
        heading: z.string().optional(),
        body: z.string().optional()
      }).optional()
    }).optional()
  }).optional(),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.string().default('1.0.0'),
    userId: z.string().optional()
  })
});
```

**Page Structure:**

```typescript
// lib/types/project.ts:25-36
export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  title: z.string(),
  components: z.array(ComponentSchema),
  styles: z.string().optional(),
});
```

**Component Structure:**

```typescript
// lib/types/project.ts:1-24
export const ComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  category: z.enum(['header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom']),
  style: z.enum(['minimal', 'modern', 'classic', 'bold', 'elegant', 'playful']).optional(),
  props: z.record(z.any()), // Contains HTML, CSS, etc.
});
```

**Example Saved Data:**

```json
{
  "id": "uuid-here",
  "name": "My Project",
  "description": "",
  "pages": [
    {
      "id": "page-uuid",
      "name": "Home",
      "slug": "index",
      "title": "My Project",
      "components": [
        {
          "id": "comp-uuid",
          "type": "section",
          "category": "section",
          "style": "modern",
          "props": {
            "html": "<div class='section'>...</div>",
            "css": ".section { ... }"
          }
        }
      ],
      "styles": "/* Page-specific CSS */"
    }
  ],
  "globalStyles": "/* Global CSS */",
  "globalScripts": "",
  "settings": {
    "language": "en"
  },
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

**Storage:**
- Zustand store persists to localStorage
- Key: `'project-storage'`
- Chunked storage for large projects (prevents QuotaExceededError)

---

## SECTION 3: PROJECT SAVING

### 3.1 Project Store Location

**Path:** `lib/store/project-store.ts`  
**State Management:** Zustand with `persist` middleware  
**Lines:** 1-314

**Implementation:**

```typescript
// lib/store/project-store.ts:214-305
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      saveStatus: 'idle',
      lastSaved: null,
      
      createProject: (name: string, description?: string) => {
        const project = createNewProject(name, description);
        set({
          currentProject: project,
          saveStatus: 'saved',
          lastSaved: new Date(),
        });
      },
      
      updateProject: (updates: Partial<Project>) => {
        const current = get().currentProject;
        if (!current) return;
        
        const updated: Project = {
          ...current,
          ...updates,
          metadata: {
            ...current.metadata,
            ...updates.metadata,
            updatedAt: new Date().toISOString(),
          },
        };
        
        set({
          currentProject: updated,
          saveStatus: 'saving',
        });
      },
      
      loadProject: (project: Project) => {
        set({
          currentProject: project,
          saveStatus: 'saved',
          lastSaved: new Date(),
        });
      },
      
      clearProject: () => {
        set({
          currentProject: null,
          saveStatus: 'idle',
          lastSaved: null,
        });
      },
      
      setSaveStatus: (status: SaveStatus) => {
        set({
          saveStatus: status,
          lastSaved: status === 'saved' ? new Date() : get().lastSaved,
        });
      },
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => createSafeLocalStorage()),
      partialize: (state) => ({
        currentProject: state.currentProject,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
```

**Features:**
- ✅ Chunked localStorage for large projects
- ✅ QuotaExceededError handling
- ✅ Automatic persistence on state changes
- ⚠️ Only saves `currentProject` and `lastSaved` (not `saveStatus`)

### 3.2 Existing Save Functionality

**Save Button Location:**
- `app/[locale]/editor/page.tsx:740-770`
- Header toolbar, next to project name

**Save Button Code:**

```typescript
// app/[locale]/editor/page.tsx:740-770
<Button
  size="sm"
  variant="outline"
  onClick={handleManualSave}
  disabled={isSaving}
  className={/* status-based styling */}
>
  {isSaving ? (
    <>Saving...</>
  ) : saveSuccess ? (
    <>Saved</>
  ) : (
    <>Save Project</>
  )}
</Button>
```

**Manual Save Handler:**

```typescript
// app/[locale]/editor/page.tsx:112-146
const handleManualSave = useCallback(async () => {
  if (!currentProject || isSaving) return;
  
  setIsSaving(true);
  setSaveSuccess(false);
  setSaveStatus('saving');
  setStoreSaveStatus('saving');
  
  try {
    // Force Zustand to persist by updating timestamp
    updateProject({
      metadata: {
        ...currentProject.metadata,
        updatedAt: new Date().toISOString(),
      },
    });
    
    // Brief delay to ensure persist completes
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setSaveStatus('saved');
    setStoreSaveStatus('saved');
    setSaveSuccess(true);
    console.log('[Manual Save] ✅ Project saved to localStorage');
    
    setTimeout(() => setSaveSuccess(false), 2000);
  } catch (error) {
    setSaveStatus('error');
    setStoreSaveStatus('error');
  } finally {
    setIsSaving(false);
  }
}, [currentProject, isSaving, updateProject]);
```

**What Happens When Clicked:**
1. Updates project metadata timestamp
2. Triggers Zustand persist middleware
3. Saves to localStorage (chunked if needed)
4. Shows "Saved" indicator for 2 seconds
5. **Does NOT save to Supabase** (only localStorage)

**Auto-Save:**
- Exists but **DISABLED** (comment says "Manual save replaces auto-save")
- Code exists in `lib/hooks/useAutoSave.ts` but not used in editor page

### 3.3 Save/Load with `projects` Table

**Supabase Integration Code:**

**Save Function:**
```typescript
// lib/store/supabase-sync.ts:16-47
export async function saveProjectToSupabase(project: Project): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return; // Not authenticated, skip Supabase save
    }
    
    const supabase = createSupabaseClient();
    
    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        user_id: user.id,
        name: project.name,
        description: project.description,
        data: project, // ⚠️ Full project JSON stored in JSONB column
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });
    
    if (error) {
      console.error('Failed to save project to Supabase:', error);
      // Don't throw - allow local save to continue
    }
  } catch (error) {
    console.error('Supabase sync error:', error);
    // Don't throw - allow local save to continue
  }
}
```

**Load Function:**
```typescript
// lib/store/supabase-sync.ts:52-78
export async function loadProjectFromSupabase(projectId: string): Promise<Project | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }
    
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.data as Project; // Extract from JSONB column
  } catch (error) {
    return null;
  }
}
```

**What Goes into `projects.data` (JSONB):**
- **Full `Project` object** (entire JSON structure from Section 2.3)
- Includes: pages, components, styles, metadata, settings, etc.
- Stored as JSONB for flexible querying

**Current Status:**
- ✅ Functions exist
- ✅ Supabase table exists (`projects` table with `data JSONB`)
- ⚠️ **NOT CALLED** in manual save handler
- ⚠️ Only called in `useAutoSave` hook (which is disabled)
- ⚠️ No UI to load projects from Supabase
- ⚠️ No project list/dashboard

---

## SECTION 4: ROLE SYSTEM

### 4.1 Role Checks Implementation

**Location:** Multiple places

**1. In Components:**
```typescript
// components/landing/HeroSection.tsx:29-35
const canAccess = profile?.role && profile.role >= 1;
if (!canAccess) {
  e.preventDefault();
  return;
}
```

**2. In Hooks:**
```typescript
// lib/hooks/useAuth.ts:471-484
const hasRole = (requiredRole: number): boolean => {
  return authState.profile?.role >= requiredRole;
};

const isAnonymous = authState.profile?.role === 0;
const isBasicUser = authState.profile?.role >= 1;
const isFreelancer = authState.profile?.role >= 2;
const isPremium = authState.profile?.role >= 3;

const canAccessEditor = isBasicUser;
const canAddComponents = isBasicUser;
const canSaveProjects = isBasicUser;
```

**3. In API Routes:**
```typescript
// lib/supabase/auth.ts:186-189
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}
```

**4. In Admin Page:**
```typescript
// app/[locale]/admin/page.tsx:78
if (isAuthenticated && user?.role === 'admin') {
  // Admin access
}
```

**NOT in Middleware:**
- `middleware.ts` only handles i18n routing
- No auth/role checks in middleware

### 4.2 How `profiles.role` is Used

**Role Values:**
- `0` = Anonymous
- `1` = Basic user
- `2` = Freelancer
- `3` = Premium

**Database Schema:**
```sql
-- lib/supabase/schema.sql:12
role INTEGER DEFAULT 1 CHECK (role IN (0, 1, 2, 3))
```

**Usage Examples:**

```typescript
// lib/hooks/useAuth.ts:117
role: 1, // Default to basic user on signup

// components/landing/HeroSection.tsx:30
const canAccess = profile?.role && profile.role >= 1;

// app/[locale]/profile/page.tsx:19-28
const getRoleName = (role: number) => {
  switch (role) {
    case 0: return 'Anonymous';
    case 1: return 'Basic';
    case 2: return 'Freelancer';
    case 3: return 'Premium';
    default: return 'Unknown';
  }
};
```

**Is It Working?**
- ✅ Role stored in `profiles` table
- ✅ Role loaded on auth
- ✅ Role checks exist in code
- ⚠️ **No role-based UI restrictions** (editor accessible without role check in some places)
- ⚠️ **No role upgrade flow**

### 4.3 `user_roles` Table

**Status:** EXISTS but **NOT USED** in application code

**Table Schema:**
```sql
-- lib/supabase/complete-schema.sql:95-103
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'freelancer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Usage in Code:**
- ❌ **NOT USED** - No queries to `user_roles` table
- ✅ `profiles.role` is used instead
- ⚠️ **CONFLICT:** Two role systems exist:
  - `profiles.role` (INTEGER: 0,1,2,3) - **USED**
  - `user_roles.role` (TEXT: 'user','admin','freelancer') - **NOT USED**

**Admin Check:**
```typescript
// lib/supabase/auth.ts:173-174
const isAdmin = user.user_metadata?.role === 'admin' || 
                user.email === process.env.ADMIN_EMAIL;
```
- Uses `user_metadata.role`, NOT `user_roles` table
- Also checks `ADMIN_EMAIL` env var

**Conclusion:**
- `user_roles` table is **DEPRECATED/UNUSED**
- Application uses `profiles.role` instead

---

## SECTION 5: UI COMPONENTS

### 5.1 Header Component

**Location:** `components/landing/HeroSection.tsx` (lines 57-95)

**Code:**

```typescript
// components/landing/HeroSection.tsx:57-95
<nav className="relative z-20 w-full px-6 py-6 flex items-center justify-between">
  {/* Logo */}
  <motion.div>I AM RUNNING</motion.div>
  
  {/* Right side */}
  <div className="flex items-center gap-3">
    <LanguageSwitcher />
    <ThemeToggle />
    {isAuthenticated ? (
      <UserAvatar /> // Shows avatar dropdown
    ) : (
      <>
        <Button asChild variant="ghost">
          <Link href="/auth/login">{t('login')}</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/signup">{t('signUp')}</Link>
        </Button>
      </>
    )}
  </div>
</nav>
```

**Switch Trigger:**
- Conditional rendering based on `isAuthenticated` from `useAuth()` hook
- `isAuthenticated` comes from auth state listener

**UserAvatar Component:**
- **Path:** `components/ui/UserAvatar.tsx`
- Shows dropdown with: Profile, Settings, Subscription, Privacy, Terms, Logout
- Uses `useAuth()` to get user/profile data

### 5.2 Editor Toolbar

**Location:** `app/[locale]/editor/page.tsx:727-850`

**Buttons:**
1. **Back to Dashboard** - Link to `/`
2. **Project Name** - Displays current project name
3. **Save Project** - Manual save button (see Section 3.2)
4. **Undo/Redo** - Editor undo/redo buttons
5. **Import** - ZIP file import
6. **Export** - Export project
7. **Chat** - Opens AI chat panel
8. **Preview** - Opens preview modal
9. **Device Toggle** - Desktop/Tablet/Mobile view
10. **New Project** - Creates new project

**Save Button Code:**
- See Section 3.2 for full implementation
- Located at line 740-770

### 5.3 Theme System

**Location:** `components/providers/theme-provider.tsx` (not shown, but referenced)

**Usage:**
```typescript
// components/editor/GrapeEditor.tsx:123
const { theme } = useTheme();
const isDark = theme === 'dark';
```

**Editor Theme Application:**
```typescript
// components/editor/GrapeEditor.tsx:642-750
useEffect(() => {
  const editor = grapesEditorRef.current;
  if (!editor) return;
  
  // Apply dark theme to canvas
  if (isDark) {
    canvas.style.backgroundColor = '#ffffff'; // Canvas stays white
    canvas.style.color = '#1f2937';
  }
  
  // Apply theme to editor panels
  applyThemeToElements('.gjs-pn-panel, .gjs-toolbar', {
    backgroundColor: '#262626', // Dark
    color: '#ffffff',
  }, {
    backgroundColor: '#ffffff', // Light
    color: '#1f2937',
  });
}, [isDark]);
```

**Does Editor Follow Site Theme?**
- ✅ **YES** - Editor panels styled based on `theme` from `useTheme()`
- ✅ Canvas background stays white (for content visibility)
- ✅ Toolbars, panels, and UI elements follow theme

---

## SECTION 6: FILE STRUCTURE

### Auth-Related Files

```
app/[locale]/auth/
  ├── login/page.tsx          # Login page
  ├── signup/page.tsx         # Signup page
  └── callback/page.tsx       # OAuth callback

lib/
  ├── hooks/
  │   └── useAuth.ts          # Main auth hook
  ├── supabase/
  │   ├── client.ts           # Supabase client creation
  │   └── auth.ts             # Auth utility functions

components/
  ├── auth/
  │   └── RegistrationForm.tsx # (Legacy, may not be used)
  └── ui/
      └── UserAvatar.tsx      # User avatar dropdown
```

### Editor-Related Files

```
components/editor/
  ├── GrapeEditor.tsx         # Main GrapesJS wrapper
  ├── ChatPanel.tsx           # AI chat panel
  ├── ProjectNameForm.tsx     # Project naming form
  ├── ImportProgressDialog.tsx # ZIP import progress
  ├── PreviewModal.tsx        # Preview modal
  ├── SaveComponentDialog.tsx # Save component dialog
  ├── StyleManager.tsx        # Style editor
  ├── StyleSelector.tsx       # Style selector
  └── TagSelector.tsx         # Tag selector

app/[locale]/editor/
  └── page.tsx                # Main editor page

lib/
  ├── grapesjs/
  │   └── catalog-blocks.ts  # Block definitions
  └── types/
      └── project.ts          # Project type definitions
```

### Store/State Management Files

```
lib/store/
  ├── project-store.ts        # Zustand project store
  └── supabase-sync.ts        # Supabase sync functions

lib/hooks/
  └── useAutoSave.ts          # Auto-save hook (disabled)
```

### Supabase Integration Files

```
lib/supabase/
  ├── client.ts               # Client creation
  ├── auth.ts                 # Auth functions
  ├── schema.sql              # Basic schema
  └── complete-schema.sql     # Full schema

supabase/migrations/
  └── 20251227_users.sql      # User profiles migration
```

---

## SECTION 7: EXISTING BUGS

### Authentication Issues

1. **Infinite Loading Bug:**
   - **Cause:** Race condition between timeout and auth listener
   - **Location:** `lib/hooks/useAuth.ts:158-167, 262-267`
   - **Impact:** Loading state may never clear if auth hangs

2. **Signup Immediate Redirect:**
   - **Cause:** Redirects before auth state updates
   - **Location:** `app/[locale]/auth/signup/page.tsx:71`
   - **Impact:** Editor may load before user is authenticated

3. **Missing Error Recovery:**
   - **Cause:** No retry logic for failed auth calls
   - **Location:** `lib/supabase/auth.ts`
   - **Impact:** User stuck on error, must refresh

4. **Timeout Not Cleared on Error:**
   - **Cause:** Timeout cleared only on success path
   - **Location:** `lib/hooks/useAuth.ts:173-176`
   - **Impact:** Timeout may fire after error, overwriting error message

### State Management Issues

1. **Save Status Not Persisted:**
   - **Cause:** `saveStatus` excluded from Zustand persist
   - **Location:** `lib/store/project-store.ts:295-302`
   - **Impact:** Save status lost on page reload

2. **Race Condition in Manual Save:**
   - **Cause:** 300ms delay may not be enough for large projects
   - **Location:** `app/[locale]/editor/page.tsx:130`
   - **Impact:** "Saved" shown before actual save completes

3. **No Supabase Save on Manual Save:**
   - **Cause:** `handleManualSave` doesn't call `saveProjectToSupabase`
   - **Location:** `app/[locale]/editor/page.tsx:112-146`
   - **Impact:** Projects only saved locally, not to Supabase

### Missing Error Handling

1. **No Network Error Detection:**
   - **Location:** `lib/supabase/auth.ts`
   - **Impact:** No user feedback on network failures

2. **Silent Failures in Supabase Sync:**
   - **Location:** `lib/store/supabase-sync.ts:39-42`
   - **Impact:** Errors logged but not shown to user

3. **No Handling for QuotaExceededError:**
   - **Location:** `lib/store/project-store.ts` (has handling but may not catch all cases)
   - **Impact:** Large projects may fail silently

### Potential Race Conditions

1. **Auth State Updates:**
   - Multiple state updates can conflict
   - Timeout and listener both update state

2. **Editor Content Sync:**
   - Project store updates trigger editor sync
   - Editor updates trigger project store updates
   - Circular dependency risk

3. **Component Loading:**
   - Components loaded async from Supabase
   - Editor initialized before components ready
   - Blocks may be missing initially

### Type Safety Issues

1. **Loose Type in Component Props:**
   ```typescript
   // lib/types/project.ts
   props: z.record(z.any()) // ⚠️ Any type
   ```

2. **Unsafe Type Assertions:**
   ```typescript
   // lib/store/supabase-sync.ts:73
   return data.data as Project; // ⚠️ No validation
   ```

3. **Missing Null Checks:**
   - Many places assume `currentProject` exists
   - May cause runtime errors if null

---

## SUMMARY

### Key Findings

1. **Authentication:** Functional but has race conditions and missing error handling
2. **GrapesJS:** Custom serialization, not using built-in storage
3. **Project Saving:** Only saves to localStorage, NOT to Supabase (despite functions existing)
4. **Role System:** Uses `profiles.role`, `user_roles` table exists but unused
5. **Theme:** Editor follows site theme correctly
6. **Bugs:** Multiple race conditions, missing error handling, no Supabase sync on manual save

### Critical Issues

1. ⚠️ Manual save doesn't save to Supabase
2. ⚠️ Infinite loading possible due to race conditions
3. ⚠️ Signup redirects before auth completes
4. ⚠️ No project list/dashboard to load saved projects
5. ⚠️ Two conflicting role systems (`profiles.role` vs `user_roles`)

---

**Report Generated:** 2025-01-XX  
**Analysis Scope:** Complete codebase review  
**No Changes Made:** Analysis only, no modifications
