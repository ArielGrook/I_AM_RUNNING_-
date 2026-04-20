# ROADMAP 17 EXTENDED — RAG Pipeline + Persistent Memory + Ollama Tool Calling

**Status:** v4 — post-round-2-Cursor-review (19.04.2026)
**Author:** Ariel + Opus 4.7 + Cursor Ask (2 rounds)
**Replaces:** iamrunner.ai/roadmaps/ROADMAP_17_RAG_PIPELINE_UNIFICATION.md (original narrow scope)
**Scope:** Local AI работает как полноценный агент — агент помнит, агент действует, агент понимает проект.

**Environment context:** Windows, RTX 3050 8GB VRAM, Qwen2.5-Coder:7b через Ollama, проект в `C:\Users\marce\OneDrive\Desktop\I_AM_RUNNING\I_AM_RUNNING_PLATFORM\iamrunner-ai` (OneDrive-synced).

---

## Цель

К концу Roadmap 17 локальная Ollama модель должна уметь выполнять сценарии:

1. *"Зайди в `src/main/rag/indexer.ts`"* → `read_file` → возвращает контент
2. *"Найди где определена функция `queryChunks`"* → `search_files("queryChunks")` → находит
3. *"Сделай аудит этого файла"* → использует RAG + PM → структурированный ответ
4. *"Допиши функцию X в этот файл"* → `patch_file` или `write_file`
5. *"Помни что в этом проекте мы не используем Redux"* → автоматически записывается в `rag/memory/anti_patterns.md`

---

## Архитектурные принципы

1. **Один путь к RAG.** Вся индексация только из `{project}/rag/`. KB — это UI над этой папкой.
2. **Память = данные, не веса.** Persistent memory живёт как markdown документы в `rag/memory/`, доступна через RAG query, инжектится в tool results как shadow hints.
3. **Модель без изменений.** 17 не трогает веса Ollama. Fine-tune отложен в Roadmap 18.
4. **Совместимость.** Shadow hints работают одинаково для Ollama и Claude.
5. **Один sub-phase = один коммит.** 17A = 9 маленьких коммитов, 17B-D по одному.
6. **Incremental is king.** Никакого `clearIndex() + indexProject()` при маленьких операциях. Targeted delete + incremental add.
7. **Hostile environment.** Windows + OneDrive = placeholder files, symlinks, path length limits, EBUSY. Guards обязательны.

---

## Phase 17A — Pipeline Unification + Polish

### Цель
Индексатор и Knowledge Base работают с одной папкой `{project}/rag/`. Batched operations, targeted deletes, Windows/OneDrive guards, Ollama context window в Settings. Всё incremental где возможно.

### Порядок реализации (пересмотрен после review)

**17A.0 ships first — полностью независимый, 3 строчки, immediate UX win.** Остальные ship в указанном порядке.

### Файлы для изменения
- `src/main/ai-provider.ts` (17A.0)
- `src/main/rag/indexer.ts`
- `src/main/rag/vector-store.ts`
- `src/main/knowledge-base.ts`
- `src/main/ipc-handlers.ts`
- `src/main/storage.ts`
- `src/renderer/screens/KnowledgeBase.tsx`
- `src/renderer/screens/AiChat.tsx`
- `src/renderer/screens/Settings.tsx`
- `src/renderer/stores/ai.ts`

---

### 17A.0 — Ollama context window + generation params *(SHIP FIRST)*

**Отдельный маленький PR, independent от всего RAG. Deliverable: user сразу видит что Qwen перестал быть "тупым" — контекст вырос в 4 раза.**

**Проблема:** Ollama default `num_ctx: 2048`. Qwen2.5-Coder:7b поддерживает 128K, но видит только 2K. Default `num_predict: 128` (!) обрезает ответы. Это корень ощущения "Qwen не работает" — конфиг плохой, не модель.

**Правка в `src/main/ai-provider.ts` → `ollamaChat()` → body:**

```typescript
const body = {
  model,
  messages: wire,
  stream: true,
  tools: tools.length > 0 ? ollamaTools : undefined,
  options: {
    num_ctx: config.numCtx || 8192,
    num_predict: config.numPredict || 2048,  // NOTE: 2048 not 4096 — Qwen 7B drifts on long outputs
    temperature: config.temperature ?? 0.3,
  },
};
```

**Обновить `AiConfig`:**
```typescript
export interface AiConfig {
  provider: AiProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  numCtx?: number;       // 2048 | 4096 | 8192 | 16384 | 32768
  numPredict?: number;   // 1024 | 2048 | 4096
  temperature?: number;  // 0-1
}
```

**VRAM math (для reference, RTX 3050 8GB, Qwen2.5-Coder 7B Q4_K_M):**

| num_ctx | Estimated VRAM | Комфорт |
|---------|----------------|---------|
| 2048 | ~5.0 GB | 🔴 default — мало |
| 4096 | ~5.5 GB | 🟡 компакт |
| 8192 | ~6.5 GB | 🟢 **sweet spot** |
| 16384 | ~7.5 GB | 🟡 впритык, OOM риск |
| 32768 | >8 GB | ❌ не влезет |

Расчёт: weights Q4 ≈ 4.7 GB, KV-cache at 8K context with GQA (4 KV heads) ≈ 500 MB, scratch ≈ 500 MB, Electron/OS/desktop ≈ 800 MB. Итого ~6.5 GB на 8K.

**Settings UI (`src/renderer/screens/Settings.tsx`) — новая секция:**

```
┌─ Ollama Performance ──────────────────────────────────┐
│ Context window (num_ctx):   [ 8192 ▼ ]                │
│   2048 - Minimal                                       │
│   4096 - Compact                                       │
│ ▶ 8192 - Recommended                                   │
│   16384 - Aggressive                                   │
│   32768 - Maximum (12GB+ VRAM required)               │
│                                                        │
│ Max output (num_predict):   [ 2048 ▼ ]                │
│   1024 / 2048 / 4096                                   │
│                                                        │
│ Temperature:                [ 0.3 ▼ ]                  │
│                                                        │
│ ⚠ Restart AI Chat after changing                      │
└────────────────────────────────────────────────────────┘
```

**Auto-detect: ДРОПНУТЬ.** Ollama `/api/tags` не возвращает VRAM, nvidia-smi хрупко на не-Nvidia системах. Пресеты достаточно.

**OOM handling:** catch в `ollamaChat` на response 500 + stderr parse "out of memory" → throw `new Error('OLLAMA_OOM: reduce num_ctx in Settings')` → `AiChat` показывает banner с кнопкой "Reduce to 4096".

Persist в `storage.ts` → `aiConfig.numCtx`, `aiConfig.numPredict`, `aiConfig.temperature`. Existing configs без этих полей → defaults applied.

**Claude провайдер:** игнорирует новые поля. `claudeChat` не читает `config.numCtx`. Ок.

**Проверка 17A.0**
- [ ] Settings UI показывает выбор num_ctx/num_predict/temperature
- [ ] Смена num_ctx на 8192 → перезапуск AI chat → реально применяется (можно проверить через `ollama ps` — column CONTEXT)
- [ ] Прочитать файл ~3000 строк + задать вопрос по нему — Qwen не теряет контекст
- [ ] Настройка 16384 на 8GB GPU → OOM → понятный banner (не crash)
- [ ] Claude продолжает работать как раньше
- [ ] Config persistence: перезапустить app → настройки сохранились

**Коммит 17A.0:**
```
feat(ollama): expose num_ctx, num_predict, temperature in Settings

- ai-provider.ts: pass options to Ollama /api/chat
- default num_ctx 8192 (was 2048), num_predict 2048 (was 128)
- AiConfig extended with new optional fields
- Settings UI: Ollama Performance section
- OOM detection + user-friendly banner
```

---

### 17A.1 — Индексатор только на `rag/`

**Файл:** `src/main/rag/indexer.ts` → `indexProject(projectPath)`

