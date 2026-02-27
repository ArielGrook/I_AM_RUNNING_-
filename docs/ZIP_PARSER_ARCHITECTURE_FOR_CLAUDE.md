# I AM RUNNING — ZIP Parser Architecture (for Claude)

This document gives another AI (Claude) full context to fix the **ZIP template parser** so imported templates keep animations, interactivity, and JS behavior.

---

## 1. Full Project Structure (focus: parser + editor)

```
app/
├── [locale]/                    # i18n routes
│   ├── editor/
│   │   └── page.tsx             # Main editor UI; calls parseTemplate(), grapeEditorRef.setComponents(firstPage.html)
│   ├── admin/page.tsx           # Admin panel
│   ├── auth/login, signup, callback
│   ├── chat/page.tsx
│   ├── layout.tsx               # Locale layout
│   ├── page.tsx                 # Landing
│   ├── privacy, profile, settings, subscription, terms
│   └── ...
├── api/
│   ├── parser/route.ts          # Uses parseZip() from lib/parser (NOT simple-parser) — different code path
│   ├── chat/, stream/, health/, paypal/, preview/
│   └── ...
├── debug/grapes-test/page.tsx   # Dev page that also imports ZIP via parseTemplate
├── globals.css
├── layout.tsx
└── page.tsx

components/
├── editor/
│   ├── GrapeEditor.tsx          # GrapesJS wrapper; setComponents(html), hasStyleTag check, no inline CSS for ZIP
│   ├── ChatPanel.tsx
│   ├── ImportProgressDialog.tsx # Progress during ZIP import
│   ├── AddScreenshotButton, GradientBuilder, PreviewModal, SaveComponentDialog, StyleManager, etc.
│   └── ...
├── auth/, landing/, motion/, payment/, providers/, ui/
└── ...

lib/
├── parser/
│   ├── simple-parser.ts        # MAIN ZIP PARSER USED BY EDITOR — parseTemplate(file) → { pages, css, stats }
│   ├── index.ts                # Exports parseZip() (component-based parser) — used by API only
│   ├── types.ts                # ParseProgress, ParseResult, ZipParseError
│   ├── builder.ts              # Build ZIP from project
│   └── v2/                     # Alternative parser (zip-extractor, css-processor, html-processor, etc.)
│       ├── index.ts, zip-extractor.ts, css-processor.ts, html-processor.ts, page-builder.ts, ...
│       └── (not used by editor page for import — editor uses simple-parser)
├── store/
│   ├── project-store.ts        # Zustand: currentProject, updateProject, loadProject
│   └── supabase-sync.ts
├── utils/
│   ├── css-to-inline.ts        # convertCssToInlineStyles() — used only when !hasStyleTag
│   ├── sanitize.ts             # Chat/prompt sanitization (not used for editor HTML)
│   └── ...
├── grapesjs/catalog-blocks.ts
├── types/project.ts
└── ...

Config:
├── next.config.js
├── tailwind.config.js
├── package.json                # grapesjs, jszip, node-html-parser, etc.
└── ...
```

**Important:** The **editor** (`app/[locale]/editor/page.tsx`) imports and uses **`parseTemplate` from `@/lib/parser/simple-parser`**. The **API** route `app/api/parser/route.ts` uses **`parseZip` from `@/lib/parser`** (index), which is a different parser (component-based). All “ZIP import in editor” behavior is driven by **simple-parser.ts**.

---

## 2. Parser Architecture — `lib/parser/simple-parser.ts`

### 2.1 Main function

- **Name:** `parseTemplate(file, debug?)`
- **Signature:**  
  `parseTemplate(file: File | Blob | ArrayBuffer, debug: boolean = false): Promise<ParseTemplateResult>`
- **Input:** One ZIP file (browser `File`, `Blob`, or `ArrayBuffer`).
- **Output:** `ParseTemplateResult`:

```ts
interface ParsedPage {
  name: string;   // e.g. 'index.html', 'about.html'
  html: string;   // Processed HTML: <style> + body content (with base64 assets, scripts)
  css: string;    // Page-specific CSS (usually from <style> in that HTML)
}

interface ParseTemplateResult {
  pages: ParsedPage[];
  css: string;    // Shared CSS (merged from all .css files)
  stats: { totalFiles, htmlFiles, cssFiles, imagesConverted, jsFilesConverted?, fontsConverted? };
}
```

