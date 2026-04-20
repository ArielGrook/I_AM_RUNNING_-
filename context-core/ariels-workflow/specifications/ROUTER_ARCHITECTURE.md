# ROUTER ARCHITECTURE — IAM CLIENT OS
## Паттерн глобальных роутеров с permission filter

**Создан:** 06.04.2026
**Статус:** DESIGN — реализовывать итерационно

---

## ПАТТЕРН: EVENT ROUTER С PERMISSION FILTER

```
Producer (любой пользователь/роль)
    ↓
Router (единая точка входа для типа события)
    ├── Validation (данные корректны?)
    ├── Permission Filter (кто должен получить?)
    ├── Distribution (рассылка нужным получателям)
    └── State Update (обновление всех связанных состояний)
```

**Ключевые свойства роутера:**
- **Единственная точка входа** — producer не знает кто получатель
- **Permission-aware** — роутер сам знает кто должен видеть событие
- **Транзакционный** — все side effects (notify + state update) происходят атомарно
- **Аудируемый** — все события логируются через роутер

---

## ТЕКУЩИЕ РОУТЕРЫ (уже реализованы)

### 1. Data Layer Router — `lib/data/index.ts`
**Принцип:** Все операции с данными идут через один API.
```typescript
import { loadGoals, saveGoals, sendMessage, loadTeamRoles } from '@/lib/data';
// НИКОГДА напрямую: readFile(join(DATA_DIR, 'goals.json'))
```
**Что объединяет:** goals, tasks, messages, conversations, pull-pool, team roles, profiles, push subscriptions, file locks

**Статус:** ✅ Реализован и работает

---

### 2. PR Router — `lib/data/pull-pool.ts → loadPrsForRole()`
**Принцип:** PR виден нужным ролям с permission filter.
```typescript
const { mine, toReview, team, resolved } = await loadPrsForRole(role);
// mine → PRs созданные этим пользователем
// toReview → PRs которые должен ревьюить этот пользователь (review_prs capability)
// team → PRs от команды (admin)
```
**Что делает роутер:**
- Producer: worker создаёт PR → `createPullPoolEntry()`
- Filter: по роли определяет кто видит PR
- Distribution: UI показывает нужные PR нужным ролям

**Статус:** ✅ Backend реализован. UI не все компоненты используют `loadPrsForRole`.

**Gap:** UI компоненты (AdminPullPoolTab, DashboardPullPoolTab) всё ещё делают собственный filtering вместо использования роутера.

---

### 3. Push Router — `lib/push.ts`
**Принцип:** Все push уведомления идут через одну функцию.
```typescript
await sendPushToUser(userName, { title, body, data });
// или
await sendPushToAll({ title, body });
```
**Статус:** ✅ Реализован

**Gap:** Не все handlers используют push router — некоторые вызывают `pushNewMessages` напрямую вместо `sendPushToUser`.

---

### 4. MCP Auth Router — `app/api/mcp/lib/auth.ts → resolveRole()`
**Принцип:** Token → Role → Tools → Capabilities → Permissions.
```
Bearer token
    → resolveRole()
    → { name, role, tools, capabilities, read_paths, write_paths, isSuperAdmin }
    → все MCP handlers получают ResolvedRole
```
**Статус:** ✅ Реализован

**Gap:** `ALL_ADMIN_TOOLS` hardcoded в auth.ts — нужно импортировать из Tools Registry.

---

## РОУТЕРЫ КОТОРЫХ НЕТ (нужно создать)

### 5. Tool Registry — `lib/tools-registry.ts` 🔴 HIGH
**Проблема:** Добавление нового tool = обновить 6 файлов.

```
Сейчас:
  auth.ts ALL_ADMIN_TOOLS
  + team.ts ROLE_PRESETS
  + admin/types.ts ALL_TOOLS + ROLE_PRESETS + TOOL_CATEGORIES
  + DashboardTeamTab ALL_TOOLS + TOOL_CATEGORIES
  + post-handlers.ts team-tools-edit whitelist
  + capability-gate.ts capability → tool mappings
  = 6 мест для обновления при добавлении ОДНОГО tool
```