```typescript
// BEFORE:
const files = await walkProjectFiles(projectPath);

// AFTER:
const ragDir = join(projectPath, 'rag');
if (!existsSync(ragDir)) await mkdir(ragDir, { recursive: true });
const files = await walkProjectFiles(ragDir);
```

**Новая константа:**
```typescript
const RAG_EXTENSIONS = new Set(['.md', '.txt', '.json']);
```
Использовать в `walkProjectFiles` когда scope = rag/. Legacy `ALLOWED_EXTENSIONS` НЕ трогаем — может использоваться где-то ещё.

**SKIP_DIRS расширение:** добавить `_templates`, `_archive`, `memory/_archive` — зарезервировано для 17B/C.

**Abort guard на смену project:**
Добавить проверку в начале indexProject:
```typescript
if (currentIndexRoot && currentIndexRoot !== ragDir) {
  // project switched mid-index — abort old run
  abortCurrentIndexing();
}
```

**Коммит 17A.1:** `feat(rag): scope indexer to {project}/rag/ only`

---

### 17A.2 — Knowledge Base: thin layer над `rag/`

**Файл:** `src/main/knowledge-base.ts`

**КРИТИЧНО — удалить явно:**
- **Удалить строки 64-77** (старый `addChunk()` direct-write block) — KB больше не пишет в vectra напрямую.
- **Удалить функцию `chunkText()` полностью (строки 95-134)** — второй chunker, дубликат indexer'ского. Dead code после 17A.2.

**Новые функции:**
```typescript
function getRagDir(projectPath: string): string {
  const dir = join(projectPath, 'rag');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function getManifestPath(projectPath: string): string {
  return join(getRagDir(projectPath), '.rag-manifest.json');
}

async function validateRagDocument(content: string, filename: string, sizeBytes: number) {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Hard limits (errors)
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (sizeBytes > MAX_SIZE) {
    errors.push(`File too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB (max 2MB)`);
  }
  // Encoding detection
  if (content.charCodeAt(0) === 0xFEFF) {
    // BOM detected — caller should strip
  }

  // Soft limits (warnings)
  if (!filename.endsWith('.md')) warnings.push('Non-MD file — chunking may be suboptimal');
  if (content.length > 2000 && !/^##\s+.+/m.test(content)) {
    warnings.push('No ## headings — paragraph-based chunking fallback');
  }
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 5000) warnings.push(`${wordCount} words — consider splitting`);

  return { ok: errors.length === 0, errors, warnings };
}
```

**`addKBDocument(projectPath, filename, sourcePath)`:**
1. `statSync(sourcePath)` → проверка размера (2MB cap)
2. `readFileSync(sourcePath, 'utf-8')` + strip BOM if present
3. `validateRagDocument()` → если errors → reject с toast, если warnings → показать но продолжить
4. `copyFileSync(sourcePath, join(getRagDir(projectPath), filename))` — с retry на EBUSY (OneDrive sync race, 3 попытки по 500ms)
5. Обновить `.rag-manifest.json` (добавить entry с `added` timestamp)
6. **НЕ вызывать indexProject напрямую** — это делает batched scheduler (17A.3)

**`removeKBDocument(projectPath, filename)`:**
1. Удалить файл `rag/{filename}`
2. Обновить manifest (removed entry)
3. **НЕ clearIndex.** Вместо этого — targeted delete chunks (17A.4)

**`listKBDocuments(projectPath)`:**
1. Читать manifest
2. Сканировать `rag/` директорию
3. **Silent reconciliation** — файлы в `rag/` которых нет в manifest → автоматически добавляем в manifest с `added: now`, `description: 'auto-adopted'`. **НЕ показываем warning пользователю** (это не ошибка, это легитимный workflow — положил файл через Explorer).
4. Файлы в manifest которых нет на диске → удаляем из manifest
5. Return unified list с flag `autoAdopted: boolean` (для возможной indication в UI, но не как warning)

**`chunkCount` в manifest:** НЕ храним — будет always-stale. Вместо этого UI берёт реальное число из `getIndexStats()` + filter by source.

**Коммит 17A.2:** `feat(rag): KB as thin layer, remove direct addChunk, remove dead chunker`

---

### 17A.3 — Batched add с debounce

**Файл:** `src/main/ipc-handlers.ts` + новый модуль `src/main/rag/index-scheduler.ts`

**Проблема:** 20 файлов drag-drop → 20 sequential mutex abort-restart циклов = минуты фриза.

**Решение: debounced re-index scheduler.**

```typescript
// src/main/rag/index-scheduler.ts
let pendingTimer: NodeJS.Timeout | null = null;
let pendingProject: string | null = null;
const DEBOUNCE_MS = 1500;

export function scheduleReindex(projectPath: string) {
  pendingProject = projectPath;
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(async () => {
    const proj = pendingProject;
    pendingProject = null;
    pendingTimer = null;
    if (proj) {
      try {
        await indexProject(proj);
      } catch (e) {
        log.error('Scheduled reindex failed', e);
      }
    }
  }, DEBOUNCE_MS);
}

export function flushReindex(): Promise<void> {
  if (!pendingTimer || !pendingProject) return Promise.resolve();
  clearTimeout(pendingTimer);
  const proj = pendingProject;
  pendingTimer = null;
  pendingProject = null;
  return indexProject(proj);
}
```

**IPC handlers:**

**New:** `kb:add-files-batch` — принимает `paths: string[]`, копирует ВСЕ через `addKBDocument` (без indexProject внутри), потом ОДИН `scheduleReindex()`.

Старый `kb:add-dropped-files` → переписать: вместо loop с отдельными indexProject → batched через `kb:add-files-batch`.

**Tests:** drop 20 файлов → видим в логе "scheduled reindex" 1 раз, не 20.

Flush на quit: в `before-quit` handler → `await flushReindex()` чтобы pending операция не потерялась.

**Коммит 17A.3:** `feat(rag): batched KB adds with debounced reindex`

---

### 17A.4 — Targeted remove (без clearIndex)

**Файл:** `src/main/rag/vector-store.ts` + `knowledge-base.ts`

**Новая функция в vector-store:**
```typescript
export async function deleteChunksBySource(source: string): Promise<number> {
  // source = relative path inside rag/, e.g. "RAG_KNOWLEDGE.md"
  const allItems = await index.listItems();  // vectra API
  const toDelete = allItems.filter(item =>
    item.metadata?.source === source
  );
  for (const item of toDelete) {
    await index.deleteItem(item.id);
  }
  // Also remove from currentState tracking
  delete currentState[source];
  await saveIndexedState();
  return toDelete.length;
}
```

**В `removeKBDocument`:**
```typescript
await deleteChunksBySource(filename);
// NO indexProject call — chunks for this file are gone, others untouched
```

**Проверка:** удалить 1 файл из KB → в логах видно `deleted N chunks for {filename}`, остальной индекс нетронут, время операции <1 сек.

**Коммит 17A.4:** `feat(rag): targeted chunk deletion on KB remove`

---

### 17A.5 — Transactional migration + embedder swap to bge-m3

**КРИТИЧНО — объединено с бывшей 17A.9.1.** Оба шага требуют full reindex (migration + dim change 768→1024). Разделять их = два полных reindex подряд (~15+15 мин на RTX 3050). Делаем как один коммит: clear → switch embedder → reindex с bge-m3.

**Файл:** `src/main/knowledge-base.ts` + `src/main/rag/embeddings.ts` + новая функция `migrateOldKB()`

**Шаг 5.0 — Switch embedder ПЕРЕД migration:**

```typescript
// src/main/rag/embeddings.ts
const EMBEDDING_MODEL = 'bge-m3'; // was 'nomic-embed-text'
// Endpoint: keep POST /api/embeddings (legacy, still works with bge-m3)
// Response shape: { embedding: number[] } — unchanged
// NOT /api/embed (new canonical, different response shape { embeddings: number[][] })
```

Preflight в `testEmbedding()`: если bge-m3 не pulled → actionable error "Run: ollama pull bge-m3 (~1.2GB, first-time only)".