### 2.2 Processing flow (step by step)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Load ZIP                                                            │
│  zip = new JSZip(); zipContents = await zip.loadAsync(file);                 │
│  (lines 60–70)                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: First pass over ZIP entries                                         │
│  For each file:                                                              │
│    - .html/.htm → htmlFiles.push({ path, name })                              │
│    - .css → read as string → cssFiles.push({ path, content })                │
│    - images (jpg,png,gif,webp,svg,ico) → blobToDataUrl → imageMap.set()     │
│    - .js → base64 data URL → jsMap.set(path + variations)                    │
│    - fonts (woff,woff2,ttf,eot,otf) → base64 data URL → fontMap.set()        │
│  (lines 72–178)                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Merge CSS                                                           │
│  sharedCss = ''; for each cssFile:                                           │
│    cssContent = inlineCssImports(cssContent, path, zipContents)             │
│    cssContent = replaceCssAssetPaths(cssContent, imageMap)                    │
│    cssContent = replaceFontPaths(cssContent, fontMap)                         │
│    sharedCss += comment + cssContent                                          │
│  (lines 181–196)                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: For each HTML file                                                  │
│  4a. Parse HTML: doc = parse(htmlContent)  // node-html-parser               │
│  4b. Scripts: doc.querySelectorAll('script[src]') — replace src with         │
│      jsMap base64 or SCRIPT_CDN_MAP; remove duplicates (processedScriptPaths)│
│  4c. bodyHtml = body.innerHTML                                              │
│  4d. Append head <script src="..."> (only script[src]!) as strings to bodyHtml│
│  4e. bodyHtml = replaceHtmlAssetPaths(bodyHtml, imageMap)  // src, href, poster, srcset │
│  4f. Extract <style> from doc → pageCss (inline @import, replace url(), fonts)│
│  4g. bodyHtml = '<style id="template-styles">' + sharedCss + pageCss + bodyHtml│
│  4h. pages.push({ name, html: bodyHtml, css: pageCss })                      │
│  (lines 201–387)                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Sort pages (index.html first), return { pages, css: sharedCss, stats } │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Key helper functions

| Function | Location | Purpose |
|----------|----------|---------|
| `inlineCssImports(css, basePath, zipContents, log, logError)` | ~381–428 | Resolve `@import url(...)` / `@import "..."` and inline those CSS files from ZIP; recursive. |
| `replaceFontPaths(css, fontMap, log)` | ~434–472 | In `@font-face`, replace `url(...)` with base64 data URLs from fontMap. |
| `replaceCssAssetPaths(css, imageMap)` | ~458–484 | Replace `url(...)` in CSS with image base64 from imageMap. |
| `replaceHtmlAssetPaths(html, imageMap)` | ~491–434 | Regex replace of `src="..."`, `href="..."`, `poster="..."`, `srcset="..."` with imageMap base64. **Does NOT touch `data-*` or other attributes.** |
| `blobToDataUrl(blob, extension)` | ~477–502 | FileReader readAsDataURL for images. |
| `normalizePath(path)` | ~374–380 | Normalize path (backslash → slash, strip `./`, `../`, trim). |

There is **no** dedicated `processHTML()`; HTML is handled inline in the “For each HTML file” loop (steps 4a–4h).

### 2.4 Script handling (critical for “mechanics” and animations)

- **Duplicate detection:** `processedScriptPaths` (Set). For each `script[src]`, normalized path and filename are added; if already in set, that script is **removed** (duplicate).
- **Replacement:**  
  - If path is in `jsMap` → set `src` to base64 data URL.  
  - Else check `SCRIPT_CDN_MAP` (substring match on `originalSrc.toLowerCase()`):  
    - Keys: `jquery`, `bootstrap`, `owl.carousel`, `slick`, `isotope`.  
    - **GSAP, AOS, Lottie, Swiper, etc. are NOT in SCRIPT_CDN_MAP** — they stay as original path or fail if path not in jsMap.
- **Order:**  
  - `bodyHtml = body.innerHTML` (so all body content, including body scripts, keeps its order).  
  - Then **head scripts** (only `script[src]`) are **appended at the end** of `bodyHtml`.  
  - So final order is: [body content + body scripts] + [head scripts]. If the original page had libs in head and init in body, the init runs **before** libs in the output — **wrong load order**.
- **Inline scripts in &lt;head&gt;:** Only `script[src]` from head are moved. **Inline `<script>...</script>` in head are never appended** (we never read head’s innerHTML or head’s script nodes without `src`). So **head inline scripts are dropped**.

### 2.5 Data attributes and other HTML

- `bodyHtml` comes from `body.innerHTML` (node-html-parser). Serialization keeps attributes.
- `replaceHtmlAssetPaths` only replaces `(src|href|poster)` and `srcset`; it does **not** modify `data-*` or other attributes. So in **simple-parser** itself, **data-* are preserved** in the string. If they are lost, the cause is likely later (e.g. GrapesJS parser or sanitization).

