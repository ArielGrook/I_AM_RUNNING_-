# DEV CONSOLE REDESIGN — Implementation Spec

**Task:** 6.8 from TOOLS_SYSTEM_REDESIGN_PLAN  
**Created:** 01.04.2026  
**Status:** Ready for implementation  
**Reference:** IAM Running Dev Console at `app/[locale]/admin/dev-console/page.tsx` (~1200 lines)  
**Target:** lego-base `app/admin/components/AdminDevConsoleTab.tsx` (current: ~70 lines)

---

## What We're Building

A professional code editor with syntax highlighting, preview/edit modes, text selection references, and git history. **NO AI chat panel** — unlike IAM Running, lego-base Dev Console is a pure file editor + git viewer.

### Layout: Two-panel + Bottom Git

```
┌─────────────────────────────────────────────────────┐
│  File Tree (resizable)  │  Code Editor (flex)       │
│  ├── app/               │  ┌─ path.tsx · 245L ────┐ │
│  │   ├── page.tsx       │  │  1│ 'use client';    │ │
│  │   ├── admin/         │  │  2│                   │ │
│  │   └── api/           │  │  3│ import { ... }    │ │
│  ├── memory/            │  │  ...                  │ │
│  └── goals.json         │  │  [Edit] [Save] [Del]  │ │
│                         │  └───────────────────────┘ │
│  ┌─ Git History ───────────────────────────────────┐ │
│  │ abc1234  Phase 6.5 — Task Requests UI    [↩]    │ │
│  │ def5678  Fix TS build error              [↩]    │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Features to Implement

### 1. CodeMirror Syntax Highlighting

**Packages needed (SSH → npm install):**
```bash
npm install @codemirror/view @codemirror/state codemirror @codemirror/lang-javascript @codemirror/lang-css @codemirror/lang-html @codemirror/lang-json @codemirror/theme-one-dark --save
```

**Language detection from IAM Running:**
```typescript
function getLanguageExtension(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': case 'js': case 'jsx':
      return javascript({ typescript: ext === 'ts' || ext === 'tsx', jsx: ext === 'tsx' || ext === 'jsx' });
    case 'css': return css();
    case 'html': return html();
    case 'json': return json();
    default: return javascript();
  }
}
```

**Key CodeMirror setup pattern:**
```typescript
const themeCompartment = useRef(new Compartment());
const langCompartment = useRef(new Compartment());
const readOnlyCompartment = useRef(new Compartment());

// Create editor
const view = new EditorView({
  state: EditorState.create({
    doc: fileContent,
    extensions: [
      basicSetup,
      readOnlyCompartment.current.of(EditorState.readOnly.of(true)), // starts read-only
      themeCompartment.current.of(oneDark), // or light theme
      langCompartment.current.of(getLanguageExtension(filename)),
      EditorView.updateListener.of(update => {
        // Track modifications
        if (update.docChanged) {
          setIsModified(update.state.doc.toString() !== originalContent);
        }
        // Track text selection
        const sel = update.state.selection.main;
        if (!sel.empty) {
          const fromLine = update.state.doc.lineAt(sel.from).number;
          const toLine = update.state.doc.lineAt(sel.to).number;
          const text = update.state.sliceDoc(sel.from, sel.to);
          setCodeSelection({ text, fromLine, toLine });
        } else {
          setCodeSelection(null);
        }
      }),
    ],
  }),
  parent: editorContainerRef.current,
});