VRAM note: bge-m3 добавляет ~1.5-2 GB поверх Qwen. На RTX 3050 Ollama будет эвиктить модели по memory pressure — query embedding → query chat может давать +1-2s задержку на reload. Приемлемо.

**Проблемы старой migration (оба должны решиться):**
1. Не transactional — failure mid-copy оставляет частичное состояние
2. Не clearIndex — старые chunks из `%APPDATA%` с ID `sha256("kb:{filename}:{i}")` остаются, новые chunks после reindex получают ID `sha256("{relPath}:{i}")` → **дубликаты в retrieval**
3. **Dim mismatch:** старые 768-dim vectors смешаются с новыми 1024-dim → vectra silently return garbage similarity scores

**Новая миграция (handles all three):**
```typescript
interface MigrationState {
  started: string;
  phase: 'copying' | 'clearing' | 'reindexing' | 'done' | 'failed';
  copiedFiles: string[];
  totalFiles: number;
  embedderVersion: string;  // 'bge-m3' — to detect future embedder changes
  error?: string;
}

async function migrateOldKB(projectPath: string): Promise<void> {
  const oldDir = join(app.getPath('userData'), 'knowledge-base');
  const progressFile = join(getRagDir(projectPath), '.migration-state.json');

  // Resume from previous attempt if exists
  let state: MigrationState;
  if (existsSync(progressFile)) {
    state = JSON.parse(readFileSync(progressFile, 'utf-8'));
    if (state.phase === 'done' && state.embedderVersion === 'bge-m3') return;
    // If embedder version doesn't match — re-run clearing + reindexing phases
    if (state.phase === 'done' && state.embedderVersion !== 'bge-m3') {
      state.phase = 'clearing';
    }
  } else {
    const hasOldKB = existsSync(oldDir);
    const filesToMigrate = hasOldKB
      ? (await readdir(oldDir, { recursive: true }))
          .filter(f => typeof f === 'string' && (f.endsWith('.md') || f.endsWith('.txt')))
      : [];
    state = {
      started: new Date().toISOString(),
      phase: 'copying',
      copiedFiles: [],
      totalFiles: filesToMigrate.length,
      embedderVersion: 'bge-m3',
    };
  }

  try {
    // Phase 1: Copy (skip on same-name conflict, log)
    if (state.phase === 'copying' && existsSync(oldDir)) {
      for (const file of filesToMigrate) {
        if (state.copiedFiles.includes(file)) continue; // Resume skip
        const src = join(oldDir, file);
        const dst = join(getRagDir(projectPath), basename(file));
        if (existsSync(dst)) {
          log.warn(`Skipping migration of ${file} — already exists in rag/`);
          state.copiedFiles.push(file);
          continue;
        }
        copyFileSync(src, dst);
        state.copiedFiles.push(file);
        safeWriteProgress(progressFile, state);  // atomic: write to .tmp → rename
      }
    }

    // Phase 2: Clear vector index (critical — prevents duplicates AND dim mismatch)
    state.phase = 'clearing';
    safeWriteProgress(progressFile, state);
    await clearIndex();  // Note: 17A.8.2 one-liner fix — also resets indexPath

    // Phase 3: Reindex from rag/ (now uses bge-m3, fresh 1024-dim vectors)
    state.phase = 'reindexing';
    safeWriteProgress(progressFile, state);
    await indexProject(projectPath);

    // Phase 4: Mark done
    state.phase = 'done';
    safeWriteProgress(progressFile, state);

    // Leave breadcrumb in old folder (don't delete)
    if (existsSync(oldDir)) {
      writeFileSync(
        join(oldDir, 'MIGRATED_TO_RAG_FOLDER.txt'),
        `Migrated to ${getRagDir(projectPath)} on ${state.started}\n` +
        `Embedder upgraded to bge-m3. Safe to delete this folder.\n`
      );
    }

    mainWindow?.webContents.send('kb:migration-complete', {
      filesCopied: state.copiedFiles.length,
      ragPath: getRagDir(projectPath),
    });
  } catch (e) {
    state.phase = 'failed';
    state.error = String(e);
    safeWriteProgress(progressFile, state);
    throw e;
  }
}

// Atomic write to prevent corruption if app killed mid-write
function safeWriteProgress(filePath: string, state: MigrationState) {
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2));
  renameSync(tmp, filePath);
}
```

**Edge cases handled:**
- App killed mid-write: atomic rename prevents corruption
- Resume from partial copy
- Resume from failed clearing (embedder version mismatch triggers re-clear)
- No old `%APPDATA%` folder (fresh install) → skip copy, still do clearing+reindexing if embedder changed

**Where called:** `knowledge-base:init` IPC handler (первый запуск приложения после update). Also re-checked on each startup — if `embedderVersion` in state file differs from current — re-runs clearing+reindexing phases.

**Коммит 17A.5:** `feat(rag): transactional migration + embedder swap to bge-m3`

---

### 17A.6 — Windows/OneDrive guards

**Файл:** `src/main/rag/indexer.ts` + утилиты

**Проблемы:**
- OneDrive placeholder files → zero-byte reparse points → `readFile` либо тормозит (rehydration) либо падает с ERROR_CLOUD_FILE_UNAVAILABLE (0x8007017C)
- Symlinks/junctions → бесконечная рекурсия
- Path length > 260 без `\\?\` prefix
- BOM + UTF-16 encoding
- EPERM на OneDrive paused

**`walkProjectFiles` → skip symlinks явно:**
```typescript
const entries = await readdir(dir, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isSymbolicLink()) {
    log.warn(`Skipping symlink: ${join(dir, entry.name)}`);
    continue;
  }
  // ... existing logic
}
```

**`readFile` wrapper с OneDrive detection:**
```typescript
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ONEDRIVE_ERROR_CODE = 0x8007017C;

async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    const stats = await stat(filePath);

    // Size guard
    if (stats.size > MAX_FILE_SIZE) {
      log.warn(`Skipping ${filePath}: ${(stats.size/1024/1024).toFixed(1)}MB exceeds 2MB cap`);
      return null;
    }

    // OneDrive placeholder detection
    if (stats.size === 0 && (stats as any).isSymbolicLink?.()) {
      log.warn(`OneDrive placeholder file: ${filePath}. Download first.`);
      return null;
    }

    const buffer = await readFile(filePath);

    // BOM strip (UTF-8 BOM = EF BB BF)
    let start = 0;
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      start = 3;
    }
    // UTF-16 LE BOM (FF FE) or BE (FE FF) — we don't support, warn
    if (buffer.length >= 2 && ((buffer[0] === 0xFF && buffer[1] === 0xFE) || (buffer[0] === 0xFE && buffer[1] === 0xFF))) {
      log.warn(`Skipping ${filePath}: UTF-16 encoding not supported. Re-save as UTF-8.`);
      return null;
    }

    return buffer.slice(start).toString('utf-8');
  } catch (e: any) {
    if (e.code === 'EPERM' || e.errno === -ONEDRIVE_ERROR_CODE) {
      log.warn(`Cannot read ${filePath}: ${e.code || e.message}. Check OneDrive status.`);
      return null;
    }
    if (e.code === 'ENAMETOOLONG') {
      log.warn(`Path too long: ${filePath}. Enable LongPathsEnabled in Windows registry.`);
      return null;
    }
    throw e;
  }
}
```

Использовать `safeReadFile` везде где раньше был `readFile(path, 'utf-8')` в indexer'e.

**Path normalization на Windows:** Nothing special — Node handles `\\?\` internally when needed, но file hashing должен быть case-normalized:

```typescript
function normalizeRelativePath(p: string): string {
  if (process.platform === 'win32') return p.toLowerCase().replace(/\\/g, '/');
  return p;
}
```

Использовать в `buildChunkId` для consistency при rename.

**Коммит 17A.6:** `feat(rag): Windows/OneDrive guards — size cap, BOM strip, symlink skip`

---

### 17A.7 — Metadata filters в `queryChunks`

**Независимый standalone add-on. Работает сегодня с `pathPrefix` + `minScore`. После 17B добавится работающий `categoryFilter`.**

**Файл:** `src/main/rag/vector-store.ts`

**Metadata schema (emit at index time):**
- `source` — relative path inside rag/ (e.g. `"memory/anti_patterns.md"`)
- `category` — from manifest (17B), or `'unknown'` if orphan
- `path` — legacy field, keep for one release cycle

**Добавить в `addChunk` metadata:**
```typescript
metadata: {
  source: relativePath,    // NEW — used by filters
  path: relativePath,      // legacy — keep for migration
  category: getCategoryFromManifest(relativePath) || 'unknown',  // NEW (17B)
  text: chunkText.slice(0, 2000),  // truncated preview — keep 2000, not 4000
  // ... existing fields
}
```

**Обновлённый `queryChunks`:**
```typescript
export interface QueryOptions {
  topK?: number;
  categoryFilter?: string;
  pathPrefix?: string;
  minScore?: number;
}

