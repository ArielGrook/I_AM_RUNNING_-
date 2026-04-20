# PERMISSIONS SYSTEM — Frontend Specification
## Centralized Capability & Tool Gating for Dashboard UI

**Дата:** 02.04.2026  
**Статус:** SPEC — ready for implementation  
**Проблема:** Frontend capability checks разбросаны по компонентам как ad-hoc `if`-ы. Нет единого источника правды. Каждый новый UI элемент требует ручного решения "проверять или нет".

---

## 1. АУДИТ ТЕКУЩЕГО СОСТОЯНИЯ

### Backend (✅ ХОРОШО)
- `capability-gate.ts` — централизованная карта `ACTION_CAPABILITIES` (30+ действий → 7 capabilities)
- `enforceCapability()` — единая точка проверки, super_admin bypass
- КАЖДЫЙ dashboard API action проходит через этот gate

### Frontend (❌ ПРОБЛЕМА)

**page.tsx:**
- `hasCap()` определён локально: `const hasCap = (cap: string) => data?.capabilities?.includes(cap) ?? false`
- Используется ТОЛЬКО для `showTeamTab`
- НЕ передаётся в дочерние компоненты

**DashboardTeamTab.tsx:**
- Переопределяет `hasCap` заново: `const hasCap = (c: string) => data.capabilities.includes(c)`
- Использует для: sub-tabs visibility (members/prs/activity/logs), Deploy button, Assign Task section
- ❌ Tool editor НЕ grey-out для tools которых нет у админа (toggleTool блокирует, но визуально нет разницы)
- ❌ Role change dropdown доступен всем с manage_team — нет дополнительной проверки

**DashboardGoalsTab.tsx:**
- Переопределяет отдельно: `const canManage = data.capabilities.includes('manage_goals')`
- И отдельно: `const canAssign = data.capabilities.includes('assign_tasks')`
- Используется для: add/delete goal, add/delete milestone, add/delete task, status buttons, spec editor, comments, "Send to Dashboard"
- Нет `hasTool()` проверки нигде

**DashboardWorkTab.tsx:**
- НОЛЬ capability checks — это worker-only tab, проверки не нужны
- Корректно

### Проблемы:
1. `hasCap()` дублируется в 3 местах
2. Нет `hasTool()` хелпера нигде
3. Нет единого API "can this user do X?"
4. Добавление нового capability требует правки в КАЖДОМ компоненте
5. Нет единого списка "что видит роль X" — поведение размазано по JSX
6. Бэкенд может отклонить действие для которого UI показал кнопку (рассинхрон)

---

## 2. РЕШЕНИЕ: `usePermissions` hook + `UI_PERMISSIONS` map

### Файл: `app/dashboard/lib/permissions.ts`

```typescript
// ── UI Permission Definitions ─────────────────────────────────
// Единый источник правды: ЧТО ВИДИТ пользователь на dashboard.
// Если элемента нет в этой карте — он виден всем.
// Если элемент привязан к capability — он виден ТОЛЬКО при наличии capability.
// Super Admin (isSuperAdmin) → всё видно, all capabilities implicit.

export interface UserContext {
  role: string;
  name: string;
  capabilities: string[];
  tools: string[];
  isSuperAdmin: boolean;  // backend уже проставляет для role=super_admin
}

// ── Capability checks ─────────────────────────────────────────

/** Can user perform action requiring this capability? */
export function can(ctx: UserContext, capability: string): boolean {
  if (ctx.isSuperAdmin) return true;
  return ctx.capabilities.includes(capability);
}

/** Does user have this MCP tool? */
export function hasTool(ctx: UserContext, tool: string): boolean {
  if (ctx.isSuperAdmin) return true;
  return ctx.tools.includes(tool);
}

/** Is user an admin-level role (admin or super_admin)? */
export function isAdmin(ctx: UserContext): boolean {
  return ctx.role === 'admin' || ctx.role === 'super_admin';
}

// ── UI Element Visibility Map ─────────────────────────────────
// Maps UI element IDs to required capabilities.
// Components use: `can(ctx, UI_CAPS.teamTab)` or check directly.

export const UI_CAPS = {
  // Tabs
  teamTab:        'manage_team',   // OR review_prs OR assign_tasks OR view_activity OR view_logs OR deploy
  
  // Team sub-tabs
  membersSubTab:  'manage_team',
  prsSubTab:      'review_prs', 
  activitySubTab: 'view_activity',
  logsSubTab:     'view_logs',
  
  // Team actions
  addWorker:      'manage_team',
  revokeWorker:   'manage_team',
  editRole:       'manage_team',
  editTools:      'manage_team',
  assignTask:     'assign_tasks',
  deployButton:   'deploy',
  
  // PR review
  approvePr:      'review_prs',
  rejectPr:       'review_prs',
  commentPr:      'review_prs',
  reviewPrompt:   'review_prs',
  
  // Goals management
  addGoal:        'manage_goals',
  deleteGoal:     'manage_goals',
  addMilestone:   'manage_goals',
  deleteMilestone:'manage_goals',
  toggleMilestone:'manage_goals',
  assignMilestone:'manage_goals',
  addTask:        'manage_goals',
  deleteTask:     'manage_goals',
  editTaskStatus: 'manage_goals',
  editSpec:       'manage_goals',
  addComment:     'manage_goals',
  sendToDashboard:'assign_tasks',
} as const;

// ── Compound checks ───────────────────────────────────────────

/** Should Team tab be visible? (any team-related capability) */
export function showTeamTab(ctx: UserContext): boolean {
  return can(ctx, 'manage_team') 
    || can(ctx, 'review_prs') 
    || can(ctx, 'assign_tasks') 
    || can(ctx, 'view_activity') 
    || can(ctx, 'view_logs') 
    || can(ctx, 'deploy');
}

/** Can admin give this tool to a worker? (must have it themselves) */
export function canAssignTool(ctx: UserContext, tool: string): boolean {
  if (ctx.isSuperAdmin) return true;
  return ctx.tools.includes(tool);
}
```

