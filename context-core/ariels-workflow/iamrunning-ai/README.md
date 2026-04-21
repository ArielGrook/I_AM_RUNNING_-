# iamrunning.ai — Product workspace

Workspace for the **iamrunning.ai** desktop client (Electron + Ollama + MCP). GitHub: `ArielGrook/iamrunning.ai`.

## What lives here

- **Roadmaps** — `ROADMAP_17_EXTENDED.md` (current; Phases 17A + 17B done, 17D + 17C pending)
- **Handoffs** — `HANDOFF.md` (generic onboarding for a new iamrunning.ai chat), `SESSION_HANDOFF_19_04_2026.md` (big sprint close)
- **Evolution** — `EVOLUTION_CONTINUED_19_04_2026.md`, `EVOLUTION_CONTINUED_20_04_2026.md` (chain-of-thought record of product development — future fine-tune training data)
- **Specs** — `MCP_AS_A_SERVICE_SPEC.md` (Phase 2 concept: iamrunning.ai as MCP provider to IAM Client OS installations), `TOOL_DISTRIBUTION_SPEC.md`

## Why this is a dedicated folder (not in `../specifications/` or `../concepts/`)

iamrunning.ai is a full product with its own repo, roadmap, and cadence. Pulling everything iamrunning.ai-related into one place avoids polluting the platform-wide spec / concept spaces and makes it easy to onboard a chat specifically for this product.

## Cross-product linkage

iamrunning.ai shares architecture patterns with IAM Client OS (MCP protocol, tool groups, role model). Platform-wide decisions in `../memory/wisdom/DECISIONS.md` apply here too. EVOLUTION records here feed the global fine-tune dataset in `../legacy_future_dataset/wisdom/` and `../legacy_future_dataset/fine-tune-ideas/`.

## Current status

Active development.
- Phase 17D (Ollama tool-calling polish, ~2–3h) next, via separate Cursor chat (not this web chat).
- Phase 17C (persistent memory via shadow hints) after 17D.
- Roadmap 18 (Fine-tune v1 via QLoRA on RTX 3050) queued after Roadmap 17 closes.