**Решение — один файл:**
```typescript
// lib/tools-registry.ts
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  read_file: {
    category: 'File Operations',
    icon: '📁',
    defaultRoles: ['all'],          // все роли получают по умолчанию
    requiresCapability: null,
  },
  deploy: {
    category: 'Admin Tools',
    icon: '🛠',
    defaultRoles: ['admin', 'super_admin'],
    requiresCapability: 'deploy',   // capability gate
  },
  reviewer_approve_pr: {
    category: 'Reviewer Tools',
    icon: '👁',
    defaultRoles: ['reviewer'],
    requiresCapability: 'review_prs',
  },
  manage_goals: {
    category: 'Data & Tasks',
    icon: '📊',
    defaultRoles: ['admin', 'super_admin', 'reviewer'],
    requiresCapability: 'manage_goals',
  },
  dev_console_read: {               // НОВЫЙ — для Dev Console
    category: 'Dev Console',
    icon: '💻',
    defaultRoles: ['developer', 'reviewer'],
    requiresCapability: 'dev_console',
  },
};

// Деривированные константы — импортируются везде
export const ALL_TOOLS = Object.keys(TOOL_REGISTRY);

export const TOOL_CATEGORIES = deriveCategories(TOOL_REGISTRY);
// → [{ label: 'File Operations', icon: '📁', tools: ['read_file', ...] }]

export const ROLE_PRESETS = deriveRolePresets(TOOL_REGISTRY);
// → { developer: ['read_file', 'write_file', ...], reviewer: [...] }

export const CAPABILITY_TOOL_MAP = deriveCapabilityMap(TOOL_REGISTRY);
// → { 'deploy': ['deploy', 'git_snapshot', 'git_log'], ... }
```

**После рефактора:** Добавить новый tool = добавить 1 запись в TOOL_REGISTRY. Всё остальное деривируется автоматически.

---

### 6. Notification Router — `lib/notify.ts` 🔴 HIGH
**Проблема:** 4 строки дублируются в 15+ местах codebase.

```typescript
// Это повторяется ВЕЗДЕ:
const msgs = await loadMessages();
const newMsg = { id: 'msg-' + Date.now(), topic: '✅ PR approved: ' + prId, body: '...', from: role.name, to: author, goalRef: null, created: new Date().toISOString() };
msgs.push(newMsg);
await saveMessages(msgs);
pushNewMessages([newMsg]);
```

**Решение:**
```typescript
// lib/notify.ts
type NotificationEvent =
  | 'pr_approved'
  | 'pr_rejected'
  | 'pr_changes_requested'
  | 'pr_reviewer_approved'
  | 'pr_created'          // NEW — notify reviewers
  | 'task_assigned'
  | 'task_done'
  | 'task_changes_requested'
  | 'reviewer_task_done'  // NEW — troy task done after final approve
  | 'group_member_added'
  | 'custom';             // fallback для разных сообщений

interface NotifyPayload {
  to: string | string[];   // получатель(и)
  from: string;
  prId?: string;
  prTitle?: string;
  taskTitle?: string;
  taskId?: string;
  reason?: string;
  extra?: string;
}

export async function notify(event: NotificationEvent, payload: NotifyPayload): Promise<void> {
  const msgs: StructuredMessage[] = [];
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  for (const recipient of recipients) {
    const { topic, body } = buildMessage(event, payload, recipient);
    msgs.push({
      id: 'msg-' + Date.now() + Math.random(),
      topic,
      body,
      from: payload.from,
      to: recipient,
      goalRef: null,
      created: new Date().toISOString(),
    });
  }

  const allMsgs = await loadMessages();
  for (const m of msgs) allMsgs.push(m);
  await saveMessages(allMsgs);
  pushNewMessages(msgs);
}

// Все тексты уведомлений — в одном месте
function buildMessage(event: NotificationEvent, payload: NotifyPayload, recipient: string) {
  switch (event) {
    case 'pr_approved':
      return {
        topic: `✅ PR approved: ${payload.prId}`,
        body: `Your PR "${payload.prTitle}" has been approved and applied by ${payload.from}.`,
      };
    case 'pr_rejected':
      return {
        topic: `❌ PR rejected: ${payload.prId}`,
        body: `Your PR "${payload.prTitle}" was rejected by ${payload.from}.\n\nReason: ${payload.reason || '(no reason given)'}`,
      };
    case 'pr_created':
      return {
        topic: `📋 New PR for review: ${payload.prTitle}`,
        body: `${payload.from} submitted PR "${payload.prTitle}" (${payload.prId}). Check Pull Pool.`,
      };
    case 'task_assigned':
      return {
        topic: `📋 New task: ${payload.taskTitle}`,
        body: `${payload.from} assigned you a new task: "${payload.taskTitle}"`,
      };
    // ... остальные события
  }
}
```

