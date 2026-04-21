# Fine-Tune Ideas

Forward-looking design notes for fine-tune / RAG / model training. These aren't the training data itself — they're the *plan* for how training data is synthesized and used.

## What goes here

- **Dataset shape design** — CoT pair format, RAG chunk format, inference prompt templates
- **Experiment plans** — LoRA on RTX 3050 QLoRA (unsloth), Qwen2.5-Coder targets, training schedules
- **Model architecture choices** — base model, LoRA rank, LR, epochs, batch size
- **Evaluation plans** — how we measure if the fine-tune is better than base
- **Dataset source audits** — which folders feed which part of training (rotated-state → CoT chains, wisdom → patterns, etc.)
- **Failure notes from past runs** — what broke, what we learned, what to try differently

## Relationship to other folders

- `../../concepts/CHAIN_OF_THOUGHT_FINETUNE.md` — early concept draft. When it matures, it gets rewritten as a plan here.
- `../../iamrunning-ai/ROADMAP_17_EXTENDED.md` and successors — execution plans for specific fine-tune runs. Live plans stay in product roadmaps; fundamental architectural thinking lives here.
- `../wisdom/` — the *source material*. This folder is the *plan* for turning that source into a trained model.

## Upcoming files

- `DATASET_SHAPE_v1.md` — CoT pair format + which source folder feeds which example type
- `LORA_EXPERIMENT_PLAN_v1.md` — first fine-tune run: RTX 3050, Qwen2.5-Coder:14b, QLoRA via unsloth
- `EVALUATION_METHOD_v1.md` — what we measure to decide if the fine-tune ships

## Status

Empty scaffold as of 20.04.2026. First real file expected: distillation of Ariel + Claude fine-tune strategy conversations from April 2026 (currently scattered across concepts/, iamrunning-ai/EVOLUTION_*, handoffs/).

---

*This folder exists to keep fine-tune thinking coherent across sessions, since iteration happens over months before an actual training run.*
