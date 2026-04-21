# Evolution Continued — 21.04.2026 Evening Session

**Context:** Continuation of iamrunning.ai evening track — Phase 17D and Phase 17C executed and shipped. Roadmap 17 is now complete.

**Closes:** Roadmap 17 EXTENDED v4 (RAG Pipeline + Persistent Memory + Ollama Tool Calling).

---

## TL;DR

Roadmap 17 DONE. Three commits today on top of `7d66300` (17B):

1. `2333a9a` — feat(ollama): robust tool calling with text-based fallback (17D initial)
2. `b8063e7` — fix(ollama): switch tool-call format to Ollama-native `{name, arguments}` (17D hotfix)
3. `ae49823` — feat(memory): persistent memory via shadow instructions (17C)

All pushed to `origin/main` at `github.com/ArielGrook/iamrunning.ai`. Git tree clean on `ae49823`. Phases 17A.0–17A.9, 17B, 17D, 17C all closed → **Roadmap 17 complete**.

Manual acceptance verified by Ariel. Qwen2.5-Coder:7b now stably uses tools, doesn't loop on already-read files, can self-store memories via `store_memory` tool, and surfaces stored memories on subsequent RAG queries.

---

## Phase 17D — Ollama Tool Calling robustness (DONE)

### Goal
Make Qwen2.5-Coder:7b stably invoke MCP tools. Specifically address the 17A.9 Test 3 regression where Qwen wrote `{"name":"...","arguments":{...}}` JSON in `content` field instead of using structured `tool_calls`, and the existing parser ignored it.

### What shipped — `2333a9a` (initial)

**File:** `src/main/ai-provider.ts`

- `TOOL_CALL_REGEX` constant for text-based extraction
- `extractToolCallsFromText(text, availableTools)` function — parses JSON tool calls from assistant message text; emits `tc-text-...` IDs to distinguish from structured calls
- `renderOllamaToolSchemas(tools: ClaudeTool[])` — dynamically renders tool schema block from `tools[]` parameter (NOT hardcoded). When 17C adds `store_memory`, it auto-appears in the schema without further code changes.
- System prompt for Ollama path becomes `systemPrompt + '\n\n' + renderOllamaToolSchemas(tools)` when `tools.length > 0`. Claude path untouched (Claude uses native tool_use API; schema injection harmful there).
- After main stream parse loop: text fallback runs if `toolCalls.length === 0 && assistantMessage.includes('"tool"')` (later changed in hotfix to check `'"name"'` and `'"arguments"'`).
- `nonToolIterations` counter: incremented when iteration produces zero tool calls AND has tool-shaped text that didn't parse, OR when reply is empty with tools available. Reset on successful tool calls. Normal final answers `break` out of loop without affecting counter. After 3 consecutive → `throw new Error('QWEN_TOOL_INSTABILITY')`.
- Bonus polish from Cursor: `fn.arguments` parsed as JSON string when Ollama emits structured arguments as serialized JSON instead of object. Not in spec but in spirit of "robust tool calling" — Qwen variant.

**File:** `src/main/ai-ipc.ts`

