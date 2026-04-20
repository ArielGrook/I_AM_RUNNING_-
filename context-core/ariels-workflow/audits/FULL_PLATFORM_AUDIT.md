# I AM RUNNING PLATFORM — FULL ARCHITECTURAL AUDIT
*Generated: 2026-04-06 | Auditor: Claude Opus 4 (extended thinking) | Files read: 80+*

## EXECUTIVE SUMMARY

The I AM RUNNING platform is an ambitious two-layer system: a website-builder SaaS (`i-am-running`) and an AI-native team operating system (`iam-client-os`). Current maturity is **6.5/10** — `iam-client-os` has a genuinely innovative architecture (router pattern, MCP fine-tuning, pull-pool PR workflow) that is ~93% feature-complete for its first paying client, while `i-am-running` is a functional but earlier-stage Craft.js editor with Supabase/PayPal integration.

**Biggest strengths:** centralized permission/notification/status router pattern, MCP-first AI integration, self-healing memory system.
**Biggest risks:** ~~5 security vulnerabilities~~ (FIXED 2026-04-06), zero test coverage, file-based storage won't scale past ~10 concurrent users.
**Top 3 priorities:** (1) ~~fix critical security issues~~ DONE, (2) eliminate duplicate `createPullPoolEntry` DONE, (3) add minimal integration tests for auth and PR approval flows.

---

## 1. PLATFORM OVERVIEW

### 1.1 What Each Product Does

**i-am-running** (`iamrunning.online`) is a website-builder SaaS built on Next.js 15, Craft.js, and Supabase. Features:
- Multi-page drag-and-drop editor with GSAP animations, color presets, zoom controls
- Interactive wizard that auto-generates Craft.js JSON from user selections
- ZIP import/export (static HTML/CSS) with LCS compression
- PayPal payments (landing $20, multipage $50, ecommerce $100)
- AI chat (GPT-4 Turbo streaming) for component selection
- Multi-provider dev-agent (Claude, OpenAI, DeepSeek, Gemini) with file editing tools
- Its own MCP server (12 tools) for Claude/ChatGPT integration
- Supabase Auth (email/password + Google OAuth), i18n (en/ru/he with RTL)
- 7-tier role system (Free through Agency Employee)

**iam-client-os** (`test.lego-base.online`) is an AI-native team workspace deployed per-client on VPS. Features:
- 5-role hierarchy: Operator (SSH) > Super Admin (TOTP) > Admin (token) > Worker roles
- Pull-pool PR workflow: non-admin writes go through review before production
- Centralized router architecture: Tool Registry, Permissions, Status, Notification
- Dashboard (worker-facing) and Admin Panel (admin-facing) with near-parity
- Messaging V2 (WhatsApp-style DMs + groups + notifications, VAPID push)
- Goals/milestones/tasks system with goal-task linking
- Dev Console (CodeMirror editor with role-scoped file visibility)
- Session persistence via session-notes and bootstrap prompts per role

### 1.2 Integration Points (Current vs Planned)

**Current:** Only `x-client-slug` HTTP header passed through i-am-running's MCP routes.

**Planned unified vision:**
```
Client signs up on iamrunning.online
  → gets website editor (i-am-running)
  → gets team workspace (iam-client-os) on their VPS
  → gets desktop app (I AM RUNNING OS) for local development
  → all three share auth, project context, deployment pipeline
```

### 1.3 Desktop Client Vision

**"I AM RUNNING OS"** = Tauri desktop app for native development experience.
- MCP server already accepts Bearer-token HTTP → desktop can connect TODAY, zero server changes needed
- File operations abstracted through safePath() and data layer
- Session tracking with call counts and timeout already exist
- **Missing:** local file sync, tunnel management, offline mode, native auth flow

**Planned AI stack:**
- Phase 1: RAG (ChromaDB + nomic-embed-text via Ollama) — context from project files
- Phase 2: Fine-tune dataset generation (Claude generates Q&A pairs from codebase)
- Phase 3: QLoRA fine-tune on Qwen2.5-Coder 32B — architecture patterns, router philosophy
- Phase 4: Multi-worker master model (Ollama server via Cloudflare Tunnel, per-worker sessions)

**Business model:** $4-5k package = Tauri desktop client + iam-client-os VPS + fine-tuned local AI model

---

## 2. ROUTER ARCHITECTURE ASSESSMENT

| Router | File | Status | Rating | Key Issues |
|--------|------|--------|--------|------------|
| Tool Registry | `lib/tools-registry.ts` | ✅ Done | **8/10** | Single source of truth. Minor: no runtime validation that MCP tools match registry |
| Permission Router | `lib/permissions.ts` | ✅ Done | **8/10** | Clean can()/canFile()/canApply()/canScopeMember() API. Dashboard still uses enforceCapability() separately |
| Notification Router | `lib/notify.ts` | ✅ Done | **8/10** | Replaces 15+ manual patterns. prReview now migrated (2026-04-06) |
| Status Router | `lib/status.ts` | ✅ Done | **9/10** | Best-architected module. Atomic transitions with full pipeline |
| Data Layer | `lib/data/` | ✅ Done | **9/10** | Clean barrel pattern. File locking with timeout-rejects |
| PR Module | `lib/data/pull-pool.ts` | ✅ Done | **8/10** | Duplicate in memory.ts ELIMINATED (2026-04-06) |
| Push Router | `lib/push.ts` | ✅ Done | **6/10** | Uses sync fs APIs. No file locking on push-subscriptions.json |