**После рефактора:** Добавить новый тип уведомления = добавить 1 case в switch. Все тексты в одном месте — легко переводить, легко менять тон.

---

### 7. Status Router — `lib/status.ts` 🟡 MED
**Проблема:** Смена статуса PR/task требует обновления 4+ сущностей одновременно, это дублируется в handler'ах.

```
При PR approved сейчас происходит (размазано по коду):
  meta.md status → "approved"
  tasks.json task_ref → "done"
  goals.json linked task → "done"
  notify(author, ✅)
  pushNewMessages([msg])
  notify(reviewer, ✅) если reviewer_approved
  reviewer task → "done"
  git commit
  [optional] deploy
```

**Решение:**
```typescript
// lib/status.ts
export async function applyPrTransition(
  prId: string,
  transition: 'approve' | 'reject' | 'reviewer_approve' | 'request_changes',
  context: { by: string; reason?: string; andDeploy?: boolean }
): Promise<void> {
  // 1. Load PR meta
  // 2. Validate transition is allowed from current status
  // 3. Update meta.md status
  // 4. Update linked task_ref status in tasks.json
  // 5. Sync to goals.json
  // 6. Add comment to PR comments.json
  // 7. Notify all relevant parties via notify()
  // 8. Git commit
  // 9. Deploy if requested
  // 10. Log activity
}
```

**После рефактора:** pr-handlers.ts и post-handlers.ts вызывают одну функцию вместо 40+ строк каждый.

---

### 8. Permission Router — `lib/permissions.ts` 🟢 LOW
**Проблема:** Права проверяются в разных местах по-разному.

```typescript
// Сейчас в разных файлах:
if (role.isSuperAdmin) return true;            // scope-helpers.ts
if (!role.capabilities.includes('deploy'))...  // capability-gate.ts
if (!matchesGlob(path, role.write_paths))...   // pr-handlers.ts
if (role.role !== 'admin') return error(...)   // messaging-handlers.ts
```

**Решение:**
```typescript
// lib/permissions.ts
export function can(role: ResolvedRole, action: PermissionAction): boolean {
  // Центральная таблица разрешений
}

type PermissionAction =
  | 'pr:approve'
  | 'pr:reject'
  | 'pr:review'
  | 'team:manage'
  | 'goals:manage'
  | 'deploy'
  | 'file:read:path'
  | 'file:write:path'
  | 'group:manage'
  | 'dev_console:access'
  | 'dev_console:write';
```

---

## ПОРЯДОК РЕАЛИЗАЦИИ

```
1. Tool Registry (lib/tools-registry.ts)     ← разблокирует Dev Console
   ~2 часа: создать файл + обновить импорты везде

2. Notification Router (lib/notify.ts)       ← убирает дублирование
   ~3 часа: создать + заменить 15+ мест в handlers

3. Status Router (lib/status.ts)             ← самый сложный рефактор
   ~4 часа: pr-handlers + post-handlers → один вызов

4. Permission Router (lib/permissions.ts)    ← последний, низкий приоритет
   ~2 часа: централизовать проверки прав
```

**Важно:** Каждый роутер делается отдельно, с деплоем и проверкой. Не делать всё сразу.

---

## ПРИНЦИПЫ КОТОРЫЕ РАБОТАЮТ В ЭТОМ ПРОЕКТЕ

Из успешных паттернов:
1. **Один вход** — producer не знает о деталях distribution
2. **Permission at router level** — не в каждом endpoint
3. **Все side effects внутри роутера** — notify + state update атомарно
4. **Деривация вместо дублирования** — TOOL_CATEGORIES деривируется из TOOL_REGISTRY, не пишется вручную
5. **Audit через роутер** — все события логируются в одном месте

---

## ГДЕ ЭТОТ ПАТТЕРН НЕ НУЖЕН

Некоторые вещи не нужно объединять:
- UI компоненты — они специфичны для каждой роли по дизайну
- Bootstrap prompts — разные для каждой роли намеренно
- Read-only handlers — `getHandlers` в admin — это просто CRUD, не роутер

---

*Создан: 06.04.2026*
*Следующий шаг: реализация Tool Registry (lib/tools-registry.ts)*
