# Evolution Continued — 20.04.2026 Morning Session

**Context:** Morning status check before Ariel returns to iam-client-os focus. Closes out yesterday's iamrunning.ai work (Phase 17A + 17B) for new AI chat to pick up in evening.

---

## Что произошло 19.04.2026 (полный день)

**Двойной трек:** Ariel работал утром на iam-client-os (7 коммитов — Stage 3 install verification + skeleton sync + security fixes), вечером перешёл на iamrunning.ai (12 коммитов — Phase 17A + 17B Roadmap 17).

### iamrunning.ai — Phase 17A + 17B COMPLETE

**12 коммитов всё запушены на `github.com/ArielGrook/iamrunning.ai`:**

1. `7d1599b` — 17A.0 Ollama params (num_ctx/num_predict/temperature + OOM banner)
2. `15d3527` — 17A.1 indexer scope → {project}/rag/
3. `e471557` — 17A.2 KB thin layer (removed direct addChunk + dead chunker)
4. `8060a4f` — 17A.3 batched scheduler + 1.5s debounce
5. `8e83095` — 17A.4 targeted chunk deletion via metadata.path
6. `1f9a5ff` — 17A.5 transactional migration + bge-m3 swap
7. **hotfix** — bge-m3 cold-start timeout 15s→120s (pushed)
8. `38f18ee` — 17A.6 Windows/OneDrive guards
9. `9ea82b3` — 17A.7 queryChunks filters + QueryOptions
10. `d7d9db1` — 17A.8 live RAG stats + Clear Index UI + embedding-model guard
11. `7316add` — 17A.9 bilingual EN+RU + auto language detection + 4 RU translations
12. `7d66300` — 17B RAG structure + manifest + memory foundation + EN sync

**Total Cursor time:** ~13 часов (vs original estimate 20-30h — Composer 2 thinking значительно быстрее и качественнее чем мои калибровки)

**Git tree clean на `7d66300`.**

---

## Ключевые архитектурные решения зафиксированные за сессию

1. **bge-m3 embedder** (1024-dim, 1.2GB) заменил nomic-embed-text (768-dim, 137MB). Trade-off: в 9× больше размер, но native multilingual quality для EN+RU.

2. **Bilingual RAG pattern** — источник правды EN, параллельные `rag/ru/RAG_*.md`. `metadata.language` из path. queryChunks `language: 'en' | 'ru'` filter. Undefined backward compat treated as EN.

3. **Language detection via cyrillic ratio** — последнее user message, порог 20%, fallback на предыдущее сообщение если < 10 letters, code fences stripped.

4. **Dual-location language instruction для Ollama** — short system prompt + end-of-user-message suffix. Qwen 7B не follows system prompts в длинном контексте, recency bias user message end работает.

5. **Claude доверяет system prompt** — single-location достаточно.

6. **Hardcoded Russian REPLACED, not augmented** — 2 места в ai-ipc.ts (Claude path + Ollama path) удалены и заменены на dynamic. Без удаления — contradictory prompt, модель путается.

7. **Scaffolding abandoned in favor of real translations** — Cursor Composer 2 thinking перевёл все 4 RAG файла напрямую, без TRANSLATION_PENDING placeholders. Counter 4/4 с первого коммита.

8. **MigrationState с embedderVersion field** — будущие embedder swap automatically trigger re-clear + reindex.

9. **Manifest схема объектная (17B)** — `{version, lastUpdated, documents[]}`. Legacy flat array формат сохранён для backward compat. `rag-manifest.ts` как shared utilities модуль.

10. **Path-based category resolution (17B)** — `memory/` всегда `category: 'memory'` regardless of manifest. `ru/RAG_X.md` наследует category от EN `RAG_X.md` entry. Bilingual-aware без дублирования manifest entries.

---

## Manual verification 17A.9 — 5/6 тестов прошли

Ariel прогнал 6 core behavior тестов в running Electron:

| # | Тест | Результат |
|---|---|---|
| 1 | EN query → EN response | ✅ |
| 2 | RU query → RU response (from rag/ru/) | ✅ |
| 3 | RU query "прочитай src/main/ai-provider.ts" | ❌ Qwen tool-call failed — сказал "файл не найден" для существующего файла |
| 4 | Short "ok" followup → continues RU | ✅ |
| 5 | Code block with RU comment → RU response, code preserved | ✅ |
| 6 | Bilingual retrieval: EN query hits rag/, RU query hits rag/ru/ | ✅ |

**Test 3 critical insight:** файл `src/main/ai-provider.ts` реально существует (verified через MCP connector). Qwen либо не emit'ит правильный tool_call, либо emit'ит но hallucinates "not found" result. **Это именно то что чинит Phase 17D.**

---

## EN/RU RAG sync issue — FIXED в 17B