---

## 3. Integration with the editor

### 3.1 Where the parser is called

- **File:** `app/[locale]/editor/page.tsx`
- **Handler:** `handleImport()` (e.g. ~428–590).
- **Flow:**
  1. User picks a file → `parseTemplate(file, true)` (simple-parser).
  2. `setPages(result.pages)`, `setActivePage(0)`, `setImportResult({ css: result.css })`.
  3. `grapeEditorRef.current.setComponents(firstPage.html)`.
  4. `grapeEditorRef.current.setStyle(allCss)` (shared + first page CSS).
  5. No conversion to “components” array; HTML string is set directly.

So: **Result of parsing is passed to the editor only as HTML string** via `setComponents(firstPage.html)`.

### 3.2 How the result is passed to GrapesJS

- **Editor page:**  
  `grapeEditorRef.current?.setComponents(firstPage.html);`  
  Then `setStyle(allCss)`.
- **GrapeEditor ref implementation** (`components/editor/GrapeEditor.tsx`):  
  `setComponents(html)` calls `grapesEditorRef.current.setComponents(html)` (optionally with sanitize only on failure).

So the **exact** HTML string from `firstPage.html` (including `<style id="template-styles">`, scripts, and body) is what GrapesJS receives.

### 3.3 ZIP import vs “normal” content

- **ZIP import path:** Parser produces HTML that already starts with `<style id="template-styles">...` and contains scripts. This HTML is set via `setComponents(firstPage.html)` from the editor page. The store is updated with `setPages(result.pages)` etc.; the GrapeEditor **useEffect** that syncs from `currentProject` can also run and call `setComponents(htmlWithInlineStyles)` when building from `firstPage.components` — but for ZIP, the editor page does **not** put parsed result into `currentProject.pages[0].components` as an array; it only calls `setComponents` with the string. So the “ZIP import” path is: **direct `setComponents(firstPage.html)`** from the editor page.
- **Normal load:** Project is loaded from store; `firstPage.components` can be string (HTML) or array; GrapeEditor builds `htmlFromComponents` and then applies `hasStyleTag` logic.

### 3.4 `hasStyleTag` and why we do NOT inline CSS for ZIP

- **Where:** `components/editor/GrapeEditor.tsx` (~851–870).
- **Logic:**
  - `hasStyleTag = htmlFromComponents.includes('<style') || htmlFromComponents.includes('<STYLE')`.
  - If `hasStyleTag` is true, we **do not** call `convertCssToInlineStyles()`; we use HTML as-is.
  - Inline conversion is done only when `css && !hasStyleTag`.
- **Reason:** ZIP output already contains a `<style id="template-styles">` block. Converting that to inline was found to lose elements or structure; so for ZIP we keep the hybrid approach: CSS stays in `<style>`, not inlined.

---

## 4. Problem to solve (symptoms and where in code)

### 4.1 Symptoms

- Animations do not work (GSAP, AOS, Lottie, CSS @keyframes).
- Interactivity is static (sliders, modals, carousels).
- Canvas/WebGL not initialized.
- Dynamic JavaScript does not run.
- `data-*` attributes sometimes lost.

What **does** work: HTML structure, CSS styling, images as base64, multi-page parsing.

### 4.2 Where animation/libs can be lost

1. **SCRIPT_CDN_MAP missing libs** (`simple-parser.ts` ~336–343)  
   Only: jquery, bootstrap, owl.carousel, slick, isotope.  
   **GSAP, AOS, Lottie, Swiper, etc.** are not mapped. If their `src` path is not in `jsMap` (e.g. path mismatch, different folder layout), the script tag keeps a broken relative path and never loads.

2. **Script load order** (`simple-parser.ts` ~286–318)  
   Head scripts are **appended after** body content. So body scripts (e.g. “init”) run before head libs. **Fix:** Prepend head scripts (or at least “library” scripts) before body content, or maintain original order (e.g. head scripts first, then body).

3. **Inline scripts in head dropped** (`simple-parser.ts` ~291–317)  
   Only `script[src]` from head are moved to body. Inline `<script>...</script>` in head are never copied → **lost**. Many templates put config or small inline scripts in head.

4. **GrapesJS canvas iframe and script execution**  
   Canvas is an iframe (`GrapeEditor.tsx` canvas config). When HTML is set via `setComponents()`, scripts in that HTML may:
   - Be stripped or not executed by the editor for security.
   - Run in a different context (CSP, sandbox).
   - Not re-run on every setComponents.  
   So even if the parser keeps scripts, they might not run inside the canvas. Preview/full page might be needed for full behavior.

### 4.3 Where script order / duplication is decided