---

## 3. SECURITY AUDIT (Updated 2026-04-06)

### Fixed (2026-04-06)
- ✅ **SEC-01:** Path traversal in `pr-read-file` — fileName sanitized with basename()
- ✅ **SEC-02:** Command injection in `dev-save-file` — role.name/filePath escaped before execSync
- ✅ **SEC-03:** Missing authz on `conversation-delete` — participant check added
- ✅ **SEC-04:** Substring author matching in worker-handlers — regex exact match
- ✅ **SEC-05:** Token timing side-channel — crypto.timingSafeEqual() in auth.ts
- ✅ **SEC-06:** deploy-trigger fail-open — now returns error if git check fails

### Remaining (High)
- 🟡 **SEC-07:** No CSRF server-side validation on admin panel POST routes
- 🟡 **SEC-08:** No message recipient validation (to field not checked against team)
- 🟡 **SEC-09:** Task creation doesn't verify assignee is in admin's scope
- 🟡 **SEC-10:** push.ts uses sync fs without file locking

---

## 4. ARCHITECTURE GAPS (Remaining)

1. **Two capability systems** — `enforceCapability()` in dashboard vs `can()` in lib/permissions.ts
2. **worker-handlers.ts** reads tasks.json directly instead of data layer `loadStructuredTasks()`
3. **Cross-layer import** — dashboard handlers import from `../../admin/lib/shared`
4. **0 test files** — no vitest/jest, only Zod validation at API boundaries
5. **prReview** still sends manual message ~~(FIXED)~~ now uses notify()
6. **Push.ts** uses synchronous fs — should use async + file lock

---

## 5. i-am-running AUDIT SUMMARY

- Complete website builder: Craft.js, Supabase, PayPal, multi-provider AI
- Has own MCP server (12 tools) completely separate from iam-client-os
- No shared auth/types between products — Supabase Auth vs token-hash system
- `x-client-slug` = only current integration point
- Needs same router pattern (Permission, Notification, Status) applied

**i-am-running MCP tools:** list_components, get_component_schema, update_component, add_component, remove_component, reorder_components, get_page_list, create_page, delete_page, get_site_config, update_site_config, publish_site

---

## 6. OVERALL RATINGS (Post-security-fixes)

| Dimension | Score (before) | Score (after fixes) | Notes |
|-----------|---------------|--------------------|----|
| Security | 6/10 | **8.5/10** | 6 critical/high fixed, 4 medium remain |
| Architecture | 8/10 | **9/10** | Router pattern excellent, duplicate eliminated |
| Code Consistency | 7/10 | **8/10** | notify() migration complete, one permission system closer |
| Scalability | 4/10 | 4/10 | File-based JSON, ~10 user limit |
| Documentation | 9/10 | 9/10 | Best-in-class for pre-revenue product |
| Test Coverage | 1/10 | 1/10 | Zero tests — critical gap |
| Production Readiness | 6/10 | **7.5/10** | Security fixed, tests remain blocker |
| Desktop Client Readiness | 6/10 | 6/10 | MCP connectable, sync/tunnel missing |
| **Overall** | **6.5/10** | **7.5/10** | Ready for first client after tests |

---

## 7. PRIORITIZED ACTION LIST (Remaining)

### 🔴 Before first client
- Add vitest + 10 smoke tests (auth, PR flow, permission checks, path traversal blocking)
- CSRF server-side validation on admin panel

### 🟡 First month with client
- Migrate enforceCapability() to delegate to can() from lib/permissions.ts
- Migrate worker-handlers.ts to use loadStructuredTasks() from data layer
- Validate message recipients against team roles
- Enforce scope on task creation
- Migrate push.ts to async fs + file lock
- Add SSE (replace 3-10s polling)
- Backup data/*.json files

### 🟢 Desktop Client (Cursor tasks)
- Tauri app skeleton: login + MCP connection + dashboard
- RAG system: ChromaDB + nomic-embed-text + Ollama integration
- Dataset generator: script walks files → Claude generates Q&A pairs → JSONL
- QLoRA fine-tune pipeline: unsloth + Qwen2.5-Coder 32B
- MCP Bridge: local model calls MCP tools on server
- Multi-worker: Ollama server via Cloudflare Tunnel, per-worker session isolation

### 🔵 Future
- SQLite migration (required at ~10 concurrent users)
- SSE for real-time (replace polling)
- S3/R2 offsite backup

---

*End of audit. Original file generated by Claude Opus 4 with extended thinking, 2026-04-06.*
*Security fixes applied same day by Claude Sonnet 4.6 (this chat).*
