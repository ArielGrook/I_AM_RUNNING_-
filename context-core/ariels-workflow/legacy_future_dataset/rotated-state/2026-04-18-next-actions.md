# Next Actions

*This is the project-local next-actions tracker (in ariel-workflow/, the developer space).*
*See memory/NEXT_ACTIONS.md for the product-side version that ships via read_memory.*

---

## Today (18.04.2026) — Stage 2 start

### ✅ Done today (morning session — Stage 1 completion)
- First successful skeleton sync run — `ArielGrook/iam-client-skeleton` populated with 173 sanitized files
- middleware.ts removed from manifest (file doesn't exist in root, Next.js middleware is optional)
- lego-base dev commits pushed to GitHub (2ed817b..145bc73)

### ⬜ In progress — Stage 2: install.sh cleanup
Current task. Priority order (Ariel's plan):
1. **Clean install.sh** (remove step 4b, default to skeleton repo, progress indicators, --dry-run)
2. **Test install** on isolated VPS from skeleton
3. **MCP Injection V3 + persistent memory** improvements

### ⏸ Awaiting Ariel's action
- Set up test VPS for Stage 3 install test (any clean Ubuntu 24.04 VPS, 1GB+ RAM, free subdomain)

---

## Stage 2 concrete tasks (my side, ~2 hours)

### Remove from `scripts/iam-client.sh`
- Entire step 4b block (data cleanup + TEAM_ROLES rewrite + dev-path removal + memory templates)
  — skeleton is already clean. ~250 lines removed.
- `rm -f "$INSTALL_PATH/app/api/admin/totp-test-flow"` (no longer needed)
- `rm -rf "$INSTALL_PATH/DEVELOPMENT_VS_CLIENT.md"` etc.
- All `cat > "$INSTALL_PATH/memory/*.md" <<'EOF'` template writes

### Update in `scripts/iam-client.sh`
- Default `--github` → `ArielGrook/iam-client-skeleton`
- Default `--github-token` — keep required, but update help text to clarify PAT needed for private skeleton
- Progress indicators `[N/11]` in each `step "Step N: ..."` header
- Add `--dry-run` flag: validates args, prints what would be done, no side effects

### New installer logic
- Step 4b becomes Step 4b-light: just `ok "Skeleton already clean — no cleanup needed."`
- Keep data/ empty initialization as sanity check (in case skeleton breaks)

### Documentation
- Update `ariel-workflow/INSTALLER_SPEC_v1.md` to reflect skeleton-based flow
- Update client-facing `README.md` in skeleton (already written, may need adjustments after Stage 2)

---

## Stage 3: Test install

### Ariel's preparation (5 min)
- Rent any Ubuntu 24.04 VPS (Hetzner, Time4VPS, any $5/mo)
- Point a test subdomain at it (e.g., `test-install.iamrunning.online`)
- Generate install PAT (fine-grained, Contents R+W on skeleton)

### Install command
```bash
curl -fsSL https://raw.githubusercontent.com/ArielGrook/iam-client-skeleton/main/install.sh | bash -s -- \
  --domain=test-install.iamrunning.online \
  --name="Test Install" \
  --github=ArielGrook/iam-client-skeleton \
  --github-token=ghp_XXX
```

### Verification checklist
- [ ] Clone succeeded
- [ ] Dependencies installed
- [ ] nginx + Let's Encrypt worked
- [ ] PM2 started
- [ ] `https://test-install.iamrunning.online/iam.admin` → TOTP first-run visible
- [ ] TOTP setup works, produces working QR
- [ ] After TOTP: Admin Panel loads
- [ ] Settings → MCP Token generate works
- [ ] Connect Claude via MCP → `read_memory` returns clean templates
- [ ] Create Dashboard user → token works → dashboard loads
- [ ] File Delete works (both file and folder, in both Admin Panel and Dashboard)
- [ ] Push notifications work (enable bell, send message, receive push)
- [ ] Deploy button in Admin Panel works (triggers deploy-logged.sh)

---

## Stage 4: MCP Injection V3 + Persistent Memory (after successful test)

### Components (per earlier brainstorm with Ariel)
1. **Session log (append-only)** — `memory/wisdom/_session-log.jsonl`
   - Each significant tool call writes one line
   - Format: `{ts, session_id, tool, args_summary, outcome, duration_ms, notes}`
2. **Wisdom index** — `memory/wisdom/_index.json`
   - Rebuilt on crystallize
   - Maps: `by_tool`, `by_path`, `by_event` → relevant wisdom sections
3. **smartOk v3 — context-aware injection**
   - Post-execution: based on just-called tool + args, inject relevant wisdom section
   - Pre-execution (for next call): heads-up based on pattern matching
4. **`crystallize_wisdom` — new `tasks` sub-action**
   - Reads `_session-log.jsonl` → groups → distributes into 4 wisdom files
   - Triggers on `session_handoff`, can be called manually mid-session
5. **Pre-execution hint via previous smartOk**
   - When smartOk detects a pattern ("writing to app/api/"), it pre-emptively hints at next step

### Implementation plan
- Phase 4A: Build session log + index (~3 hours)
- Phase 4B: Enhance smartOk + smartErr (~3 hours)
- Phase 4C: Add crystallize_wisdom action (~2 hours)
- Phase 4D: Test on real session, iterate (~2 hours)

---

## Bug Fixes (parallel, non-blocking)

### Priority 1 — Ariel's side only
- **Build error on demo.iamrunning.online** — will auto-resolve when demo is reinstalled from skeleton

### Priority 2 — Nice to have
- Minor skills/ anonymization improvements (add to SANITIZE_PATTERNS if any residual names found in skeleton repo inspection)

---

## This Week Plan (18-25.04)

### Technical
- **Day 1 (today, 18.04):** Stage 2 install.sh cleanup + Stage 3 test install
- **Day 2-3 (19-20.04):** Stage 4 MCP Injection V3 implementation
- **Day 4-5 (21-22.04):** Polish, fix edge cases from test install
- **Day 6-7 (23-24.04):** Demo video (90 sec walkthrough for cold outreach)
- **Day 8 (25.04):** Buffer / GTM sprint

### GTM (Ariel's parallel work)
- LinkedIn DMs to Gilad Shoham + Leon Mulumud
- YouTube: 10 small AI/automation channels
- Cold email 10/day via iamrunning.online@gmail.com
- Reddit warming → post in r/mcp
- Monitor Upwork Appeal

---

## Backlog (not blocking first client)

- ChatGPT MCP connector — test `<internal>` compliance with GPT-4o
- Mobile adaptation Phase 3
- SSE instead of 3s polling
- SQLite migration (JSON files work for v1)
- Vitest smoke tests
- Operator Role + Web Installer (Stage 5+ after first paying client)
- MCP-as-a-Service (Phase 2 — iamrunning.ai as MCP provider)

---

## Recently Done (last 3 days)

### 18.04 morning
- ✅ Stage 1: skeleton sync first run successful — 173 files sanitized, 180 committed, pushed to origin/main
- ✅ middleware.ts fix in manifest
- ✅ lego-base dev → GitHub push

### 17.04 evening
- ✅ Admin Dev Console file delete bug fixed (action name mismatch + folder delete + tree refresh)
- ✅ Stage 1 infrastructure written: `scripts/sync-to-skeleton/` (MANIFEST + sync.sh + 28 overrides)
- ✅ All docs/ + source-of-truth/ + memory templates translated EN
- ✅ Wisdom English templates created (structure for future population)
- ✅ sed sanitization pass added to sync.sh
- ✅ Stage 1 handoff doc written

### 17.04 morning
- Stage 0 cleanup session (install.sh → thin wrapper, README rewritten, DEVELOPMENT_VS_CLIENT.md)
- INSTALLER_SPEC_v1 written
- Phantom hardcoded paths fixed in 5 source files (5546822, 1f7da3b)

### 16.04
- GTM launch day — Upwork, LinkedIn, MCP market research
- Upwork account SUSPENDED — Appeal pending

---

*Updated: 18.04.2026 12:25 UTC+3 — Stage 1 complete, Stage 2 next*
