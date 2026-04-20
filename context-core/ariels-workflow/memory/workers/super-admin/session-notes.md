# Session Notes — Super Admin
*Last updated: 2026-04-06 | Session: Router Architecture + Security Audit*

---

## СТАТУС ПЛАТФОРМЫ (актуально на 2026-04-06)

### Что сделано в этой сессии

**Router Architecture — COMPLETE:**
```
lib/tools-registry.ts  ← Все инструменты, категории, presets (одна запись = всё)
lib/permissions.ts     ← can(), canFile(), canApply(), canScopeMember()
lib/notify.ts          ← notify(event, payload) — все уведомления
lib/status.ts          ← transitionPr(), transitionTask() — атомарные переходы
```

**Security Fixes (все 6 критических):**
- Path traversal в pr-read-file ✅
- Command injection в dev-save-file ✅
- Missing authz на conversation-delete ✅
- Substring author matching в worker-handlers ✅
- Token timing side-channel в auth.ts ✅
- deploy-trigger fail-open ✅

**Architecture cleanup:**
- Duplicate createPullPoolEntry удалён из memory.ts ✅
- lib/data/pull-pool.ts = единственный источник ✅
- findActiveTaskRef и syncTaskStatus добавлены в data layer ✅
- prReview мигрирован на notify() ✅

**Dev Console backend:**
- app/api/dashboard/lib/dev-console-config.ts ✅
- app/api/dashboard/lib/dev-handlers.ts ✅
- capability 'dev_console' в ALL_CAPABILITIES ✅
- developer + reviewer получают dev_console по умолчанию ✅

**Audit:**
- IDEAS/FULL_PLATFORM_AUDIT.md — полный аудит 80+ файлов (Cursor Opus) ✅
- Security: 6/10 → 8.5/10 после фиксов ✅
- Architecture: 8/10 → 9/10 ✅

---

## СЛЕДУЮЩИЙ ЧАТ — НАЧАТЬ ЗДЕСЬ

### Задача 1: Dev Console Frontend (через Cursor)
Промт готов в `memory/CURSOR_PROMPTS.md`
Cursor строит `DashboardDevConsoleTab.tsx` на основе AdminDevConsoleTab.tsx

**Важно для Cursor — git push:**
```bash
# Cursor должен работать только в папке iam-client-os
cd /path/to/I_AM_RUNNING_PLATFORM/iam-client-os
git add -A
git commit -m "feat: DashboardDevConsoleTab"
git push origin main
# НЕ трогать i-am-running папку вообще
```

### Задача 2: Vitest scaffold (Quick Win #9 из аудита)
```bash
npm install -D vitest
# Создать vitest.config.ts
# 3 smoke теста: can(), safePath(), matchesGlob()
```

### Задача 3: Unified capability check
enforceCapability() в capability-gate.ts должна делегировать к can() из lib/permissions.ts
Файл: app/api/dashboard/lib/capability-gate.ts

### Задача 4: worker-handlers.ts → data layer
Заменить readFile(join(DATA_DIR, 'tasks.json')) на loadStructuredTasks()

---

## DESKTOP CLIENT ПЛАН (параллельно с Cursor)

```
Tauri app "I AM RUNNING OS":
Phase 1: Login + MCP connection + Dashboard (задачи, сообщения, PRs)
Phase 2: RAG (ChromaDB + nomic-embed-text + Ollama)  
Phase 3: Dataset generator (Claude API → Q&A pairs → JSONL)
Phase 4: QLoRA fine-tune (Qwen2.5-Coder 32B + unsloth)
Phase 5: MCP Bridge (local model → MCP tools на сервере)
Phase 6: Multi-worker (Ollama сервер через Cloudflare Tunnel)
```

Модель для fine-tune: **Qwen2.5-Coder 32B** (QLoRA, работает на 24GB VRAM)
Датасет: 3 категории × 500-1000 пар = 1500-3000 примеров
- Кодовые паттерны (из кодовой базы)
- Архитектурные решения (из evolution, roadmap, аудита)
- Паттерны роутеров (из lib/*.ts документации)

Бизнес-модель: $4-5k пакет = Tauri клиент + iam-client-os VPS + fine-tuned локальная AI

---

## КЛЮЧЕВЫЕ ФАЙЛЫ

| Что | Где |
|-----|-----|
| Полный аудит | `IDEAS/FULL_PLATFORM_AUDIT.md` |
| Router архитектура | `IDEAS/ROUTER_ARCHITECTURE.md` |
| Dev Console спека | `IDEAS/DEV_CONSOLE_DESIGN.md` |
| Persistent Memory план | `IDEAS/MCP_PERSISTENT_MEMORY.md` |
| QA чеклист | `IDEAS/PLATFORM_CHECKLIST.md` |
| Cursor промты | `memory/CURSOR_PROMPTS.md` |
| Permission router | `lib/permissions.ts` |
| Status router | `lib/status.ts` |
| Notify router | `lib/notify.ts` |
| Tool registry | `lib/tools-registry.ts` |
| Dev handlers | `app/api/dashboard/lib/dev-handlers.ts` |
| Dev config | `app/api/dashboard/lib/dev-console-config.ts` |