- **simple-parser.ts** ~212–284:  
  - All `script[src]` in document are processed; duplicates removed by `processedScriptPaths`.  
  - Head scripts are then appended at **end** of `bodyHtml` (~312–315).  
  So: **order is wrong** (body first, head last). Deduplication is by path/filename only.

### 4.4 Where data-* could be lost

- **simple-parser:** `replaceHtmlAssetPaths` does not touch `data-*`. So parser keeps them.
- **GrapeEditor.tsx** `sanitizeHtml()` (~60–79): Only fixes malformed attributes (e.g. quote in name, double quote at end of value). It does not strip `data-*`.
- **GrapesJS** internal parser might drop unknown or `data-*` attributes when building the component model — worth checking GrapesJS parser options and which attributes are allowed.

### 4.5 External CDN scripts

- If `script src` is already `https://...`, it is **not** replaced by jsMap. In the CDN fallback branch (~269–277), we only check `SCRIPT_CDN_MAP` by substring; we do not “keep external URL as-is” explicitly in that loop, but if no jsMap hit and no CDN map hit, the tag is left with original `src`. So `https://...` URLs remain. Issues could be:
  - CSP or iframe sandbox blocking external scripts in canvas.
  - Or scripts not re-executed when injected via setComponents.

---

## 5. Important implementation details

### 5.1 localStorage before import

- **Where:** `app/[locale]/editor/page.tsx` ~487–506.
- **Order:** Clear canvas → `setPages([])` etc. → **wait 150ms** → then remove all `localStorage` keys starting with `gjs-`, and `project-storage`.
- **Reason:** Let GrapesJS create its keys after clear, then remove them so the new import is not mixed with old state.
- **Delay:** 150ms so that clear has time to run and keys to appear before we delete them.

### 5.2 Script deduplication (simple-parser)

- **Set:** `processedScriptPaths` (per HTML file).
- **When adding:** For each `script[src]`, we add `normalizePath(originalSrc)` and `originalFileName` (e.g. `jquery.min.js`).
- **Duplicate:** If either is already in the set, the script is **removed** from the DOM and skipped. So same filename in different paths can be considered duplicate (e.g. `js/jquery.min.js` and `vendor/jquery.min.js` → second removed).

### 5.3 CSS handling (hybrid, no full inline for ZIP)

- **Why hybrid:** Full inline was losing structure; ZIP output keeps a single `<style id="template-styles">` with shared + page CSS.
- **Where injected:** `simple-parser.ts` ~370–376:  
  `bodyHtml = '<style id="template-styles">' + allCss + '</style>\n' + bodyHtml`
- **@import:** Resolved and inlined by `inlineCssImports()` from ZIP.
- **@keyframes / @media:** Kept in that CSS string; no special stripping. They live inside `<style id="template-styles">`. If animations still don’t run, the cause is likely scripts (order, missing libs) or GrapesJS iframe not running JS, not CSS removal.

### 5.4 HTML extraction (body only, head scripts moved)

- **What we take:** `body.innerHTML` only. So we do **not** keep `<head>` structure (meta, title, link, etc.).
- **What we do with head:** Only `script[src]` from head are re-created as tags and **appended** to the end of `bodyHtml`. No other head elements (no inline head scripts, no link, no meta).
- **Inline scripts in body:** They stay inside `body.innerHTML`, so they are preserved in the string. Execution still depends on GrapesJS/iframe behavior.

---

## 6. Summary for Claude

| Topic | Summary |
|-------|--------|
| **Which parser** | Editor uses **simple-parser** `parseTemplate()`. API uses **parseZip()** from index (different). |
| **Output** | `{ pages: [{ name, html, css }], css: sharedCss, stats }`. `html` = `<style id="template-styles">` + body content (scripts, images base64). |
| **How editor gets it** | `grapeEditorRef.current.setComponents(firstPage.html)` and `setStyle(allCss)`. |
| **Script issues** | (1) Head scripts appended at end → wrong order. (2) Head inline scripts dropped. (3) GSAP/AOS/Lottie etc. not in CDN map; rely on jsMap path match. (4) Canvas iframe may not run scripts. |
| **data-*** | Parser does not remove them. Check GrapesJS parser/sanitizer if they disappear. |
| **CSS** | Not inlined for ZIP (`hasStyleTag`); kept in `<style id="template-styles">`. @import inlined from ZIP. |
| **localStorage** | Cleared 150ms after canvas clear; all `gjs-*` and `project-storage` removed before import. |

Use this document to locate exact lines in `lib/parser/simple-parser.ts` and `components/editor/GrapeEditor.tsx`, and to propose concrete changes (script order, CDN map, head inline scripts, and GrapesJS script execution in canvas).