Во время 17A.9 translation Cursor обновил RU версии до текущего состояния кода (bge-m3, `{project}/rag/`, language detection), **но EN остались stale**. Последствия:
- `RAG_KNOWLEDGE.md` EN: говорил `nomic-embed-text` (неправильно)
- `RAG_RULES.md` EN: не содержал bge-m3+qwen VRAM contention section
- `RAG_STRATEGY.md` EN: **был на русском** (оригинал Ариэля) — создавал `metadata.language='en'` на Russian content, ломал bilingual retrieval

**17B включил EN sync cleanup** как integrated task:
- Все 3 EN файла синхронизированы с RU
- `RAG_STRATEGY.md` переписан на natural English (сохранена структура headings + code fences)
- Ariel protects against first-demo embarrassment для English clients

---

## Calibration takeaways

**Timing estimates были 2-3× conservative.** Composer 2 thinking + clean Premium requests → first-time-right, no rollbacks.

**Реально:**
- Phase 17A (10 sub-phases): 11 часов (estimate was 21-27h, потом 27-35h)
- Phase 17B (1 phase): 2 часа (estimate was 3-4h)
- **Total: 13 часов** (estimate was 30-39h)

**Новая калибровка для 17D + 17C:**
- 17D (Ollama tool polish): 2-3h (was 3-5h)
- 17C (shadow hints): 3-4h (was 6-8h)
- **Remaining Roadmap 17: 5-7h** (was 12-17h)

**Roadmap 17 close возможно в одну рабочую сессию.**

---

## Remaining Roadmap 17

**REORDERED order (17D first):**
- ◻ **17D** — Ollama tool calling polish (NEXT)
  - Text-based tool call regex fallback (для когда Qwen emit'ит JSON в content вместо structured tool_calls)
  - Tool schema injection в system prompt
  - Graceful failure banner после N неудачных итераций
  - Addresses test 3 failure from 17A.9 verification
- ◻ 17C — Persistent memory via shadow hints (depends on 17B manifest + memory/ foundation — now unblocked)

---

## Что Ariel делает 20.04.2026 утром (текущий момент)

- ⏸ **iamrunning.ai — PAUSED.** Не трогает Cursor до вечера.
- 🔴 **iam-client-os — active focus.** Продолжает Stage 2-4 работу параллельно.

Planning на iamrunning.ai будет **вечером 20.04 через новый AI chat** — именно поэтому эта документация обновляется утром, чтобы новый чат мог сразу понять state.

---

## Инструкция для вечернего чата (кто бы ни продолжил iamrunning.ai)

**При старте сессии прочитать в этом порядке:**

1. `workspace/SHARED_CONTEXT.md` section 5 (iamrunning.ai) — обновлён 20.04 утром, содержит полный статус Phase 17A + 17B
2. `ariel-workflow/session-state.yaml` — свежие коммиты, backlog
3. Этот файл (`ariel-workflow/iamrunning.ai/EVOLUTION_CONTINUED_20_04_2026.md`) — tactical recap 17A+17B
4. `ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md` — секция 17D для генерации промпта Cursor
5. `ariel-workflow/iamrunning.ai/EVOLUTION_CONTINUED_19_04_2026.md` — предыдущий recap (конец 17A)

**Не нужно пере-читать:** ROADMAP_17_EXTENDED.md целиком (только секция 17D). SESSION_HANDOFF_19_04_2026.md (устарел — был утром 19.04, до завершения 17A+17B).

**Следующая задача:**

Составить промпт для Cursor Agent mode (Composer 2 thinking) на Phase 17D. Это последний "тяжёлый" блок Roadmap 17.

17D spec находится в `ROADMAP_17_EXTENDED.md` — ищи секцию `## Phase 17D — Ollama Tool Calling robustness`. Три main items:
1. Text-based tool call regex fallback (`TOOL_CALL_REGEX` pattern in `src/main/ai-provider.ts`)
2. Tool schema injection в Ollama system prompt (описание 8 MCP tools)
3. Graceful failure banner + `QWEN_TOOL_INSTABILITY` event после 3 неудачных итераций

---

## Parallel option (не начато)

**Roadmap 18 spec** — Fine-tune v1 (QLoRA on RTX 3050 via unsloth, 300-500 CoT pairs). Independent от 17D/C. Можно набросать скетч пока Cursor работает над 17D если чат с достаточным количеством времени.

---

## Critical reminders для нового чата

1. **Composer 2 thinking для 17D** — не Auto, не Sonnet 4. Tool call handling слишком критичен чтобы экономить quality.
2. **Cursor уже знает про git push workflow** — все промпты 17A.0-17B включали `git push origin main` в финальные шаги, паттерн работает.
3. **Ariel тестирует вручную после каждого коммита** — в промпте 17D указать 2-3 manual acceptance tests which he can run in 5-10 min.
4. **Тест 3 из 17A.9 verification (Qwen сказал "файл не найден" для существующего файла) — это regression test для 17D.** После 17D этот тест обязан пройти.

---

*Author: Ariel + Claude Opus 4.7 (20.04.2026 ~08:10 UTC+3)*
*Morning documentation sync — preparing for evening continuation via new chat*
