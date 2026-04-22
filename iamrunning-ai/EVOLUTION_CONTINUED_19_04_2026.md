# Evolution Continued — 19.04.2026 Evening Session

**Context:** Ariel + Opus 4.7 planning session. Phase 17A closure + Roadmap 17 remaining reordering.

---

## Что произошло за эту сессию (19.04.2026 вечер)

**Phase 17A полностью закрыт за ~11 часов Cursor time** (реальное), не 26-35h как оценивалось.

10 коммитов: `7d1599b → 15d3527 → e471557 → 8060a4f → 8e83095 → 1f9a5ff → hotfix → 38f18ee → 9ea82b3 → d7d9db1 → 7316add`.

Все успешно запушены на `github.com/ArielGrook/iamrunning.ai`.

---

## Ключевые архитектурные решения

1. **bge-m3 embedder** (1024-dim, 1.2GB) заменил nomic-embed-text (768-dim, 137MB). Trade-off: в 9× больше размер, но native multilingual quality для EN+RU.

2. **Bilingual RAG pattern** — источник правды EN, параллельные `rag/ru/RAG_*.md`. `metadata.language` из path. queryChunks `language: 'en' | 'ru'` filter. Undefined backward compat treated as EN.

3. **Language detection via cyrillic ratio** — последнее user message, порог 20%, fallback на предыдущее сообщение если < 10 letters, code fences stripped.

4. **Dual-location language instruction для Ollama** — short system prompt + end-of-user-message suffix. Qwen 7B не follows system prompts в длинном контексте, recency bias user message end работает.

5. **Claude доверяет system prompt** — single-location достаточно.

6. **Hardcoded Russian REPLACED, not augmented** — 2 места в ai-ipc.ts (Claude path line ~183, Ollama path line ~341) удалены и заменены на dynamic. Без удаления — contradictory prompt, модель путается.

7. **Scaffolding abandoned in favor of real translations** — Cursor Composer 2 thinking перевёл все 4 RAG файла напрямую, без TRANSLATION_PENDING placeholders. Counter 4/4 с первого коммита.

8. **MigrationState с embedderVersion field** — будущие embedder swap automatically trigger re-clear + reindex.

---

## Calibration takeaways

**Timing estimates were 2-3× conservative.** Composer 2 thinking + clean Premium requests → first-time-right, no rollbacks.

**New estimate for remaining Roadmap 17:**
- 17D (Ollama tool polish): 2-3h (was 3-5h)
- 17B (RAG structure + cleanup): 1.5-2h (was 3-4h)
- 17C (shadow hints): 3-4h (was 6-8h)
- **Total: 6-9h** (was 12-17h)

---

## Known issue discovered during 17A.9 verification

**EN/RU RAG files are desynchronized.** Cursor updated RU to current stack (bge-m3, `{project}/rag/`) during translation, but EN left at previous state (nomic-embed-text, `{userData}/knowledge-base/`).

Specific drift:
- `RAG_KNOWLEDGE.md` EN: stale embedder + KB location + no language-detection note
- `RAG_RULES.md` EN: probably no bge-m3+qwen OOM mention (RU has it)
- `RAG_STRATEGY.md` EN: actually in Russian (Ariel's original). Creates metadata.language='en' tagged at Russian content. RAG confusion for English clients.

**Severity:** 🟡 Not blocking — Ariel's workflow unaffected (he queries in RU). Will be embarrassing at first English client demo.

**Fix scheduled in Phase 17B** — part of RAG structure cleanup. Estimated +20-30 min to 17B.

---

## User-facing issue discovered during 17A.9 verification

**Qwen 7B tool call instability.** Test 3 (Russian query asking to read `src/main/ai-provider.ts`) — Qwen responded "файл не найден" despite file existing (verified via MCP). Not a file system issue. Qwen either:
- Failed to emit proper tool_call
- Called tool but returned response as if it failed
- Hallucinated the "not found" result

This is pre-existing Ollama tool-calling weakness, not a 17A.9 regression. Validates priority of **Phase 17D (Ollama tool calling polish)** which addresses exactly this pattern.

**Decision: Reorder remaining Phase 17 to 17D → 17B → 17C.**

Reasons:
1. 17D is user-facing urgent (tools fail in chat TODAY)
2. 17D is self-contained (no architectural coupling to 17B/C)
3. 17C depends on 17B (shadow hints need RAG structure) but 17D independent
4. Working tool calling needed before English client demos

---

## Next steps

**Immediate:** pause. Session was intensive. No Cursor work planned in next 12-24h.

**When resumed:**
1. Update roadmap 17 in ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md — reorder 17D first, update estimates
2. Launch Cursor Agent on 17D with Composer 2 thinking (matches criticality of tool-call handling)
3. 17D expected deliverable: text-based tool call regex fallback + tool schema injection in system prompt + graceful failure banner when Qwen loops
4. After 17D: 17B (RAG structure + EN/RU sync), then 17C (shadow hints)

**Parallel option (not started):** Roadmap 18 (Fine-tune v1) spec — QLoRA on RTX 3050 via unsloth, 300-500 CoT pairs from EVOLUTION.md + docs + git log. Independent of 17B/C/D.

---

## Documents referenced

- `ariel-workflow/iamrunning.ai/ROADMAP_17_EXTENDED.md` — main spec (v4)
- `ariel-workflow/iamrunning.ai/SESSION_HANDOFF_19_04_2026.md` — session handoff for next AI chat
- `workspace/SHARED_CONTEXT.md` — master context router
- `github.com/ArielGrook/iamrunning.ai` — code repository (17A complete at 7316add)

---

*Author: Ariel + Claude Opus 4.7 (19.04.2026 ~19:00 UTC+3)*
*Phase 17A closure + roadmap reordering documentation*
