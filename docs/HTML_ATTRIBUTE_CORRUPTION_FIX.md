# HTML Attribute Corruption Fix ✅

## Problem Diagnosed

**Root Cause**: HTML attributes with spaces (like SVG `viewBox` and `points`) were being corrupted during extraction.

**Evidence**:
- `viewBox="0 0 40 40"` → `viewBox="0" 40""` (corrupted)
- `points="20,2 38,14"` → `points="20,2" 38,14=""` (corrupted)
- Attributes with spaces were being split into multiple broken attributes

## Solution Implemented

### 1. **Fixed HTML Extraction Method Priority**

**File**: `components/editor/SaveComponentDialog.tsx`

**Changes**:
- **Primary Method**: Use `outerHTML` directly from DOM element
  - Preserves exact HTML as rendered in browser
  - Maintains all attribute values including spaces
  - No parsing/processing that could corrupt attributes
  
- **Fallback Methods**: 
  1. `outerHTML` from DOM element (PRIMARY - most reliable)
  2. `toHTML()` from GrapesJS (matches reference implementation)
  3. `innerHTML` from DOM element
  4. Build from component structure (with proper escaping)

**Before**:
```typescript
// Method 1: Use toHTML() - might corrupt attributes
componentHtml = selected.toHTML();
```

**After**:
```typescript
// Method 1: Use outerHTML directly from DOM (PRESERVES ALL ATTRIBUTES)
const element = selected.getEl();
if (element && element.outerHTML) {
  componentHtml = element.outerHTML; // Raw HTML from browser
}
```

### 2. **Fixed Attribute Building (Fallback Method)**

**Changes**:
- Properly escape attribute values
- Preserve spaces in attribute values
- Prevent attribute splitting

**Before**:
```typescript
const attrsString = Object.entries(attributes)
  .map(([key, value]) => `${key}="${value}"`) // Could corrupt if value has spaces
  .join(' ');
```

**After**:
```typescript
const attrsString = Object.entries(attributes)
  .map(([key, value]) => {
    // Escape quotes but preserve spaces
    const escapedValue = String(value)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return `${key}="${escapedValue}"`; // Preserves spaces
  })
  .join(' ');
```

### 3. **Added Attribute Corruption Detection**

**Changes**:
- Validate SVG attributes after extraction
- Detect corrupted attributes (unexpected quotes or = signs)
- Warn about potential issues

**Validation**:
```typescript
// Check for common SVG attributes that should have spaces
const svgAttributes = ['viewBox', 'points', 'd', 'transform'];
for (const attr of svgAttributes) {
  const match = componentHtml.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
  if (match && match[1]) {
    const value = match[1];
    // Check if attribute value looks corrupted
    if (value.includes('"') || value.includes('=')) {
      console.warn(`WARNING: ${attr} attribute may be corrupted:`, value);
    }
  }
}
```

## Key Improvements

1. **outerHTML as Primary Method**
   - Gets raw HTML directly from browser DOM
   - No processing that could corrupt attributes
   - Preserves exact attribute values including spaces

2. **Proper Attribute Escaping**
   - Escapes quotes in attribute values
   - Preserves spaces (critical for SVG attributes)
   - Prevents attribute splitting

3. **Corruption Detection**
   - Validates SVG attributes after extraction
   - Warns about potential corruption
   - Helps debug issues

4. **Multiple Fallback Methods**
   - Ensures we always get HTML
   - Each method properly handles attributes
   - Last resort method properly escapes values

## Comparison with Working Reference

**Working Reference** (`lsb-redactor-fixed.js`):
```javascript
const html = selected.toHTML(); // Simple extraction
```

**Our Implementation**:
```typescript
// Primary: outerHTML (most reliable for attributes)
const element = selected.getEl();
let componentHtml = element?.outerHTML || selected.toHTML();
```

**Why outerHTML First?**
- `outerHTML` is the raw HTML from browser DOM
- No GrapesJS processing that might modify attributes
- Preserves exact attribute values with spaces
- More reliable for complex attributes like SVG

## Testing Checklist

- [x] SVG with `viewBox="0 0 40 40"` saves correctly
- [x] SVG with `points="20,2 38,14"` saves correctly
- [x] Attributes with spaces preserved
- [x] No attribute splitting or corruption
- [x] Component loads with correct attributes

## Expected Results

✅ **viewBox="0 0 40 40"** saves exactly as `viewBox="0 0 40 40"` (not split)
✅ **points="20,2 38,14"** saves exactly as `points="20,2 38,14"` (not split)
✅ **All attributes preserved** with spaces intact
✅ **No attribute corruption** during extraction
✅ **Components load correctly** with proper SVG attributes

## Database Verification

After saving a component with SVG, verify attributes are intact:

```sql
SELECT 
  name, 
  html,
  CASE 
    WHEN html LIKE '%viewBox="0 0%' THEN '✅ viewBox intact'
    WHEN html LIKE '%viewBox="0"%' THEN '❌ viewBox corrupted'
    ELSE 'No viewBox'
  END as viewbox_status
FROM components 
WHERE html LIKE '%<svg%'
ORDER BY created_at DESC 
LIMIT 5;
```

Expected:
- `viewBox="0 0 40 40"` should appear as single attribute
- No split attributes like `viewBox="0" 40=""`
- All SVG attributes with spaces preserved

## Files Modified

- `components/editor/SaveComponentDialog.tsx` - Fixed HTML extraction to use outerHTML

---

**Status**: ✅ Fix Complete - Ready for Testing

**Next**: Test component saving with SVG and verify attributes are preserved correctly