### Использование в компонентах:

```tsx
// page.tsx — создаёт ctx один раз, передаёт всем компонентам
const ctx: UserContext = {
  role: data.role,
  name: data.name,
  capabilities: data.capabilities,
  tools: data.tools,
  isSuperAdmin: data.role === 'super_admin',
};

// Tabs
{ key: 'team', show: showTeamTab(ctx) }

// DashboardGoalsTab.tsx
{can(ctx, UI_CAPS.addGoal) && <button>+ Add Goal</button>}
{can(ctx, UI_CAPS.editSpec) && <button>✏️ Edit</button>}

// DashboardTeamTab.tsx — tool editor
<button 
  onClick={() => toggleTool(tool)}
  style={{
    opacity: canAssignTool(ctx, tool) ? 1 : 0.35,
    cursor: canAssignTool(ctx, tool) ? 'pointer' : 'not-allowed',
    pointerEvents: canAssignTool(ctx, tool) ? 'auto' : 'none',
  }}
  title={canAssignTool(ctx, tool) ? tool : "You don't have this tool"}
>
  {tool}
</button>
```

---

## 3. BACKEND ИЗМЕНЕНИЯ

### `loadDashboardData()` должен возвращать `isSuperAdmin`:

```typescript
// worker-handlers.ts → loadDashboardData
return {
  ...existing,
  isSuperAdmin: role.isSuperAdmin,  // ← добавить
};
```

Без этого фронтенд не знает что super_admin = bypass all.

---

## 4. ПЛАН ИМПЛЕМЕНТАЦИИ

### Шаг 1 (10 мин): Создать `app/dashboard/lib/permissions.ts`
- Функции `can()`, `hasTool()`, `isAdmin()`, `canAssignTool()`, `showTeamTab()`
- Константа `UI_CAPS` — полная карта

### Шаг 2 (15 мин): Обновить `page.tsx`
- Создать `ctx: UserContext` из `data`
- Передать `ctx` как prop во все 4 компонента
- Заменить локальный `hasCap` + `showTeamTab` на imports из permissions.ts

### Шаг 3 (20 мин): Обновить `DashboardTeamTab.tsx`
- Убрать локальный `hasCap`
- Все проверки → `can(ctx, ...)` 
- Tool editor → `canAssignTool(ctx, tool)` с visual grey-out (решает B1)
- Это ЕДИНСТВЕННЫЙ компонент с серьёзными capability checks

### Шаг 4 (15 мин): Обновить `DashboardGoalsTab.tsx`
- Убрать `canManage` и `canAssign`
- Все проверки → `can(ctx, UI_CAPS.xxx)`

### Шаг 5 (5 мин): Backend — добавить `isSuperAdmin` в dashboard data response

### Шаг 6 (5 мин): Обновить `dashboard-types.ts`
- Добавить `isSuperAdmin: boolean` в `DashboardData` interface

---

## 5. КРИТЕРИЙ ГОТОВНОСТИ

После имплементации:
- [ ] `hasCap()` НЕ встречается ни в одном компоненте (только в permissions.ts)
- [ ] Каждая кнопка/секция с capability-зависимым поведением использует `can(ctx, ...)`
- [ ] Tool editor визуально показывает недоступные tools (grey-out)
- [ ] Super Admin видит ВСЁ без исключений
- [ ] Worker без capabilities видит ТОЛЬКО Work tab + Goals (read-only)
- [ ] Добавление нового capability требует: 1 строку в UI_CAPS + 1 строку в ACTION_CAPABILITIES

---

## 6. ПРИНЦИП

> **Каждый UI элемент привязанный к бэкенд действию ОБЯЗАН проверять permissions через единый модуль.**
> **Никаких inline `if (data.capabilities.includes(...))` в компонентах.**
> **Если бэкенд отклонит действие — UI не должен был показать кнопку.**

---

*Этот документ передаётся второму Opus для формализации в IMPLEMENTATION_RULES.md*
