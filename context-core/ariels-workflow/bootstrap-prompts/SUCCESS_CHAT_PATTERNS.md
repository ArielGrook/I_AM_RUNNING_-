# Success Chat Patterns

How to write first prompts that set chats up for success.
And: anti-patterns that poison chats from the first message.

This document is NOT a bootstrap prompt itself. It's a pattern library — reference material for writing and reviewing the bootstrap prompts in this folder, and for writing any first prompt in a new chat.

---

## TL;DR — Five rules for the first prompt

1. **Give it a mission**, not a discussion. ("You are migrating X to Y" — not "let's talk about migration.")
2. **Give it an anchor document** — one file path, not 1500 words of context.
3. **Give it a first tool call** — concrete, not "get up to speed."
4. **Give it behavioral rules** — short, explicit. ("No variants. Russian for discussion, English for code.")
5. **Give it boundaries** — what NOT to do.

Miss any of the five and the chat will drift. Sometimes slowly, sometimes from the first reply.

---

## Why the first prompt weighs more than all subsequent prompts combined

The model isn't just reading instructions when it reads the first prompt. It's deciding what _kind of conversation_ this is. That decision acts as a behavioral attractor, and every subsequent message is interpreted through it.

- "Let's brainstorm" voice → the model stays in options-generation mode the whole session.
- Bloated context dump with no priorities → the model loses track of what's load-bearing, starts pulling random facts into its answers, hallucinates confidently.
- Mission + first action + rules → the model executes. And keeps executing.

Critical: **you cannot fix a bad first prompt mid-session.** If the chat feels off by turn 2–3, open a new one. Don't try to correct course — the attractor is already set and it pulls harder than any mid-session correction you can write.

The previous chat on this migration (PLATFORM_REFACTORING.md, 2026-04-20 early session) is the textbook case: first prompt had no anchor, offered variants instead of an action, and by turn 3 the model was inventing file paths. It got abandoned. The current chat succeeded on essentially the same task because the first prompt followed the template below.

---

## The template

### 1. Mission (one sentence, present tense)

> "You are the migration engineer. Your only goal today is moving docs from lego-base to iamrunning."

The model identifies with the role you assign in the first sentence. Pick carefully. "Engineer" behaves differently from "consultant" behaves differently from "advisor."

### 2. Anchor (one file path)

> "Read first: context-core/ariels-workflow/PLATFORM_REFACTORING.md"

The anchor holds everything else: context, decisions, status, next step. **Do not dump context into the prompt body** — the model can't weight 2000 raw words of mixed information. It can weight "read this one file, in full, before doing anything else."

### 3. First action (concrete)

> "Read A, read B, call list_directory on C, then report what you see."

Vague first actions ("get familiar with the project", "learn the codebase") cascade into invented narratives. Make the first action a specific tool call, or three specific tool calls in sequence.

### 4. Rules for the agent (short bullets)

Examples that work in this stack:
- No variants or A/B/C. Direct action only.
- Russian for discussion, English for code.
- git_snapshot before every write.
- One task per turn.
- Don't estimate work in hours.
- Ask one clarifying question max; otherwise proceed with best interpretation.

These rules shape tone and pacing. They stay active through the whole session.

### 5. Boundaries (what NOT to do)

The mirror of rules. Examples:
- Do not create files outside /context-core/.
- Do not suggest tooling changes this session.
- Do not ask permission for read operations.
- Do not deploy without explicit go-ahead.

Explicit negatives are often more load-bearing than positives. The model defaults toward helpful-suggestion mode; boundaries cut that off.

---

## Anti-patterns that poison chats

**The Variant Trap.** Prompt: "What are some approaches to X?" → model spits 3 options → you pick one → model spits 3 sub-options → infinite regress. Task never finishes.
_Fix:_ "Do X. First read Y."

**The Discussion Voice.** Prompt: "Let's think about how to restructure Z." → model becomes a thinker, not an executor. Every follow-up returns "we could consider..."
_Fix:_ "Restructure Z. Start by reading current-state-of-Z.md."