export async function queryChunks(
  query: string,
  options: QueryOptions = {},
): Promise<QueryResult[]> {
  const { topK = 5, categoryFilter, pathPrefix, minScore = 0 } = options;
  const hasFilters = !!(categoryFilter || pathPrefix || minScore > 0);
  const rawK = hasFilters ? topK * 3 : topK;

  const vector = await embed(query);
  const raw = await index.queryItems(vector, rawK);

  const filtered = raw.filter(r => {
    if (r.score < minScore) return false;
    const meta = r.item.metadata || {};
    if (categoryFilter && meta.category !== categoryFilter) return false;
    if (pathPrefix && !(meta.source || '').startsWith(pathPrefix)) return false;
    return true;
  });

  return filtered.slice(0, topK);
}
```

Все существующие вызовы `queryChunks(query)` без options → работают как раньше.

**17A.7.1 — Update existing call sites (BREAKING CHANGE)**

**Важно:** Изменение сигнатуры `queryChunks(query, topK)` → `queryChunks(query, options)` это breaking API change. Все call sites обязательно обновить, иначе build упадёт или поведение поменяется молча.

Call sites (grep по репозиторию):

1. **`src/main/ai-ipc.ts:257`** — в RAG context retrieval
   ```typescript
   // BEFORE:
   const ragChunks = await queryChunks(payload.message, 5);
   // AFTER:
   const ragChunks = await queryChunks(payload.message, { topK: 5 });
   ```

2. **`src/main/ipc-handlers.ts`** — handler `rag:query` (search для "queryChunks(")
   ```typescript
   // BEFORE:
   return await queryChunks(query, topK || 5);
   // AFTER:
   return await queryChunks(query, { topK: topK || 5 });
   ```

3. **`src/renderer/screens/KnowledgeBase.tsx`** — `handleSearch` через `window.api.ragQuery`
   Preload bridge также проверить и обновить если там есть positional args.

**Grep command before commit:**
```bash
grep -rn "queryChunks(" src/  # must all use object-options form
```

**Коммит 17A.7:** `feat(rag): queryChunks filters + update all call sites`

---

### 17A.8 — Nuances & pre-existing bugs

**17A.8.1 — Path hash simplified**
Убрать collision detection (over-engineered). SHA-256 truncated to 16 hex chars = 64 bits namespace — collision probability at 5000 chunks ≈ 2^-50. Non-issue.

```typescript
import { createHash } from 'node:crypto';
function buildChunkId(relativePath: string, blockIdx: number): string {
  const normalized = normalizeRelativePath(relativePath);
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return `${hash}-${blockIdx}`;
}
```

**17A.8.2 — `clearIndex` pre-existing bug** *(one-line fix + vector-store reset)*

**Файл:** `src/main/rag/indexer.ts:375-388` + `src/main/rag/vector-store.ts`

`clearIndex()` сейчас не сбрасывает `currentState`, `currentIndexRoot` в indexer, и `indexPath` в vector-store. После clear, `flushIndexedState()` пишет stale state, а `getIndexPath()` возвращает old path.

**В `indexer.ts`:**
```typescript
export async function clearIndex(): Promise<void> {
  await rm(indexRoot, { recursive: true, force: true });
  currentState = {};          // NEW — reset tracking
  currentIndexRoot = '';      // NEW — reset root
  await saveIndexedState();
  resetVectorStorePath();     // NEW — also reset vector-store module state
}
```

**В `vector-store.ts`:**
```typescript
let indexPath: string = '';
let index: LocalIndex | null = null;

export function resetVectorStorePath(): void {
  indexPath = '';
  index = null;
}

