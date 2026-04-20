# Messaging System V2 — Spec + Implementation Status

**Created:** 2026-04-04
**Status:** ✅ IMPLEMENTED
**Completed:** 2026-04-04

---

## Implementation Summary

All 4 phases completed in a single session (2026-04-04):

### Phase 1 — Data Layer ✅
- Message model with `type`, `conversationId`, `text` fields
- `sendChatMessage()`, `sendGroupMessage()`, `sendNotification()`, `deleteMessage()`, `deleteConversation()`
- `data/conversations.json`, `data/user-profiles.json` — new data stores
- Auto-migration of V1 messages (topic+body → text) on load
- `dmConversationId(a, b)` = `dm:{sorted_a}:{sorted_b}`

### Phase 2 — Inbox UI ✅
- Admin: `AdminMessagesTab` — 💬 Chats / 🔔 Notifications tabs, conversation list, WhatsApp-style chat thread
- Dashboard: `DashboardMessagesTab` — dedicated Messages tab (moved out of WorkTab), same features
- 3-second polling on active chat, auto-scroll
- Mobile-first: full-height chat, 46px touch targets, 16px font

### Phase 3 — Groups + Avatars ✅
- **Groups:** Admin creates via "👥 Group" button (name + member picker chips). Purple 👥 avatar, sender names in bubbles, member count badge. Push to all participants. Workers see groups they're in but can't create.
- **Avatars:** `ProfileEditor` shared component — canvas resize 128x128 JPEG, 10 preset nickname colors. Shown in headers (admin+dashboard), conversation list, chat headers. Stored as base64 in `data/user-profiles.json`.
- **Decision:** Base64 storage is sufficient. Supabase bucket NOT needed.

### Phase 4 — Delete + Polish ✅
- **Delete message:** Tap → red highlight → 🗑 Delete button. Hard delete (physical removal from JSON). Workers delete own only, admins delete any.
- **Delete conversation:** 🗑 icon in list and header. Confirm → deletes ALL messages + conversation record.
- **Push notification sound:** `renotify: true` + `silent: false` in SW — Android Chrome now plays sound.

### NOT Implemented (by design):
- Reply-to messages — data model has `replyTo` field but no UI
- Search in conversations
- Typing indicator
- Super Admin display name editing — hardcoded "Super Admin"
- Supabase avatar bucket — base64 sufficient

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/data/messages.ts` | Data layer — all messaging operations |
| `lib/data/index.ts` | Exports: sendChatMessage, sendGroupMessage, deleteMessage, deleteConversation, etc. |
| `data/messages.json` | Message storage (V1+V2 auto-migrated) |
| `data/conversations.json` | Conversation records (DM + group) |
| `data/user-profiles.json` | Avatars + nickname colors |
| `app/admin/components/AdminMessagesTab.tsx` | Admin inbox: chats, notifications, groups, delete |
| `app/dashboard/components/DashboardMessagesTab.tsx` | Dashboard messages tab (workers) |
| `app/api/dashboard/lib/messaging-handlers.ts` | Dashboard API: conversations-list, send, delete, groups, profiles |
| `app/lib/ProfileEditor.tsx` | Shared avatar upload + color picker component |
| `public/sw.js` | Service Worker with renotify:true for sound |

## API Endpoints

**Admin (POST to /api/admin/panel):**
- `messages-send-chat` — `{ to, text }`
- `group-create` — `{ name, participants }`
- `group-send-message` — `{ groupId, text }`
- `message-delete` — `{ messageId }`
- `conversation-delete` — `{ conversationId }`
- `profile-save` — `{ name, avatar, color }`

**Admin (GET from /api/admin/panel):**
- `conversations-list`, `conversation-messages`, `profiles-list`

**Dashboard (POST to /api/dashboard):**
- Same actions, scoped to authenticated user
- `group-create` — admin only
- `message-delete` — own messages only (unless admin)