**The Raw-Context Dump.** Prompt body is 1500 words of unweighted history / decisions / business context. Model can't tell what's load-bearing, starts mixing facts. Plausible-sounding but wrong statements = hallucination.
_Fix:_ Put the 1500 words in an anchor document. Prompt says "read anchor.md first."

**The Soft First Action.** Prompt: "Get familiar with the codebase and share your thoughts." → unbounded exploration → invented narratives that don't match reality.
_Fix:_ "Read files A, B, C. Report their status against this checklist."

**The Missing Role.** Prompt: "Help me migrate the server." → no identity → model defaults to generic-helpful-assistant mode, which is high on clarifying questions, low on execution.
_Fix:_ "You are the migration engineer. Today you are doing X."

**The Over-Polite Opener.** Prompt: "If it's not too much trouble, could you maybe take a look at..." → model mirrors the hesitant register and becomes apologetic + slow. Minor effect but real.
_Fix:_ Direct imperative. Politeness is for humans; the model doesn't benefit from it.

---

## Signs a chat is already poisoned

Watch the first 2–3 replies. If you see two or more of these, open a new chat:

- Model proposes variants or options when you asked for a single action.
- Model asks clarifying questions whose answers are in the context you gave it.
- Model invents file paths, tool names, or commands that don't exist.
- Reply structure is "here are three things you could do..."
- Model acknowledges the task but doesn't actually call a tool.
- Model's vocabulary shifts toward hedging ("perhaps", "you might want to consider", "depending on your preference").

Don't try to correct. The attractor pulls harder than any correction you can type. New chat, better first prompt, ~2 minutes of setup saves hours of drift.

---

## The status table pattern (multi-session work)

At the END of an anchor document, put a status table:

| Step | Status | Date | Notes |
|------|--------|------|-------|
| 1 — Do X | ✅ DONE | 2026-04-20 | — |
| 2 — Do Y | ⏳ READY | — | Next |
| 3 — Do Z | ⏳ PENDING | — | — |

Rule: after finishing a step, update the table in the same write as the actual work. Next session reads the table first to know where it stopped.

This is the single most reliable pattern for multi-session work on this stack. `PLATFORM_REFACTORING.md` survived 3 chats with full continuity because of this table. Without it, even a good first prompt loses alignment after the second handoff.

---

## Applying this to IAM Client OS bootstrap prompts

When writing onboarding prompts for Claude / ChatGPT bootstrapping into a client's IAM Client OS install, follow the same template:

1. **Role:** "You are the {admin | developer | reviewer | marketer} for {client}."
2. **Anchor:** "Read `memory/SYSTEM_IDENTITY.md` and `memory/CURRENT_GOAL.md` first."
3. **First action:** "Then call `read_memory`. Report what you see."
4. **Rules:** "No variants. One task per turn. `git_snapshot` before deploy. English for code. Mega-tool syntax only (`files`, `tasks`, `communication`, `goals`, `code_review`, `devops`)."
5. **Boundaries:** "Do not touch production without admin approval. Do not create files outside the working directory. Do not ask permission for read operations."

When next editing `bootstrap-prompts/*.md`, review them against these five points. Anything missing = drift risk. This is also the checklist to add to `claude-start.md` as a pre-session warmup for AI agents starting fresh.

---

## For Ariel's own prompts

Same template applies when Ariel writes a first prompt to a new chat about his own work (not a client install):

1. **Role** — "You are Claude Opus 4.7 in web chat, MCP connected to X."
2. **Anchor** — the single file you want read first. If none exists, write one before you open the chat.
3. **First action** — 2–4 concrete tool calls.
4. **Rules** — copy from recent successful prompts; language preference, no variants, snapshot discipline.
5. **Boundaries** — anything you've seen this model drift into before.

It takes 2–5 minutes to write this well. It saves 30–90 minutes of chat-recovery time. The ratio is not close.

---

_Added 2026-04-20 after back-to-back chats on the same migration task produced radically different quality — entirely explained by differences in first-prompt structure. This is the observation Ariel named "chats don't glitch randomly — they glitch because the first prompt was bad."_