// Toggle read-only without rebuilding editor:
editorViewRef.current.dispatch({
  effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(!isEditMode)),
});
```

### 2. Preview → Edit Mode Toggle

**Behavior (copy from IAM Running):**
- File opens in **read-only preview** mode by default
- Header shows: `path/to/file.tsx · 245L` + `[✏️ Edit]` button
- Click Edit → CodeMirror switches to editable, border changes to orange
- Header changes: `[💾 Save]` `[✕ Discard]` `[👁 View]`
- **Modified badge** appears if content differs from original
- **Ctrl+S / Cmd+S** → save
- **Unsaved changes guard:** switching files with unsaved changes → "Discard?" modal
- **Save** → calls existing `apiPost({action:'save', file, content})`

### 3. Text Selection → Reference → Send Message

**This is the killer feature Ariel wants.**

**Behavior:**
1. User selects text in code editor
2. **Floating popup appears** near selection: `📎 Lines 15-23 · [Reference] [Send Message]`
3. Click **"Reference"** → copies reference to clipboard:
   ```
   File: app/page.tsx, Lines 15-23:
   ```const Header = () => {```
   ```  return <div>...</div>```
   ```}```
   ```
4. Click **"Send Message"** → opens message compose with pre-filled reference:
   - Stores reference in state
   - Switches to Messages tab (or opens inline compose)
   - Reference appears as a quote block in the message body
   - User types their message below the reference
   - Send → message goes to selected recipient with code reference

**Implementation approach:**
```typescript
// State
const [codeSelection, setCodeSelection] = useState<{
  text: string;
  fromLine: number;
  toLine: number;
} | null>(null);

const [pendingReference, setPendingReference] = useState<string | null>(null);

// Selection popup (positioned near selection)
{codeSelection && selectedFile && (
  <div style={{
    position: 'absolute',
    // Position near the editor toolbar or as floating popup
    ...popupPosition
  }}>
    <button onClick={() => {
      const ref = `📎 ${selectedFile}:${codeSelection.fromLine}-${codeSelection.toLine}\n\`\`\`\n${codeSelection.text}\n\`\`\``;
      navigator.clipboard.writeText(ref);
      showToast('Reference copied');
    }}>
      📎 Copy Reference ({codeSelection.fromLine}-{codeSelection.toLine})
    </button>
    <button onClick={() => {
      const ref = `📎 ${selectedFile}:${codeSelection.fromLine}-${codeSelection.toLine}\n\`\`\`\n${codeSelection.text}\n\`\`\``;
      setPendingReference(ref);
      // Open message compose UI
      setShowMessageCompose(true);
    }}>
      💬 Send as Message
    </button>
  </div>
)}

// Message compose (inline in Dev Console, or redirect to Messages tab)
{showMessageCompose && pendingReference && (
  <div>
    <select value={msgTo}> {/* recipient */} </select>
    <div style={{...quoteStyle}}>{pendingReference}</div>
    <textarea placeholder="Your message..." />
    <button onClick={sendMessage}>Send</button>
  </div>
)}
```

### 4. File Tree with Context Menu

**From IAM Running — right-click menu:**
- On file: Open | Open in Edit Mode | Copy Path | Delete File
- On folder: New File | New Folder | Delete Folder
- On empty space: New File | New Folder

**Current lego-base** already has a file tree, but it's flat list. Upgrade to:
- Recursive tree rendering with expand/collapse
- Icons: 📁 folders, 📄 files
- Active file highlighted with orange
- File tree expanded state persisted

### 5. Git History Panel

**Current:** Right sidebar with commits list + rollback buttons  
**Upgrade to:**
- Bottom panel (like IAM Running) — resizable via drag handle
- Latest commit highlighted (orange tint)
- Each commit: `hash · message` + rollback button on hover
- Snapshot button in header for quick git commit
- Refresh button

### 6. Resizable Panels

**From IAM Running — draggable dividers:**
```typescript
const [leftWidth, setLeftWidth] = useState(280);
const [dragging, setDragging] = useState(false);

// Drag handle between panels:
<div
  style={{ width: 4, cursor: 'col-resize', background: dragging ? '#555' : 'transparent' }}
  onMouseDown={startDrag}
/>