export function getIndexPath(): string {
  return indexPath;
}
```

Без этого после `clearIndex()` + `initVectorStore(newProjectPath)` могут быть артефакты — vectra откроет index на старом пути, получит stale cache hits.

**17A.8.3 — AiChat ragChunks live update**

В `src/renderer/stores/ai.ts` — подписаться на `rag:index-complete` IPC event:
```typescript
window.api.on('rag:index-complete', () => {
  refreshRagStats();
});
```

**17A.8.4 — `rag:clear-index` UI кнопка end-to-end**

В `KnowledgeBase.tsx` добавить кнопку "Clear Index" (уже в UI, проверить wiring). IPC → `clearIndex()` → `rag:index-complete` emit → UI refreshes.

**Коммит 17A.8:** `fix(rag): chunk id simplified, clearIndex state reset, live stats update`

---

### 17A.9 — Bilingual RAG + auto language detection

**Цель:** система продаётся англоязычным клиентам (EN everywhere), но Ariel лично работает на русском. Параллельная поддержка EN+RU без UI toggle — язык ответа определяется автоматически по сообщению пользователя.

**Архитектурное решение:**
- Embedder: **bge-m3** (многоязычный, замена `nomic-embed-text`) — native quality на EN и RU
- Структура: `rag/RAG_*.md` primary (EN) + `rag/ru/RAG_*.md` параллельные RU версии
- `memory/*` — **только EN** (internal system, всегда universal)
- Shadow hints (17C) — всегда EN (инжектятся в tool result, техническая информация)
- AI отвечает на языке последнего user message, код/имена функций/пути — English

**Файлы для изменения:**
- `src/main/rag/embeddings.ts` — switch embedder, update dim size
- `src/main/rag/indexer.ts` — detect file language, emit `metadata.language`
- `src/main/rag/vector-store.ts` — add `language` to QueryOptions
- `src/main/ai-provider.ts` — `detectLanguage()` utility
- `src/main/ai-ipc.ts` — language instruction в system prompt
- Создать: `rag/ru/RAG_KNOWLEDGE.md`, `rag/ru/RAG_PLATFORM.md`, `rag/ru/RAG_RULES.md`, `rag/ru/RAG_STRATEGY.md`

**17A.9.1 — Switch embedder to bge-m3** *(MERGED INTO 17A.5)*

Этот шаг был в v3 отдельно, но в v4 объединён с 17A.5 (Transactional migration). Причина: оба требуют full reindex, раздельное выполнение = два 15-минутных reindex'а подряд. См. 17A.5 выше.

Endpoint: keep `/api/embeddings` legacy — bge-m3 совместим, response shape unchanged (`{ embedding: number[] }`).

**17A.9.2 — Language detection utility** *(ЭТО РЕАЛЬНЫЙ ПЕРВЫЙ ШАГ 17A.9)*

`src/main/ai-provider.ts`:
```typescript
const MIN_LETTERS_FOR_DETECTION = 10;

export function detectLanguage(messages: AiChatMessage[]): 'en' | 'ru' {
  // Strategy: last user message wins, unless it's too short or all code —
  // then fall back to the most recent substantive user message.

  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return 'en';

  for (const msg of [...userMessages].reverse()) {
    const raw = typeof msg.content === 'string'
      ? msg.content
      : (msg.content as ClaudeContent[])
          .filter(b => b.type === 'text')
          .map(b => (b as ClaudeTextContent).text)
          .join(' ');

    // Strip fenced code blocks (``` ... ```) and inline code (` ... `)
    const stripped = raw
      .replace(/```[\s\S]*?```/g, '')    // fenced
      .replace(/`[^`]*`/g, '')            // inline
      .trim();

    const cyrillic = (stripped.match(/[а-яА-ЯёЁ]/g) || []).length;
    const letters = (stripped.match(/[a-zA-Zа-яА-ЯёЁ]/g) || []).length;

    // Too short to detect reliably — try previous message
    if (letters < MIN_LETTERS_FOR_DETECTION) continue;

    return cyrillic / letters > 0.2 ? 'ru' : 'en';
  }

  // All user messages were too short or pure code — default EN
  return 'en';
}
```

**Why code-fence stripping:** пользователь пастит 200-строчный Python с 3 строками русских комментариев → без стрипа ratio <5% → детектится как EN (неправильно). Со стрипом — считаем только natural language.

**Why short-message fallback:** "ok" или "да" после длинного RU вопроса не должны переключать язык.

**17A.9.3 — REPLACE hardcoded Russian with dynamic language instruction**

**КРИТИЧНО:** Текущий код уже монолингвально русский. **Это не "добавить language detection", это "удалить hardcode и заменить на dynamic"**. Если Cursor добавит dynamic но не уберёт hardcode — получится противоречивый system prompt.

**Существующие места hardcode:**
- `src/main/ai-ipc.ts:183` — "LANGUAGE: ALWAYS respond in Russian..." (в `buildClaudeSystemPrompt`)
- `src/main/ai-ipc.ts:341` — "ALWAYS answer in Russian. Use English only for code and file names." (в Ollama short system prompt)

Оба удалить. Оба заменить на dynamic.

**Дополнительно:** Ollama в `ai-ipc.ts:288-320` пихает весь контекст (RAG + project + file) в user message, а не в system prompt. Комментарий в коде так и говорит: small models ignore system prompts. **Поэтому для Ollama language instruction должен быть в ДВУХ местах одновременно** (recency bias — последняя инструкция побеждает):

1. В коротком system prompt (line 341) — rewrite to dynamic
2. **Также** в конце user message — appended last line `\n\n[Reply in Russian / English.]`

Для Claude достаточно одного места (строка 183 → dynamic).

**Code change (Claude, ai-ipc.ts line ~183):**
```typescript
// REMOVE:
// "LANGUAGE: ALWAYS respond in Russian. ..."

// REPLACE WITH:
const lang = detectLanguage(payload.messages);
const langLine = lang === 'ru'
  ? 'LANGUAGE: Respond in Russian. Keep all code, file paths, function names, import statements, and technical English terms exactly as they are — do NOT translate them. Comments in code may be Russian if the user used Russian comments.'
  : 'LANGUAGE: Respond in English.';
// Prepend langLine to existing system prompt
const systemPrompt = `${langLine}\n\n${existingClaudePrompt}`;
```

**Code change (Ollama, ai-ipc.ts line ~341):**
```typescript
// REMOVE the "ALWAYS answer in Russian..." hardcoded line

// REPLACE: short system prompt becomes dynamic
const lang = detectLanguage(payload.messages);
const langLineShort = lang === 'ru'
  ? 'Respond in Russian. Keep code/paths/names English.'
  : 'Respond in English.';
const ollamaSystemPrompt = `${langLineShort}\n\n${existingOllamaSystemPrompt}`;
```

**Code change (Ollama user message suffix, ai-ipc.ts line ~315):**
```typescript
// In the block that stuffs context into user message for Ollama:
const userLanguageReminder = lang === 'ru'
  ? '\n\n[Reply in Russian.]'
  : '\n\n[Reply in English.]';
const userMessageWithContext = `${projectContext}\n\n${ragContext}\n\n${fileContext}\n\nUser: ${payload.message}${userLanguageReminder}`;
```

**Why the dual-location for Ollama:** Qwen 7B attention weakens over long context. System prompt at position 0 of 14KB user message gets ~5% attention. End of user message gets recency weight ~40%. Dual-location = 45% attention on language instruction vs 5% single-location.

**Claude doesn't need dual-location** — follows system prompt reliably.

**17A.9.4 — Bilingual folder structure**

```
rag/
├── RAG_KNOWLEDGE.md           # EN (source of truth)
├── RAG_PLATFORM.md            # EN
├── RAG_RULES.md               # EN
├── RAG_STRATEGY.md            # EN
├── ru/                        # ← NEW: Russian parallel translations
│   ├── RAG_KNOWLEDGE.md
│   ├── RAG_PLATFORM.md
│   ├── RAG_RULES.md
│   └── RAG_STRATEGY.md
├── memory/                    # EN only (internal system)
│   ├── behavioral_patterns.md
│   ├── file_relationships.md
│   ├── anti_patterns.md
│   └── workflow_reminders.md
├── _templates/                # EN templates
│   └── (optional: ru/ subfolder for RU templates later)
└── .rag-manifest.json         # (17B adds category; language added here too)
```

Manifest получает поле `language`:
```json
{
  "filename": "ru/RAG_KNOWLEDGE.md",
  "category": "knowledge",
  "language": "ru",
  "description": "Russian translation of RAG_KNOWLEDGE",
  ...
}
```

**17A.9.5 — indexer emits metadata.language**

`src/main/rag/indexer.ts`:
```typescript
function detectFileLanguage(relativePath: string): 'en' | 'ru' {
  // Normalize path separators first (Windows \ → /)
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.startsWith('ru/')) return 'ru';
  return 'en';
}
```

В metadata каждого chunk:
```typescript
metadata: {
  source: relativePath,
  category: ...,
  language: detectFileLanguage(relativePath), // NEW
  text: chunkText.slice(0, 2000),
}
```

**17A.9.6 — queryChunks language filter**

Extend `QueryOptions` в 17A.7:
```typescript
export interface QueryOptions {
  topK?: number;
  categoryFilter?: string;
  pathPrefix?: string;
  minScore?: number;
  language?: 'en' | 'ru';  // NEW — if set, prefer chunks in this language
}
```

Filter logic: если `language` передан → пропустить chunks с другим `metadata.language` (undefined tolerated — backward compat для chunks проиндексированных до 17A.9).

**17A.9.7 — Auto-apply language в RAG queries**

В месте где строится RAG context для AI chat (в `ai-ipc.ts`, поиск `queryChunks(` в RAG retrieval section):
```typescript
const lang = detectLanguage(messages);
const ragChunks = await queryChunks(lastUserMessage, {
  topK: 5,
  language: lang,  // prefer native-language chunks
});

// Fallback: если native-language top-5 < 3 chunks — добавить EN chunks
if (ragChunks.length < 3 && lang === 'ru') {
  const enChunks = await queryChunks(lastUserMessage, {
    topK: 5 - ragChunks.length,
    language: 'en',
  });
  ragChunks.push(...enChunks);
}
```

**17A.9.8 — Memory всегда EN (17C integration)**

В `getShadowHints` (Phase 17C):
```typescript
const results = await queryChunks(query, {
  topK: MAX_HINTS_PER_CALL,
  categoryFilter: 'memory',
  language: 'en',  // memory docs always English
  minScore: HINT_SIMILARITY_THRESHOLD,
});
```

**17A.9.9 — Scaffold RU translation placeholders (NOT manual post-code translation)**

**v3 было:** "Ariel переводит 4 документа через Claude web после completion кода".
**Причина смены (round 2 review):** founder-одиночка на дедлайне не будет поддерживать переводы. Через 2 месяца `rag/ru/` будет 2 устаревших файла, value 17A.9 не realized.

**v4 подход: scaffolding + visible translation debt.**

Во время setup 17A.9 (часть коммита):
1. Для каждого EN файла в `rag/RAG_*.md` → создать `rag/ru/RAG_*.md` со следующим содержимым:
   ```markdown
   <!-- TRANSLATION PENDING -->
   <!-- Source: ../RAG_KNOWLEDGE.md -->
   <!-- Last EN mtime: 2026-04-19T10:00:00Z -->
   
   # [TRANSLATION PENDING — do not index]
   
   This file is a placeholder. Russian translation of RAG_KNOWLEDGE.md is not yet done.
   When translating, remove the TODO marker above and replace this content with the
   Russian version, preserving the ## heading structure.
   
   ---
   
   ## Reference (English source, embedded for convenience — not indexed until translated):
   
   [full English content pasted here, to help whoever does the translation]
   ```

2. **Indexer skip logic:** файлы с `<!-- TRANSLATION PENDING -->` на первой строке → skipped at index time, NOT indexed as RU chunks.
   ```typescript
   // src/main/rag/indexer.ts inside walkProjectFiles processing
   const TRANSLATION_PENDING_MARKER = '<!-- TRANSLATION PENDING -->';
   if (content.startsWith(TRANSLATION_PENDING_MARKER)) {
     log.info(`Skipping translation placeholder: ${relativePath}`);
     return; // don't index
   }
   ```

3. **UI indicator:** в Settings или KnowledgeBase screen показать "RU translations: 0 / 4 complete" с list'ом pending files. Clickable — открывает файл в editor для ручного перевода.

4. **Bump marker update:** когда пользователь убирает `<!-- TRANSLATION PENDING -->` и сохраняет файл → при следующем reindex индексируется как RU chunks. `lastEnModified` в manifest используется для детекции "RU stale vs EN updated" (future, не блокер).

**Ariel's workflow after scaffolding ships:**
- Открывает `rag/ru/RAG_KNOWLEDGE.md`
- Видит EN source, переводит на русский (рядом в том же файле)
- Убирает `<!-- TRANSLATION PENDING -->`
- Сохраняет. Reindex. Все RU chunks доступны.

Это **не отдельный код-коммит**, это часть 17A.9 setup. Время: ~30min code + 0 time data prep (Ariel переводит когда хочет и если хочет; система работает и без переводов через EN-fallback).

**Translation debt как first-class concept:** Settings screen показывает счётчик, файлы pending — visible pressure + actionable.

**Проверка 17A.9:**
- [ ] `ollama pull bge-m3` работает, preflight в UI
- [ ] Full reindex на bge-m3 успешен, dim=1024
- [ ] `rag/ru/` создан с 4 RU документами
- [ ] EN query "tell me about the platform" → top chunks из `RAG_PLATFORM.md` (не из `ru/`)
- [ ] RU query "расскажи про платформу" → top chunks из `ru/RAG_PLATFORM.md` (не из EN)
- [ ] AI отвечает на русском когда user пишет по-русски
- [ ] AI отвечает на английском когда user пишет по-английски
- [ ] Смешанное сообщение "прочитай src/main/ai-provider.ts" → AI отвечает по-русски, имена файлов/функций на английском
- [ ] Code в ответе на русском — НЕ переведён (функции, переменные, imports English)
- [ ] Shadow hints (когда 17C готов) — на английском даже в RU диалоге
- [ ] Detect language accuracy ≥ 90% на тестовом наборе из 20 смешанных сообщений

**Коммит 17A.9:**
```
feat(rag): bilingual support (EN primary + RU translations) + auto-detect

- switch embedder to bge-m3 (was nomic-embed-text) for multilingual quality
- full reindex required due to dim size change (768 → 1024)
- rag/ru/ folder for Russian parallel translations
- indexer emits metadata.language ('en' | 'ru')
- queryChunks supports language filter
- detectLanguage() utility in ai-provider
- system prompt instructs model to reply in user's language
- code/paths/function names kept in English regardless of conversation language
- memory/ always English (shadow hints technical)
- fallback to EN chunks if RU top-5 has fewer than 3 relevant
```

**Effort:** 4-5h код + 2-3h AI-assisted translation of 4 documents (separate task).

---

### Acceptance checklist — Phase 17A целиком

**Happy path:**
- [ ] 17A.0: num_ctx 8192 работает, UI сохраняет, Qwen видит длинный файл
- [ ] 17A.1: index скопит только `rag/` — grep лога, ни одного файла из `src/`
- [ ] 17A.2: дроп файла в KB → копия в `{project}/rag/`, запись в manifest
- [ ] 17A.3: drop 20 файлов → один reindex через 1.5s, не 20 abort-restart
- [ ] 17A.4: remove файла → chunks именно этого файла исчезают, остальные остаются, <1s
- [ ] 17A.5: миграция с `%APPDATA%` → copy + clearIndex + reindex → no duplicates в query
- [ ] 17A.7: `queryChunks(q, { pathPrefix: 'memory/' })` возвращает только memory chunks
- [ ] 17A.8.2: clear → add → quit → restart → index consistent

**Hostile path (critical):**
- [ ] 10MB JSON dropped → soft reject с toast, zero freeze
- [ ] OneDrive placeholder file → warning "download first", не hang
- [ ] Symlink в rag/ → skipped, лог запись
- [ ] UTF-16 .md → warning "re-save as UTF-8"
- [ ] BOM в UTF-8 → silently stripped, chunks корректные
- [ ] Drop file → Clear Index mid-indexing → graceful stop, empty state
- [ ] Kill app (Task Manager) mid-index → restart → resume from checkpoint
- [ ] Two drops within 500ms → single batched reindex
- [ ] 16384 num_ctx на 8GB → OOM → banner с suggest 4096
- [ ] Project switch mid-index → old indexing aborts, new project loads clean

**Regression:**
- [ ] Claude провайдер работает как раньше
- [ ] Solo Mode без VPS — RAG работает
- [ ] Team Mode — RAG работает параллельно с VPS tasks
- [ ] Смена language (RU ↔ EN в пределах одного диалога) — следующее сообщение получает правильный ответ
- [ ] bge-m3 embedder не ломает Test Query функциональность

---

### Оценка 17A (v4 — realistic)

| Sub-phase | Effort | Can be parallel |
|-----------|--------|-----------------|
| 17A.0 Ollama params | 1-2h | Yes (ship first) |
| 17A.1 indexer scope | 1h | No |
| 17A.2 KB thin layer | 4h | No (underestimate в v3 был 2-3h) |
| 17A.3 batched scheduler | 3-4h | No (mutex interaction нетривиальна) |
| 17A.4 targeted delete | 1-2h | No |
| 17A.5 migration + bge-m3 swap | 4-5h | No (+ testing recovery paths) |
| 17A.6 Windows/OneDrive guards | 4-5h | Parallel with 17A.4-5 |
| 17A.7 metadata filters + call site updates | 2-3h | Parallel with 17A.2+ |
| 17A.8 nuances | 2h | Parallel |
| 17A.9 bilingual (без 17A.9.1 — он в 17A.5) | 5-7h code + scaffolding | Parallel |
| **Total** | **~27-35h code** | |

**Критический путь (v4):** 17A.0 → 17A.1 → 17A.2 → 17A.3 → 17A.4 → 17A.5 (migration + bge-m3) → 17A.9 (language detection + prompts) → done. 17A.6/7/8 параллелятся.

**Plan for 30% slip:** 35-45h realistic ceiling. Don't commit client dates based on lower bound.

---

## Phase 17B — RAG Structure & Conventions + PM Foundation

### Цель
Зафиксировать "как работать с RAG" настолько чётко, что это можно делегировать Cursor/Sonnet без Claude. Подготовить почву для Phase 17C (Persistent Memory).

### Новые файлы / папки
```
rag/
├── .rag-manifest.json        # Реестр документов (emit category → 17A.7 filter активируется)
├── _templates/               # Скелеты (underscore = skipped by indexer)
│   ├── knowledge.md
│   ├── platform.md
│   ├── rules.md
│   ├── strategy.md
│   └── memory.md
├── memory/                   # ← Зарезервировано для Phase 17C
│   ├── behavioral_patterns.md   # (пустой шаблон)
│   ├── file_relationships.md    # (пустой шаблон)
│   ├── anti_patterns.md         # (пустой шаблон)
│   └── workflow_reminders.md    # (пустой шаблон)
├── RAG_KNOWLEDGE.md
├── RAG_PLATFORM.md
├── RAG_RULES.md
└── RAG_STRATEGY.md

docs/RAG_HOW_TO_ADD.md        # Step-by-step инструкция
```

### Категории (финально зафиксированы)
| Категория | Что в неё кладут | Пример |
|-----------|------------------|--------|
| `knowledge` | Факты о проекте: стек, структура, ключевые файлы | RAG_KNOWLEDGE.md |
| `platform` | Инфраструктура: MCP server, tunnel, ports | RAG_PLATFORM.md |
| `rules` | Coding rules, style, conventions | RAG_RULES.md |
| `strategy` | Бизнес-решения, roadmap, приоритеты | RAG_STRATEGY.md |
| `memory` | *(17C)* Behavioral patterns, relationships | rag/memory/*.md |

### Manifest schema
```json
{
  "version": 1,
  "lastUpdated": "2026-04-19T10:00:00Z",
  "documents": [
    {
      "filename": "RAG_KNOWLEDGE.md",
      "category": "knowledge",
      "description": "Core facts: stack, structure, key files",
      "added": "2026-04-12T00:00:00Z",
      "lastIndexed": "2026-04-19T09:30:00Z"
    }
  ]
}
```
Убрали `chunkCount` — always-stale. Real count из `getIndexStats()` в UI.

### Indexer integration
Indexer при чтении файла → lookup в manifest по filename → emit `metadata.category` на chunks. Если orphan → `category: 'unknown'`.

### Templates (пример `_templates/knowledge.md`)
```markdown
<!-- TEMPLATE — copy and rename (drop _ prefix) -->

## What is [PROJECT_NAME]

Brief 2-3 sentence description.

## Tech Stack

List of technologies with versions.

## Project Structure

Main directories and their purpose.

## Key Files

- `path/to/file.ts` — what it does
```

### docs/RAG_HOW_TO_ADD.md
Markdown документ:
1. 5 категорий + когда какую
2. Templates в `_templates/`
3. Правила chunkинга (`##` заголовки, 500-1500 chars/chunk, 5000 слов/файл)
4. Как добавить: Drag-and-Drop в KB или copy в rag/ + Re-index
5. Как проверить: Test Query в UI
6. Что НЕ класть: код, бандлы, секреты

### Validation (уже в 17A.2 через `validateRagDocument`)
17B дополняет: warning если категория не указана в manifest.

### Проверка 17B
- [ ] `rag/_templates/` содержит 5 шаблонов
- [ ] `rag/memory/` содержит 4 пустых файла
- [ ] `.rag-manifest.json` создаётся на first add
- [ ] Manifest entry без category → warning при add
- [ ] `_templates/` не индексируется
- [ ] `queryChunks(q, { categoryFilter: 'knowledge' })` работает (теперь когда metadata есть)
- [ ] `docs/RAG_HOW_TO_ADD.md` написан

### Коммит
```
feat(rag): structure & conventions + memory foundation

- .rag-manifest.json registry
- _templates/ for 5 categories
- rag/memory/ placeholder (17C populates)
- indexer emits metadata.category from manifest
- docs/RAG_HOW_TO_ADD.md step-by-step guide
```

**Effort:** 3-4h

---

## Phase 17C — Persistent Memory через Shadow Instructions

### Цель
Локальная Ollama получает behavioral context при каждом tool call через RAG-injected shadow hints. Модель "помнит" паттерны без изменения весов.

### Концепция
```
User: "Прочитай indexer.ts и добавь функцию clearProjectCache"
    ↓
AI вызывает read_file("src/main/rag/indexer.ts")
    ↓
Tool handler → {...file content...}
    ↓
[NEW] getShadowHints('read_file', {path:'src/main/rag/indexer.ts'})
    ↓
    queryChunks(
      "tool:read_file path:src/main/rag/indexer.ts",
      { categoryFilter: 'memory', topK: 2, minScore: 0.7 }
    )
    ↓
    top-2 memory chunks, e.g.:
      - "When editing indexer.ts, also review vector-store.ts"
      - "indexer.ts uses withFileLock pattern — preserve it"
    ↓
Enhanced result =
    {...file content...}

    <hint source="rag/memory/file_relationships.md">
    When editing indexer.ts, also review vector-store.ts.
    indexer.ts uses withFileLock pattern — preserve it.
    </hint>
    ↓
Ollama видит и учитывает hint
```

### Новые файлы
- `src/main/shadow-hints.ts`
- `rag/memory/behavioral_patterns.md` — заполняется примерами
- `rag/memory/file_relationships.md`
- `rag/memory/anti_patterns.md`
- `rag/memory/workflow_reminders.md`
- `docs/PERSISTENT_MEMORY_GUIDE.md`

### `shadow-hints.ts`
```typescript
import { queryChunks } from './rag/vector-store';

export interface ShadowHint {
  text: string;
  source: string;
}

const MAX_HINTS_PER_CALL = 2;
const HINT_SIMILARITY_THRESHOLD = 0.7;

export async function getShadowHints(
  toolName: string,
  args: Record<string, unknown>,
): Promise<ShadowHint[]> {
  const pathArg = typeof args.path === 'string' ? args.path : '';
  const query = `tool:${toolName}${pathArg ? ' path:' + pathArg : ''}`;

  try {
    const results = await queryChunks(query, {
      topK: MAX_HINTS_PER_CALL,
      categoryFilter: 'memory',
      minScore: HINT_SIMILARITY_THRESHOLD,
    });
    return results.map(r => ({
      text: r.item.metadata?.text || '',
      source: r.item.metadata?.source || 'unknown',
    }));
  } catch {
    return []; // fail-silent
  }
}

export function appendHints(result: string, hints: ShadowHint[]): string {
  if (hints.length === 0) return result;
  const hintBlock = hints
    .map(h => `<hint source="${h.source}">\n${h.text}\n</hint>`)
    .join('\n\n');
  return `${result}\n\n${hintBlock}`;
}
```

### Integration в `ai-provider.ts`

**Ollama section:**
```typescript
for (const tc of toolCalls) {
  const event: ToolCallEvent = { tool: tc.name, args: tc.args };
  const rawResult = await onToolCall(event);
  const hints = await getShadowHints(tc.name, tc.args);
  const result = appendHints(rawResult, hints);
  wire.push({ role: 'tool', content: result });
}
```

**Claude section** — аналогично для `toolResults` построения.

### `store_memory` tool (9-й в MCP)

**Файл:** `src/main/local-mcp-server.ts`

```typescript
{
  name: 'store_memory',
  description: 'Store a behavioral pattern, file relationship, anti-pattern, or workflow reminder for future sessions. Use when user says "remember", "note", "don\'t forget", or when you notice a recurring pattern.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['behavioral_patterns', 'file_relationships', 'anti_patterns', 'workflow_reminders'],
      },
      content: { type: 'string', description: 'The pattern/note in 1-3 sentences.' },
    },
    required: ['category', 'content'],
  },
}
```

**Handler:** append content to `rag/memory/{category}.md` под auto-generated `## heading` с датой. Trigger `scheduleReindex()` (через 17A.3).

### Starter memory docs

**`rag/memory/file_relationships.md`:**
```markdown
## Indexer and Vector Store
When editing src/main/rag/indexer.ts, also review src/main/rag/vector-store.ts — they share chunk ID scheme.

## Ollama Provider and Tool Handler
src/main/ai-provider.ts calls tools via onToolCall callback from src/main/ai-ipc.ts. Both evolve together.
```

**`rag/memory/anti_patterns.md`:**
```markdown
## Don't index node_modules
SKIP_DIRS handles this. If someone tries to remove the skip — block it. Full project indexing produces 10,000+ useless chunks.

## Don't write raw JSON for RAG content
JSON has low embedding quality vs Markdown with ## headings. Content = .md. Metadata = .rag-manifest.json.
```

**`rag/memory/workflow_reminders.md`:**
```markdown
## After editing ipc-handlers.ts
Rebuild required (npm run build) — main process doesn't hot-reload.

## After adding new RAG document via Explorer
Auto-adoption happens on next listKBDocuments. But run Re-index manually for chunks to appear.
```

### docs/PERSISTENT_MEMORY_GUIDE.md
1. Memory vs knowledge — "как" vs "что"
2. Когда в какую из 4 категорий
3. Формат (короткие `##` заголовки, 1-3 предложения)
4. AI может писать через `store_memory` сам
5. Ручные записи → shadow injection автоматически
6. Good/bad examples

### Проверка 17C
- [ ] `shadow-hints.ts` создан, работает
- [ ] После `read_file` с entry в file_relationships.md — hint в tool result
- [ ] Hint виден в UI (visual tool call)
- [ ] AI учитывает hint в следующей итерации (тест-сценарий)
- [ ] `store_memory` tool: call → запись в rag/memory/X.md → scheduleReindex → chunks доступны
- [ ] Fail-silent при ошибке RAG (tool loop продолжается)

### Коммит
```
feat(memory): persistent memory via shadow instructions

- shadow-hints.ts with RAG-query injection
- integration in ai-provider.ts (Ollama + Claude)
- store_memory tool
- starter memory docs
- docs/PERSISTENT_MEMORY_GUIDE.md
```

**Effort:** 6-8h

---

## Phase 17D — Ollama Tool Calling robustness

### Цель
Локальная Qwen2.5-Coder:7b стабильно использует tools. Acceptance тесты проходят.

### Known state (audit 19.04.2026)
- `ollamaChat()` — полная реализация tool loop ✅
- Конвертация в Ollama function format ✅
- Парсинг `msg.tool_calls` ✅
- **Gap:** если Qwen пишет tool call JSON в `content` вместо structured `tool_calls` — игнорируется

### Шаги

**17D.1 — Text-based fallback**
```typescript
const TOOL_CALL_REGEX = /\{\s*"tool"\s*:\s*"(\w+)"\s*,\s*"args"\s*:\s*(\{[^}]*\})\s*\}/g;

function extractToolCallsFromText(
  text: string,
  availableTools: ClaudeTool[],
): Array<{ id: string; name: string; args: Record<string, unknown> }> {
  const extracted = [];
  const matches = [...text.matchAll(TOOL_CALL_REGEX)];
  for (const match of matches) {
    const toolName = match[1];
    if (!availableTools.some(t => t.name === toolName)) continue;
    try {
      const args = JSON.parse(match[2]);
      extracted.push({
        id: `tc-text-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: toolName,
        args,
      });
    } catch {}
  }
  return extracted;
}

// After main parse loop:
if (toolCalls.length === 0 && assistantMessage.includes('"tool"')) {
  const fallback = extractToolCallsFromText(assistantMessage, tools);
  if (fallback.length > 0) {
    toolCalls.push(...fallback);
    assistantMessage = assistantMessage.replace(TOOL_CALL_REGEX, '').trim();
  }
}
```

**17D.2 — Tool schema в system prompt**

В `buildSystemPrompt()` для Ollama:
```
## Available tools

Call tools using this exact JSON format in your response:
{"tool": "tool_name", "args": {"param1": "value1"}}

Tools:
- read_file({path}) — Read file
- write_file({path, content}) — Write/create file
- patch_file({path, old_text, new_text}) — Replace text
- list_directory({path}) — List dir
- search_files({query}) — Search project
- git_snapshot({description}) — Commit
- git_log({limit}) — Recent commits
- store_memory({category, content}) — Save pattern for future sessions
```

Claude не нужно — native API tool_use. Инжектим только для Ollama.

**17D.3 — Graceful failure banner**

`nonToolIterations` counter. После 3 — throw `QWEN_TOOL_INSTABILITY` → event `ai:tool-instability-detected` → banner в AiChat: "Qwen 7B has difficulty with tools here. Switch to Claude?" [Switch] [Dismiss].

**17D.4 — Acceptance тесты (manual)**

Qwen2.5-Coder:7b + num_ctx 8192:

| # | Запрос | Ожидание |
|---|--------|----------|
| 1 | "Прочитай src/main/rag/indexer.ts и скажи сколько строк" | `read_file` + число |
| 2 | "Найди где определена queryChunks" | `search_files` + путь |
| 3 | "Аудит AiChat.tsx — что улучшить" | `read_file` + анализ текст |
| 4 | "Допиши в rag/memory/workflow_reminders.md: After deploying, run health check" | `store_memory` или `patch_file` |
| 5 | "Запомни что в проекте не используем Redux, только Zustand" | `store_memory({anti_patterns, ...})` |

Shadow hints (из 17C) работают — видны в UI tool calls.

### Проверка 17D
- [ ] Text-based fallback работает когда Qwen отвечает JSON в content
- [ ] Tool schema в system prompt — Ollama видит tools
- [ ] 5 acceptance тестов проходят
- [ ] Graceful failure после 3 неудачных итераций
- [ ] Claude не сломан
- [ ] Solo Mode — tools работают локально

### Коммит
```
feat(ollama): robust tool calling with text-based fallback

- regex-based tool call extraction from content
- tool schema injection in system prompt
- graceful failure banner for Qwen instability
- acceptance tests passing (5 scenarios)
```

**Effort:** 3-5h

---

## Total оценка

| Phase | Effort |
|-------|--------|
| 17A (10 sub-phases) | 27-35h code |
| 17B | 3-4h |
| 17C | 6-8h |
| 17D | 3-5h |
| **Total** | **39-52h** Cursor Agent mode |

---

## Risk matrix

| Риск | Вероятность | Mitigation |
|------|-------------|------------|
| Qwen 7B нестабилен с tools даже после 17D | Средняя | Graceful banner + Claude fallback. Fine-tune → Roadmap 18. |
| Shadow hints замедляют tool loop (+1 RAG query на call) | Низкая | queryChunks <50ms, fail-silent on timeout |
| Migration частично сломается | Средняя | Transactional progress file, resume-capable, clearIndex reset |
| OneDrive sync break mid-operation | Средняя | EBUSY retry 3x, placeholder detection, EPERM warning |
| 16K num_ctx OOM на 8GB | Высокая | Detect OOM → banner → suggest 4K |
| Batch debounce теряет файлы на crash | Низкая | `flushReindex` в before-quit hook |
| `store_memory` tool spam загрязнит память | Средняя | Rate limit 1/min, dedup by similar content |

---

## Out of scope

- Fine-tune локальной модели → **Roadmap 18**
- MCP tools expansion (больше видимых tools в группах) + ChatGPT-5 → **Roadmap 19**
- Master Mode UI → **Roadmap 20**
- Payment / License / LAN → **Roadmap 21-23**

---

## Delivery

14 коммитов в 4 фазах: 17A.0 → 17A.1 → 17A.2 → 17A.3 → 17A.4 → 17A.5 → 17A.6 → 17A.7 → 17A.8 → 17A.9 → 17B → 17C → 17D → (final merge).

Между под-фазами: `npx tsc --noEmit` + `npm run build` + smoke test через AI Chat.

**Note про 17A.9:** код (17A.9.1-8) — Cursor. Переводы документов (17A.9.9) — Ariel делает отдельно через Claude web, не через Cursor.

---

## Handoff to Cursor

**Каждая фаза/под-фаза = отдельный промпт.** Рекомендую Plan mode для каждой, потом Execute. Формат:

```
Project folder: C:\Users\marce\OneDrive\Desktop\I_AM_RUNNING\I_AM_RUNNING_PLATFORM\iamrunner-ai

Read first:
- ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md (ЭТОТ ФАЙЛ)
- docs/architecture/README.md
- docs/architecture/RAG_SYSTEM.md (или AI_SYSTEM.md для 17A.0, 17D)
- src файлы из "Файлы для изменения" секции фазы

Implement Phase 17A.X as described. Follow the steps exactly.
Use extended thinking. Write complete files, do not truncate.
After implementation:
  npx tsc --noEmit && npm run build

Commit with EXACT message shown in the phase.
```

---

*Last updated: 19.04.2026 — v4 post-round-2-Cursor-review*
*Supersedes: iamrunner.ai/roadmaps/ROADMAP_17_RAG_PIPELINE_UNIFICATION.md*
