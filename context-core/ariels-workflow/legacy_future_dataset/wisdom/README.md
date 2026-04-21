# Wisdom — Platform-wide

Cross-product platform-level patterns, anti-patterns, decisions, and session insights. This is the **global wisdom** — what applies across iamrunning.online (website builder + platform), IAM Client OS (team workspace), and iamrunning.ai (desktop client).

## Distinction from other wisdom

- `../../memory/wisdom/` — IAM Client OS specific (product-side, ships to clients).
- `../../iamrunning-ai/EVOLUTION_*.md` — iamrunning.ai specific learning records.
- **Here** — what applies across products, or what's fundamental to the way the platform works regardless of which product.

## Files (to be populated)

- `PATTERNS.md` — Cross-product patterns that work
- `ANTI_PATTERNS.md` — Cross-product failure modes
- `DECISIONS.md` — Platform-level architectural decisions (not product-specific)
- `SESSION_INSIGHTS.md` — Platform-level session learnings
- `FINE_TUNE_DATA_SHAPE.md` — How raw wisdom is shaped into training pairs (reference, not the pairs themselves)

## How content arrives

Two flows:

1. **Distilled from product wisdom** — when a pattern proves out in IAM Client OS AND iamrunning.ai, it's promoted here with a note on where it was observed.
2. **Platform-first** — patterns/decisions that span products by nature (e.g., "all memory updates happen in-process, not at session end").

## Why separate from product wisdom

Product wisdom changes with the product — it's living. Platform wisdom is more stable — it's about the way the platform itself works, not any one product. Mixing them blurs both.

## Relationship to fine-tune

Platform wisdom is the **base training signal**. A fine-tuned model trained on this folder understands the platform's philosophy and rules. Product-specific content layers on top (as RAG or product-specific LoRA adapters).

See `../fine-tune-ideas/README.md` for the training strategy.

---

*Status: empty scaffold as of 20.04.2026. Will accumulate as cross-product patterns emerge and existing product wisdom is distilled.*