// Mouse move handler (attached on drag start):
const onMove = (e: MouseEvent) => {
  setLeftWidth(Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
};
```

---

## What NOT to Include (differs from IAM Running)

- ❌ **AI Chat panel** — no chat, no prompt input, no model selector
- ❌ **Deploy/Rollback buttons in header** — keep in admin panel's existing buttons
- ❌ **Settings drawer** — API keys etc, not relevant
- ❌ **Mobile layout** — admin panel is desktop-only for now
- ❌ **Auto-deploy toggle**

---

## Files to Change

| File | Action | Notes |
|------|--------|-------|
| `app/admin/components/AdminDevConsoleTab.tsx` | **FULL REWRITE** (~70 → ~500 lines) | Use `write_file` |
| `app/admin/types.ts` | Add GitCommit type if missing | Check first |
| `app/admin/styles.ts` | May need new style helpers | Minimal |
| `package.json` | CodeMirror deps | Via SSH `npm install` |

---

## Implementation Order

### Step 0: SSH prep
```bash
ssh root@185.5.55.111
cd /var/www/iam-os
npm install @codemirror/view @codemirror/state codemirror @codemirror/lang-javascript @codemirror/lang-css @codemirror/lang-html @codemirror/lang-json @codemirror/theme-one-dark --save
```

### Step 1: Basic CodeMirror editor (replace textarea)
- Import CodeMirror packages
- Mount EditorView in ref
- Read-only by default
- Language detection from filename
- Dark theme (oneDark)

### Step 2: Preview/Edit mode
- readOnly Compartment toggle
- Save/Discard buttons
- Modified state tracking
- Ctrl+S handler
- Unsaved changes guard

### Step 3: Text selection → reference
- Selection tracking via EditorView.updateListener
- Floating action bar when text selected
- "Copy Reference" → clipboard
- "Send Message" → compose with reference

### Step 4: File tree upgrade
- Recursive tree with expand/collapse
- Context menu (right-click)
- New File / Delete actions

### Step 5: Git panel bottom
- Move from right sidebar to bottom panel
- Resizable via drag handle
- Snapshot button

### Step 6: Panel resize
- Draggable divider between file tree and editor
- Persist widths in component state

---

## Key Code Patterns from IAM Running

### EditorView lifecycle
```typescript
// Mount: useEffect with fileContent + isDark + selectedFile as deps
// Destroy previous view before creating new
// Cleanup: view.destroy() in effect cleanup

useEffect(() => {
  if (!editorContainerRef.current) return;
  if (editorViewRef.current) { editorViewRef.current.destroy(); editorViewRef.current = null; }
  if (!fileContent && fileContent !== '') return;
  
  const view = new EditorView({ ... });
  editorViewRef.current = view;
  return () => { view.destroy(); editorViewRef.current = null; };
}, [fileContent, isDark, selectedFile]);
```

### Edit mode toggle (without full rebuild)
```typescript
useEffect(() => {
  if (!editorViewRef.current) return;
  editorViewRef.current.dispatch({
    effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(!isEditMode)),
  });
}, [isEditMode]);
```

### Save handler
```typescript
const handleSave = async () => {
  const content = editorViewRef.current.state.doc.toString();
  await apiPost({ action: 'save', file: selectedFile, content });
  originalContentRef.current = content;
  setIsModified(false);
  showToast('Saved');
};
```

---

## Props Interface

```typescript
interface DevConsoleTabProps extends Pick<AdminSharedProps, 
  'commits' | 'api' | 'apiPost' | 'showToast' | 'loadCommits' | 'members'
> {}
```

Note: `members` needed for message recipient list in "Send Message" feature.

---

## Admin Panel Integration

The Dev Console is a tab inside the admin panel. It uses:
- `api(action, params)` — GET requests to admin panel API
- `apiPost(body)` — POST requests  
- `showToast(msg)` — notification
- `loadCommits()` — refresh git history
- Existing actions: `list-dir`, `read` (file), `save`, `git-rollback`

No new API endpoints needed — all existing.

---

## Reference: Current AdminDevConsoleTab.tsx

Current file is ~70 lines with:
- Flat file browser (not recursive tree)
- Plain textarea (no syntax highlighting)
- Edit button + Save
- Git history in right sidebar

All of this gets replaced with CodeMirror + tree + panels.

---

*This spec is the source of truth for Dev Console redesign.*
*Reference the IAM Running implementation via `i am running:read_file app/[locale]/admin/dev-console/page.tsx`*