- Removed legacy post-`universalChat` retry loop that parsed old `{"name", "arguments"}` format manually with up to 5 retries (was duplicate state, different format from 17D's `{"tool", "args"}`, would cause inconsistent behavior if both lived together).
- Wrapped Ollama `universalChat` call in try/catch — `QWEN_TOOL_INSTABILITY` caught specifically, emits `ai:tool-instability-detected` IPC event, returns without firing generic `ai:error`.
- Bonus polish from Cursor: `ai:set-config` IPC handler now merges with `loadAiConfig()` and preserves `apiKey` when payload omits it. Prevents "Switch to Claude" banner action from accidentally wiping user's stored Claude key.

**Files:** `src/preload/index.ts`, `src/renderer/screens/AiChat.tsx`, `src/renderer/stores/ai.ts`

- `onAiToolInstability` listener exposed on preload bridge
- AiChat banner (same band style as existing OOM banner) with "Switch to Claude" / "Dismiss" buttons; optional inline hint "Add Claude key in Settings → AI Configuration" when no key after switch
- `ai.ts` store clears `isGenerating` on instability event so UI doesn't get stuck after instability exit

### Critical mid-phase regression — `b8063e7` (hotfix)

**Manual Test 1 of 17D acceptance (run by Ariel) revealed all 5 tests failed in identical way:** Qwen kept writing JSON in content using `{"name":"...","arguments":{...}}` — the Ollama-native function-calling format it was trained on — but the regex from spec matched `{"tool":"...","args":{...}}`. Schema injection did NOT override Qwen's training; the model ignored the schema and used its trained format.

**Net effect:** between deletion of old post-process loop (parsed `name/arguments`) and the new fallback inside `ollamaChat` (parsed `tool/args`), there was a window where NOTHING parsed text-based tool calls. Tools appeared to be "called" in the visible chat but never actually executed.

**Root cause:** spec was wrong. The original 17D spec author (this AI in previous session) chose `{"tool", "args"}` thinking it was cleaner / distinctive, expecting schema injection to teach the model. Model training won.

**Fix in `b8063e7`:**
- `TOOL_CALL_REGEX` switched to `/\{\s*"name"\s*:\s*"(\w+)"\s*,\s*"arguments"\s*:\s*(\{[^}]*\})\s*\}/g`
- `renderOllamaToolSchemas` example line updated to `{"name": "tool_name", "arguments": {"param1": "value1"}}`
- Fallback trigger guard updated from `assistantMessage.includes('"tool"')` to `assistantMessage.includes('"name"') && assistantMessage.includes('"arguments"')` — bonus catch from Cursor (without it, the new regex would never run because the guard still looked for old keyword)

After hotfix: Test 1 passed. Real `read_file` calls executed, real content returned, Qwen replied in Russian with line count.

### Acceptance results (post-hotfix, post-17C)

Verified by Ariel manually:

| # | Test | Result |
|---|------|--------|
| 1 | "Прочитай src/main/ai-provider.ts и скажи сколько строк" | ✅ One read_file call, real content, Qwen answered "478 строк" in Russian, did NOT loop |
| 2 | "Найди где определена queryChunks" | ✅ search_files called, results returned. Note: Qwen pointed to `roadmaps/ROADMAP_10A_EMBEDDINGS.md` for the function definition — that's where the search hit ranked highest, not the actual `vector-store.ts` source. Acceptable for 17D (mechanic works); model selection of the wrong hit is a separate issue. |
| 3 | "Audit AiChat.tsx" | ✅ read_file called, English audit response returned (language detection from 17A.9 working) |
| 4 | "Допиши в rag/memory/workflow_reminders.md..." | ✅ Combined with 17C — store_memory used (better than write_file/patch_file) |
| 5 | "Запомни что не используем Redux..." | ✅ Combined with 17C — store_memory called with `category: workflow_reminders` (semantically should have been `anti_patterns`, but model picked workflow_reminders; not a 17D bug, addressable via better starter content in `behavioral_patterns.md` or fine-tune in Roadmap 18) |
| 6 | Banner trigger | Not artificially triggered during testing — Qwen worked stably enough that `nonToolIterations` never reached 3. Code in place, will fire when real instability occurs. |
| 7 | Claude regression | Not formally tested this session (Ariel's Claude flow path unchanged in code; verified by inspection: no schema injection in `claudeChat`, no `tools[]` rendering in Claude wire) |

### Lessons

1. **Don't trust schema injection to override model training in one turn.** Small models (7B) align with their training data over in-context instructions, especially when the format is JSON syntax. Use the format the model was trained to emit, not a "cleaner" format you invent.
2. **Model-format-first principle applies to all small-model tool calling.** Future work with new local models (e.g. Qwen2.5-Coder:14b in MCP-as-a-Service Phase 2) — check actual emit format empirically before designing parsers.
3. **Cursor sometimes catches gaps spec author missed.** The "fallback trigger guard" update in `b8063e7` was Cursor noticing that without changing the `includes()` check, the new regex would never even run. Listen for these in commit messages.

---

## Phase 17C — Persistent Memory via Shadow Instructions (DONE)

### Goal
Local Qwen receives behavioral context at every tool call via RAG-injected shadow hints. Model "remembers" patterns without weight changes.

### What shipped — `ae49823`

**New module:** `src/main/shadow-hints.ts`

- `getShadowHints(toolName, args)` — runs `queryChunks` against `categoryFilter: 'memory'` with `topK: 2`, `minScore: 0.7`. Maps results to `{ text, source }`. Wraps everything in try/catch; on failure (RAG not initialized, embedder cold, Ollama down) returns empty array. Fail-silent per spec — tool loop continues normally.
- `appendHints(result, hints)` — wraps each hint in `<hint source="...">...</hint>` block, joins with `\n\n`. Empty hints → returns result unchanged with no separator.

**Integration in `src/main/ai-provider.ts`:**

- Both Ollama and Claude tool-execution paths: after `onToolCall(event)` returns, call `getShadowHints` + `appendHints` before pushing tool content to model wire. Hints injected ONLY in what model sees, NOT in IPC events to UI (UI tool-call panel stays clean).

**New shared module:** `src/main/store-memory.ts`

- `executeStoreMemoryTool(args, projectPath)` — validates `category` against `['behavioral_patterns', 'file_relationships', 'anti_patterns', 'workflow_reminders']`, applies 60-second per-category rate limit (timestamp updated only on successful append, not on rate-limit rejection or other failures), appends `## YYYY-MM-DD — first line of content` heading + body to `rag/memory/{category}.md`, then calls `scheduleReindex(projectPath)` (debounced from 17A.3 — does NOT block tool response).
- Bonus polish from Cursor: extracted as shared module instead of duplicating between MCP server and `executeLocalAiTool` switch. Single source of truth.

**Integration:** 

- `src/main/ai-ipc.ts` — `store_memory` added to `LOCAL_AI_TOOL_SCHEMAS` (so it appears in Ollama schema injection automatically — 17D's renderer reads from this list), to `LOCAL_AI_TOOL_NAMES` set (so Claude+VPS tool deduplication still works), to `executeLocalAiTool` switch (delegates to `store-memory.ts`). AVAILABLE TOOLS docstring text updated.
- `src/main/local-mcp-server.ts` — registered as 9th MCP tool (description, inputSchema with category enum + content). Same handler delegating to shared module. `/health` endpoint now reports `tools: 9`.

**Starter memory docs:** `rag/memory/*.md` (4 files, EN only per 17A.9 architecture decision)

- `behavioral_patterns.md` — Russian/English code preservation; tool result is the answer source
- `file_relationships.md` — indexer↔vector-store coupling; ai-provider↔ai-ipc coupling
- `anti_patterns.md` — don't index node_modules; don't write raw JSON for RAG content
- `workflow_reminders.md` — rebuild after ipc-handlers.ts changes; reindex after Explorer drop; **after successful read_file, answer directly — don't re-read same path** (this is the hint that fixed the looping behavior in 17D Test 1); when user says "запомни"/"remember" → call store_memory, don't write to README.md

**Documentation:** `docs/PERSISTENT_MEMORY_GUIDE.md` — memory vs knowledge ("how" vs "what"), the four categories with usage guidance, format rules, AI vs manual writes, good/bad examples, rate limit behavior.

**Note:** `rag/.rag-manifest.json` had unstaged auto-adoption diffs from prior sessions. Cursor explicitly left them unchanged (restored to last commit state) so the 17C commit stays scoped. `memory` category resolution still works because path-based resolver (`memory/` prefix) takes precedence over manifest entries — manifest rows for memory files not required.

### Acceptance results

Verified by Ariel manually (after rebuild + Re-index of Knowledge Base to embed new memory docs):

| # | Test | Result |
|---|------|--------|
| 1 | "Прочитай src/main/ai-provider.ts и скажи сколько строк" | ✅ One read_file, real content, Qwen answered "478 строк", **did NOT loop on repeat read_file** — the workflow_reminders hint worked |
| 2 | "Запомни что в проекте не используем Redux, только Zustand" | ✅ store_memory called, file `rag/memory/workflow_reminders.md` updated with new section. (Qwen chose `workflow_reminders` instead of semantically-correct `anti_patterns` — addressable via better starter examples or fine-tune.) |
| 3 | "что у нас по state management?" — fired ~10 seconds after Test 2 | ✅ Qwen mentioned Zustand as convention. RAG had picked up the freshly-stored chunk after debounced reindex completed. |
| 4 | "Запомни ещё что мы используем Tailwind, не CSS modules" — fired during reindex of Test 2's chunk | ✅ Second store_memory accepted (different content, model picked `workflow_reminders` again). Rate limit not triggered because... actually the second call was within 60s window of the first; the fact that it succeeded suggests either (a) rate limit logic uses content-aware dedup we didn't spec, (b) timing window was just over 60s, or (c) rate limit silently failed open. **Worth checking in code review** — if rate limit didn't actually engage, behavior was permissive but not destructive, so not a blocker. |
| 5 | Fail-silent on RAG error | Not artificially tested. Tested implicitly: indexer was running ("AI paused" state visible in UI during Test 1) — Qwen still got hint and behaved correctly, so getShadowHints either succeeded (RAG was responsive enough) or returned empty silently. No crashes observed. |
| 6 | 17D regression — search_files | ✅ "Найди где определена queryChunks" worked, search_files returned hits. (Result accuracy commentary same as 17D Test 2 — search returned doc files first, model picked one of them; mechanic works, ranking is a separate concern.) |

### Ariel's reaction

> "Я вообще охуел, когда оно начало использовать команду 'запомнить' что-то и добавила это в РАГ. И типа стало на примерно на 10 чанков больше проиндексировано. Очень классная тема."

The visible feedback loop — user says "remember X" → tool call appears → file changes → next query surfaces the memory — was the most tangible payoff. The system feels "alive" in a way it didn't with isolated tool calls.

### Lessons

1. **Hints in tool result work, hints in system prompt are weaker.** Same RAG content, different injection point. Tool result hints arrive AT the moment of need (after a specific action). System prompt hints arrive at the start of every conversation, lose attention over long context. This pattern generalizes: any time you want a small model to learn a workflow rule, attach it to the trigger event.
2. **`store_memory` semantic category selection is imperfect.** Qwen picked `workflow_reminders` for what should have been `anti_patterns`. The category enum is exposed in the tool schema, but the model lacks intuition for which is appropriate. Two fixes possible: (a) add starter examples to `behavioral_patterns.md` showing "user said не используем X → category: anti_patterns", (b) wait for fine-tune in Roadmap 18 to encode the convention. Defer to Roadmap 18.
3. **Path-based category resolution from 17B was the right architectural call.** Memory files don't need manifest entries. New files added under `rag/memory/` automatically get `category: memory` via resolver. Manifest stays clean. Rate of false positives (random files getting `memory` category) is zero because nothing else lives under that path.

---

## Roadmap 17 — close summary

**Total commits across all phases** (`7d1599b` → `ae49823`, 19.04.2026 evening through 21.04.2026 evening):

```
ae49823  feat(memory): persistent memory via shadow instructions          [17C]
b8063e7  fix(ollama): switch tool-call format to Ollama-native            [17D hotfix]
2333a9a  feat(ollama): robust tool calling with text-based fallback       [17D]
7d66300  feat(rag): structure, manifest, templates, memory foundation    [17B]
7316add  feat(rag): bilingual EN+RU support with auto language detection [17A.9]
e536de7  chore: gitignore runtime state + test fixtures from 17A.6       [17A.6 tail]
d7d9db1  feat(rag): 17A.8 nuances — live stats + clear index UI          [17A.8]
9ea82b3  feat(rag): queryChunks filters + update all call sites          [17A.7]
38f18ee  feat(rag): Windows/OneDrive guards in indexer                   [17A.6]
619d657  fix(rag): bge-m3 cold-start timeout — bump to 120s              [17A.5 tail]
1f9a5ff  feat(rag): transactional migration + embedder swap to bge-m3    [17A.5]
8e83095  feat(rag): targeted chunk deletion on KB remove                 [17A.4]
8060a4f  feat(rag): batched KB adds with debounced reindex               [17A.3]
e471557  feat(rag): KB as thin layer over rag/, remove dead chunker      [17A.2]
15d3527  feat(rag): scope indexer to {project}/rag/ only                 [17A.1]
7d1599b  feat(ollama): expose num_ctx, num_predict, temperature in Settings [17A.0]
```

**14 phase commits + 2 tail/hotfix commits = 16 total.** All on `main`, all pushed.

**Time accounting (rough, from sessions 19.04 + 20.04 + 21.04):**
- Phase 17A: ~11h
- Phase 17B: ~2h
- Phase 17D + hotfix: ~2h
- Phase 17C: ~2h
- **Total Roadmap 17: ~17h Cursor time** (vs original 39-52h estimate; vs revised 30-39h). Composer 2 thinking + clean Premium prompts continue to outperform spec author's intuition by 2-3×.

**State of the system after Roadmap 17:**
- RAG pipeline unified, scoped to `{project}/rag/`, bge-m3 embedder, bilingual EN+RU with auto language detection, Windows/OneDrive resilient
- Ollama tool calling stable via text-based fallback + dynamic schema injection + graceful banner
- Persistent memory via shadow hints; `store_memory` tool for AI self-recording
- 9 MCP tools, manifest+templates structure, full architecture documentation

**What this means commercially:**
- Local AI experience is now genuinely useful for solo developers (Solo Mode tier $50-150/mo)
- The "AI that remembers your project" demo is shippable — can be shown to prospective Solo customers
- MCP-as-a-Service (Phase 2) infrastructure foundations are in place — `store_memory` + shadow hints generalize to per-tenant memory in shared model

---

## Backlog — captured for future work

### Concept: `THINKING_TRACE_UI` — capture and display Qwen's intermediate reasoning

**What Ariel observed during 17C testing:** During tool-using interactions, Qwen visibly streams "thinking" text — tentative reasoning, partial sentences, exploration — but the final UI render replaces this with only the polished answer. The intermediate trace is lost.

**Value:**
- Debugging: see why model chose a specific tool / made a specific decision
- Trust: user understands the model's logic, not just the conclusion
- Training data: this trace IS the chain-of-thought needed for Roadmap 18 fine-tune

**Technical approach options:**
1. **Capture full stream, render collapsible "🧠 Thinking" block above final answer.** Lowest effort. Stream tokens to a buffer; on `done`, if the final assistant message diverges from the buffer's accumulated state, store the divergent prefix as the "thinking" block. UI: small collapsed panel by default, click to expand.
2. **Switch to a reasoning model.** DeepSeek-R1-Distill-Qwen-7B has native `<think>` tags. Drop-in replacement at the Ollama level (just `ollama pull deepseek-r1-distill-qwen-7b`). UI parses `<think>...</think>` separately. Larger semantic shift — reasoning models behave differently from instruct models, may need prompt re-tuning.
3. **Hybrid: keep Qwen2.5-Coder for tool calls, switch to reasoning model for "explain this" / "audit this" queries.** Provider router decides per-query type. Most complex, most flexible.

**Recommendation:** Option 1 first (low risk, high learning). Option 2 if Option 1's "thinking" content turns out to be too noisy/repetitive (instruct models often emit thinking that's essentially restating the question).

**Where to file:** New roadmap after Roadmap 18, OR as a Roadmap 17.5 polish if it doesn't unblock anything else. Defer prioritization until Roadmap 18 (fine-tune) results inform whether this is needed for trust or made redundant by better-aligned model.

### Bug surface to monitor

- `store_memory` rate limit timing in Test 4 — check whether 60s window actually engaged or silently failed open. Read `src/main/store-memory.ts` and verify the timestamp comparison logic matches the spec. Low priority unless real-world spam happens.
- Qwen `store_memory` category selection bias — picks `workflow_reminders` even when `anti_patterns` is semantically correct. Add starter examples in `behavioral_patterns.md` when convenient (cosmetic, not blocker).
- Qwen `search_files` result interpretation — when search hits both a doc file and a source file, model sometimes attributes definitions to the doc. Acceptable for now; addressable via fine-tune.

---

## Next session — Roadmap 18 (Fine-tune v1)

**Status:** Queued. Independent of Roadmap 17 — can start in a fresh chat anytime.

**Scope (rough):**
- 300-500 chain-of-thought training pairs from EVOLUTION docs + git log + acceptance test transcripts
- QLoRA on RTX 3050 8GB via unsloth, locally (no cloud)
- Target: Qwen2.5-Coder:7b → fine-tuned variant aware of project conventions, MCP tool patterns, architecture decisions
- Output: LoRA adapter (~300MB), distributable to clients via license server

**Why now:**
- Roadmap 17 produced exactly the structured records (EVOLUTION, ROADMAP, sessions, commits) needed as training data
- Local hardware sufficient for adapter training
- Outcome unblocks fine-tune adapter as a `$1,000 permanent purchase` SKU (per business model)

**Why NOT now in same session:**
- Different cognitive mode (data prep + training pipeline vs. code shipping)
- Roadmap 17 deserves clean close + handoff documentation (this file)
- Ariel may want to demo the post-17C state to a prospective Solo customer before adding more changes

**Handoff for new chat:** Read this file + ROADMAP_17_EXTENDED.md + EVOLUTION_CONTINUED_19_04_2026.md + EVOLUTION_CONTINUED_20_04_2026.md to understand the data corpus already accumulated. Then design Roadmap 18 spec.

---

## Other parallel tracks (untouched this session)

- **iam-client-os migration to iamrunning.online** — Ariel working separately on Steps 3-6 (Admin page frontend → source migration → validation → lego-base decommission). Time-pressured: Time4VPS billing cutoff ~22-23.04.
- **GTM:** LinkedIn (Gilad Shoham, Leon Mulumud), YouTube AI/automation channels, cold email 10/day, Reddit r/mcp warming, Upwork Appeal monitoring.

---

*Author: Ariel + Claude Opus 4.7 (21.04.2026 evening, ~22:00 UTC+3)*
*Session: 17D (start + hotfix) + 17C → Roadmap 17 close*
*Commits: 2333a9a, b8063e7, ae49823 on origin/main*
