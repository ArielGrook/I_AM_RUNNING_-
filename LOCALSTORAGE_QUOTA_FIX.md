# localStorage QuotaExceededError Fix

## Problem
ZIP import was working correctly, but components would disappear after ~1 second due to a `QuotaExceededError` when trying to persist large projects to localStorage.

## Root Cause
1. **Zustand persist middleware** automatically saves state to localStorage on every state change
2. **Large projects** (with many components containing full HTML) can exceed localStorage quota (~5-10MB typical limit)
3. **No size checking** before attempting to save, causing QuotaExceededError
4. **No error handling** in persist middleware, leading to silent failures

## Solution

### 1. Custom Safe localStorage Wrapper (`lib/store/project-store.ts`)

Created `createSafeLocalStorage()` that:
- **Checks size before saving**: Calculates project size and compares against 3MB threshold
- **Skips persist for large projects**: Prevents QuotaExceededError by not attempting to save projects over the threshold
- **Handles QuotaExceededError gracefully**: Catches errors and logs warnings without throwing
- **Comprehensive logging**: Tracks size, thresholds, and persist decisions

```typescript
const MAX_LOCALSTORAGE_SIZE = 3 * 1024 * 1024; // 3MB threshold

const createSafeLocalStorage = (): StateStorage => {
  return {
    setItem: (name: string, value: string): void => {
      const size = new Blob([value]).size;
      if (size > MAX_LOCALSTORAGE_SIZE) {
        console.warn('⚠️ Project too large, skipping localStorage persist');
        return; // Skip persist to prevent QuotaExceededError
      }
      try {
        localStorage.setItem(name, value);
      } catch (error: any) {
        if (error?.name === 'QuotaExceededError') {
          console.error('❌ QuotaExceededError: localStorage full');
        }
        // Don't throw - gracefully handle
      }
    },
    // ... getItem, removeItem
  };
};
```

### 2. Enhanced Project Loading (`app/[locale]/editor/page.tsx`)

Improved `handleImport()` to:
- **Calculate and log project size** before loading
- **Better error handling** in loadProject() with try-catch
- **Warn users** when large projects won't be persisted
- **Proper progress dialog cleanup** in all code paths (success and error)

### 3. Defensive GrapeEditor Handling (`components/editor/GrapeEditor.tsx`)

Added defensive checks to handle cases where `currentProject` might be null:
- **Early return with warning** if currentProject is null
- **Better logging** to track when/why project becomes null

## Key Changes

### `lib/store/project-store.ts`
- ✅ Added `calculateSize()` utility function
- ✅ Created `createSafeLocalStorage()` wrapper with size checks
- ✅ Updated persist config to use safe storage
- ✅ Enhanced `partialize()` with size logging

### `app/[locale]/editor/page.tsx`
- ✅ Added project size calculation and logging in `handleImport()`
- ✅ Enhanced error handling with try-catch around `loadProject()`
- ✅ Added warning messages for large projects
- ✅ Improved progress dialog cleanup in all paths

### `components/editor/GrapeEditor.tsx`
- ✅ Added defensive null check for `currentProject` with warning log

## Behavior Changes

### Before
- ❌ Large projects attempted to save to localStorage
- ❌ QuotaExceededError thrown, causing components to disappear
- ❌ No warning or indication that persist failed
- ❌ No size tracking or logging

### After
- ✅ Projects over 3MB skip localStorage persist (no error thrown)
- ✅ Clear logging shows size checks and persist decisions
- ✅ Warning messages inform users when projects are too large
- ✅ Projects still work in memory, just won't persist across page reloads
- ✅ Graceful degradation: large projects work, just without localStorage persistence

## Future Improvements

1. **IndexedDB Integration**: For projects over 3MB, use IndexedDB instead of localStorage (higher quota ~50MB+)
2. **Supabase Sync**: Large projects should be saved to Supabase instead (already implemented, but could be enhanced)
3. **Compression**: Consider compressing project data before persisting (LZ-string or similar)
4. **Incremental Persistence**: Only persist changed components, not the entire project

## Testing

To test the fix:
1. Import a large ZIP file (containing many components with HTML)
2. Check browser console for size logging:
   - Should see: `📊 Storage size check` with size information
   - If over 3MB: `⚠️ Project size exceeds threshold. Skipping localStorage persist`
3. Verify components remain visible (should not disappear after 1 second)
4. Verify project works in editor (components editable, etc.)
5. **Note**: Large projects won't persist across page reloads - this is expected behavior

## Logging

The fix includes comprehensive logging:
- `[Project Store] 📊 Storage size check` - Size comparison before save
- `[Project Store] ⚠️ Project size exceeds threshold` - Large project warning
- `[Project Store] ✅ Successfully persisted` - Successful save
- `[Project Store] ❌ QuotaExceededError` - Error handling
- `[ZIP Import] 📊 Project size` - Size at import time

## Threshold

**Current threshold: 3MB**
- localStorage typically has 5-10MB limit
- 3MB provides safe margin for other app data
- Can be adjusted in `MAX_LOCALSTORAGE_SIZE` constant if needed

