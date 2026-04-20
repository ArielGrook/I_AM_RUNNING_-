# IMPLEMENTATION RULES — IAM CLIENT OS
## Железные правила разработки. Нарушение = баг.

**Дата:** 02.04.2026  
**Автор:** Ariel (Operator)  
**Статус:** ACTIVE — применяется ко ВСЕМ сессиям разработки

---

## RULE 1: Backend ↔ Frontend — Намертво

> **Каждая бэкенд-функция, которая отвечает за workflow, ОБЯЗАНА иметь привязанный фронтенд элемент. Без поблажек.**

Если backend API принимает action `deploy-trigger` с capability `deploy`:
- ✅ Фронтенд ОБЯЗАН показывать кнопку Deploy ТОЛЬКО если `can(ctx, 'deploy') === true`
- ✅ Фронтенд ОБЯЗАН скрывать кнопку если capability отсутствует
- ❌ ЗАПРЕЩЕНО показывать кнопку всем и надеяться что бэкенд отклонит

Это работает в ОБЕ стороны:
- Если добавляешь бэкенд action → создай фронтенд элемент
- Если добавляешь фронтенд кнопку → убедись что бэкенд action и capability gate существуют

**Как проверить:** 
1. Открой `capability-gate.ts` → список actions
2. Каждый action должен иметь соответствующий UI элемент в компонентах
3. Каждый UI элемент должен проверять capability через `permissions.ts`

---

## RULE 2: Capability Gating — Единый модуль

> **ВСЕ проверки capabilities и tools на фронтенде — ТОЛЬКО через `app/dashboard/lib/permissions.ts`.**

- ❌ ЗАПРЕЩЕНО: `data.capabilities.includes('deploy')` внутри компонента
- ❌ ЗАПРЕЩЕНО: `const hasCap = (c) => data.capabilities.includes(c)` — локальный хелпер
- ✅ ОБЯЗАТЕЛЬНО: `can(ctx, 'deploy')` из `permissions.ts`
- ✅ ОБЯЗАТЕЛЬНО: `hasTool(ctx, 'write_file')` из `permissions.ts`

**Почему:** Одна точка, где можно увидеть ВСЕ проверки. Одна точка для super_admin bypass. Одна точка для будущих tier-based ограничений.

---

## RULE 3: Иерархия видимости UI

> **Если у пользователя НЕТ capability или tool — он НЕ ДОЛЖЕН ВИДЕТЬ связанный UI элемент. Вообще.**

Уровни:
1. **Tab level** — Team tab скрыт если нет ни одной team capability
2. **Sub-tab level** — Members скрыт если нет manage_team
3. **Action level** — кнопка Deploy скрыта если нет deploy capability
4. **Element level** — tool в editor серый + not-allowed если админ сам не имеет этот tool

Не "disabled". Не "greyed out with tooltip". **СКРЫТ** для целых секций, **grey-out** для элементов внутри видимых секций (например tools в editor).

---

## RULE 4: Аудит перед правкой (техническое)

> **ВСЕГДА читай файл через read_file перед patch_file/write_file. НЕ ПАТЧИТЬ ПО ПАМЯТИ.**

- 3 подряд ошибки в одном файле = стоп, перечитай целиком
- Файлы >500 строк → ТОЛЬКО write_file с полным содержимым
- НЕ chain multiple patch_file на одном файле в одной сессии

---

## RULE 5: Один коммит = одна задача

> **git_snapshot после каждого завершённого изменения. Не накапливать.**

- Deploy после каждой логической группы
- Формат: `[YYYY-MM-DD HH:MM] {role}: {description}`

---

## RULE 6: Типизация без обходов

> **Новые поля → добавлять в interface. НИКОГДА не кастить через `Record<string, unknown>`.**

- ❌ `(data as Record<string, unknown>).isSuperAdmin`
- ✅ Добавить `isSuperAdmin: boolean` в `DashboardData` interface

Каждый каст = потенциальный build failure в следующей итерации.

---

## RULE 7: При рефакторинге — ТОЛЬКО cut & paste

> **При разбивке или перемещении кода — НЕ рефакторить логику одновременно.**

Рефакторинг структуры и рефакторинг логики = ДВЕ РАЗНЫЕ ЗАДАЧИ, ДВА РАЗНЫХ КОММИТА.

---

## RULE 8: Один MCP connector per chat

> **Подключай ТОЛЬКО lego-base. НЕ подключай "i am running" одновременно.**

---

## RULE 9: Frontend-Backend Parity Check

> **Перед каждым deploy — ментальный чек:**

1. Все actions в `ACTION_CAPABILITIES` имеют UI элемент?
2. Все UI кнопки с actions проверяют capability через `permissions.ts`?
3. `DashboardData` interface содержит все поля что backend отправляет?
4. Super Admin видит всё? Worker видит только своё?

---

## RULE 10: Operator Layer — Невидимый

> **Operator (Ariel, SSH) — НЕВИДИМ для всех уровней системы.**

- Super Admin = оператор админов, видим в UI, максимальные capabilities
- Operator = невидимый слой, SSH-only, ставит систему, собирает статистику
- UI НЕ ДОЛЖЕН отображать Operator-level функции
- Operator actions (если будут) — отдельный API, отдельный auth, НЕ через dashboard

---

*Этот документ — обязательное чтение для каждой сессии разработки.*
*Нарушение любого правила = потенциальный баг в production.*
