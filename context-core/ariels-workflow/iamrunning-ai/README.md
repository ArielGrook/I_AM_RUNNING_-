# iamrunning.ai — Product workspace

Workspace for the **iamrunning.ai** desktop client (Electron + Ollama + MCP). GitHub: `ArielGrook/iamrunning.ai`.

## What lives here

- **Roadmaps** — `ROADMAP_17_EXTENDED.md` (CLOSED 21.04.2026 — kept as historical record + spec template for future roadmaps)
- **Handoffs** — `HANDOFF.md` (entry point for a new iamrunning.ai chat), `SESSION_HANDOFF_19_04_2026.md` (deprecated, kept for archaeology)
- **Evolution** — `EVOLUTION_CONTINUED_19_04_2026.md`, `EVOLUTION_CONTINUED_20_04_2026.md`, `EVOLUTION_CONTINUED_21_04_2026.md` (chain-of-thought record of product development — future fine-tune training data)
- **Specs** — `MCP_AS_A_SERVICE_SPEC.md` (Phase 2 concept: iamrunning.ai as MCP provider to IAM Client OS installations), `TOOL_DISTRIBUTION_SPEC.md`

## Why this is a dedicated folder (not in `../specifications/` or `../concepts/`)

iamrunning.ai is a full product with its own repo, roadmap, and cadence. Pulling everything iamrunning.ai-related into one place avoids polluting the platform-wide spec / concept spaces and makes it easy to onboard a chat specifically for this product.

## Cross-product linkage

iamrunning.ai shares architecture patterns with IAM Client OS (MCP protocol, tool groups, role model). Platform-wide decisions in `../memory/wisdom/DECISIONS.md` apply here too. EVOLUTION records here feed the global fine-tune dataset in `../legacy_future_dataset/wisdom/` and `../legacy_future_dataset/fine-tune-ideas/`.

## Current status (21.04.2026 evening)

**Roadmap 17 COMPLETE.** All 16 commits (`7d1599b` → `ae49823`) on `origin/main`. The local AI now:
- Uses tools stably via text-based fallback + dynamic schema injection (Phase 17D)
- Receives behavioral hints at every tool call via RAG-injected shadow instructions (Phase 17C)
- Can self-record memories via `store_memory` MCP tool — surfaced on subsequent RAG queries (Phase 17C)
- 9 MCP tools total, bilingual EN+RU with auto language detection, bge-m3 multilingual embedder (Phase 17A)
- Manifest-based RAG structure with templates and per-category resolution (Phase 17B)

**Total Cursor time across Roadmap 17: ~17 hours** (vs original 39-52h estimate; vs revised 30-39h). Composer 2 thinking continues to outperform spec author's intuition by 2-3×.

### Next

- **Roadmap 18 — Fine-tune v1** (queued; independent of Roadmap 17). 300-500 chain-of-thought training pairs from EVOLUTION + git log + acceptance transcripts. QLoRA on RTX 3050 8GB via unsloth, locally. Output: LoRA adapter (~300MB) distributable as `$1,000 permanent purchase` SKU.
- **Roadmap 19 — MCP Tools Expansion + ChatGPT-5** (queued). More tools in groups with visible sub-tools (NOT mega-tool architecture from IAM Client OS). OAuth for GPT-5 connector.
- **Roadmap 20+** — Master Mode UI, PayPal payments, License server on iamrunning.online, LAN + mDNS, Ollama proxy through Master.
- **Backlog concept: `THINKING_TRACE_UI`** — capture and display Qwen's intermediate reasoning. See `EVOLUTION_CONTINUED_21_04_2026.md` for technical approach options.

### Demoable today

The "AI that remembers your project" experience is shippable. Solo Mode tier ($50-150/mo) has a real differentiating feature beyond raw Ollama wrap. Worth showing to prospective Solo customers before adding more changes.
