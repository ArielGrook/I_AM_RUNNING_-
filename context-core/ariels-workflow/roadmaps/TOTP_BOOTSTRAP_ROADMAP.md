# TOTP First-Run + Bootstrap Prompts Fix — Roadmap for Sonnet

## Context

IAM Client OS is an AI-native team workspace. When a new client installs via `iam-client.sh`, they visit `/admin` (the admin panel). Currently the admin page shows a TOTP input field — but on a fresh install, TOTP has never been set up. The admin can't log in because there's no QR code to scan. This is the #1 blocker for first client.

## Task 1: TOTP First-Run Flow

### What exists (DO NOT rewrite — extend):
- `app/api/admin/totp-setup/route.ts` — generates QR code, BUT requires auth
- `app/api/admin/verify-totp/route.ts` — TOTP login with rate limiting (works fine, don't touch)
- `lib/admin/totp-secret.ts` — secret management with pending/activate flow (works fine, don't touch)
- `app/admin/page.tsx` — admin panel with TOTP input UI (needs first-run detection added)

### What to build:

#### 1a. New endpoint: `POST /api/admin/totp-check`

Create `app/api/admin/totp-check/route.ts`:

```typescript
// No auth required — this is called BEFORE login
// Returns: { configured: boolean }
// Logic: call getTotpSecret() — if null → { configured: false }
// If non-null → { configured: true }
```

This endpoint must NOT require authentication. It only returns a boolean — no secret data.

#### 1b. New endpoint: `GET /api/admin/totp-first-setup`

Create `app/api/admin/totp-first-setup/route.ts`:

```typescript
// No auth required — BUT only works when TOTP is NOT configured yet
// 1. Call getTotpSecret()
// 2. If secret already exists → return 403 "TOTP already configured"
// 3. If no secret → generate new secret using authenticator.generateSecret()
// 4. Save as pending: setPendingTotpSecret(newSecret)
// 5. Generate otpauth URI and QR URL
// 6. Return: { qrUrl, secret, label }
```

Security: This endpoint is safe because:
- It only works when NO TOTP is configured (fresh install)
- Once first admin sets up TOTP, this endpoint returns 403 forever
- The secret is saved as "pending" — only activated after code verification

#### 1c. New endpoint: `POST /api/admin/totp-first-verify`

Create `app/api/admin/totp-first-verify/route.ts`:

```typescript
// No auth required — BUT only works when TOTP is pending (first-run)
// 1. Get pending secret via getPendingTotpSecret()
// 2. If no pending → return 403
// 3. Verify the code against pending secret
// 4. If valid → activatePendingTotp() + setAdminSessionCookie
// 5. Return { success: true }
// 6. If invalid → return error with remaining attempts
```

Include rate limiting (same pattern as verify-totp: 5 attempts, 15 min lockout).

#### 1d. Modify `app/admin/page.tsx` — add first-run detection

In the existing admin page, BEFORE showing the TOTP login form:

1. Add state: `const [firstRun, setFirstRun] = useState<boolean | null>(null)`
2. Add state: `const [setupData, setSetupData] = useState<{qrUrl:string,secret:string}|null>(null)`
3. On mount: call `POST /api/admin/totp-check`
   - If `{ configured: false }` → setFirstRun(true), then call `GET /api/admin/totp-first-setup` → setSetupData
   - If `{ configured: true }` → setFirstRun(false), show normal TOTP login
4. If firstRun === null → show loading spinner
5. If firstRun === true → show FIRST RUN UI:
   - "Welcome to IAM Client OS"
   - "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)"
   - QR code image from setupData.qrUrl
   - Manual entry: show secret string
   - Code input field (same style as existing TOTP input)
   - "Activate" button → POST /api/admin/totp-first-verify
   - On success → setAuthed(true), continue to admin panel
6. If firstRun === false → show existing TOTP login form (current behavior, unchanged)

Style the first-run UI to match the existing admin page aesthetic (use same O color constant for orange accent).

#### 1e. Test page: `/admin/test-first-run`

Create `app/admin/test-first-run/page.tsx`:

This is a standalone page that simulates first-run. It:
1. Calls `GET /api/admin/totp-first-setup` (which only works if no TOTP configured)
2. If TOTP is already configured, shows: "TOTP is already set up. To test first-run, temporarily rename data/settings.json and restart."
3. Otherwise shows the same QR + code UI as the first-run flow

This page is for development/testing only. Include a comment at the top saying so.

## Task 2: Fix Bootstrap Prompts — Old Tool References

All 5 files in `bootstrap-prompts/` reference tools that no longer exist after the mega-tools refactoring.

### Files to fix:
1. `bootstrap-prompts/developer.md`
2. `bootstrap-prompts/reviewer.md`
3. `bootstrap-prompts/admin.md`
4. `bootstrap-prompts/claude-start.md`
5. `bootstrap-prompts/marketer.md`

### What to change in ALL files:

**Replace old tool names with current mega-tool syntax:**

| Old (doesn't exist) | New (current) |
|---------------------|---------------|
| `update_session_notes` | `tasks action session_handoff` |
| `my_workspace("status")` | `communication action workspace` |
| `my_workspace("my_prs")` | `communication action workspace` |
| `my_workspace("take_task")` | `communication action workspace` |
| `my_workspace("ask_admin", ...)` | `communication action send_message to="Admin" text="..."` |
| `my_workspace("message", ...)` | `communication action send_message to="Name" text="..."` |
| `my_workspace("update_notes")` | `tasks action session_handoff` |
| `my_workspace("how_to")` | `communication action workspace` |
| `onboard` | `communication action onboard` |
| `read_file(path)` | `files action read path="..."` |
| `write_file(path, content)` | `files action write path="..." content="..."` |
| `patch_file(path, old, new)` | `files action patch path="..." old_text="..." new_text="..."` |
| `create_pr(...)` | `code_review action create_pr ...` |
| `list_directory(path)` | `files action list path="..."` |
| `search_files(query)` | `files action search query="..."` |
| `list_goals` | `goals action list` |
| `send_message(to, topic, body)` | `communication action send_message to="..." text="..."` |
| `add_comment(...)` | `goals action add_comment ...` |
| `git_snapshot(msg)` | `devops action git_snapshot message="..."` |

**Also update the tool tables** in each file to show the current mega-tool format.

**Also remove the line** about `my_workspace("update_notes")` at end of session — replace with `tasks action session_handoff`.

Read each file first, then patch. Don't rewrite from scratch — preserve the existing structure and just fix the tool references.

## Task 3: Push all changes to GitHub

After all tasks:
1. git_snapshot
2. Tell user to deploy via SSH: `cd /var/www/iam-os && npm run build && pm2 restart iam-os`

## Implementation Order

1. Task 1a: totp-check endpoint
2. Task 1b: totp-first-setup endpoint
3. Task 1c: totp-first-verify endpoint
4. Task 1d: Modify admin page.tsx
5. Task 1e: Test page
6. git_snapshot → tell user to deploy
7. Task 2: Fix all 5 bootstrap-prompts files
8. git_snapshot → tell user to deploy

## Rules
- Read each file before modifying — never patch from memory
- Keep existing code intact — only ADD first-run flow, don't rewrite working code
- TypeScript must compile — no type errors
- Style must match existing admin panel theme (use existing color constants)
- All text in English
- git_snapshot after each logical task group
