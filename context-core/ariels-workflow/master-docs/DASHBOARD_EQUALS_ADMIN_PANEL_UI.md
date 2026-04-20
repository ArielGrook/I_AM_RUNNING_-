# ПРИНЦИП: Dashboard = Admin Panel = Единый Workflow

**КРОВЬЮ НАПИСАНО. НЕ НАРУШАТЬ.**

## Правило #1: Нет разрывов между ролями

Если действие существует у Super Admin → оно ДОЛЖНО существовать у Admin (через Dashboard) → и связанная часть у Worker/Reviewer.

**Цепочка:**
- Super Admin создаёт PR review workflow в Admin Panel
- Admin ДОЛЖЕН видеть ТОТ ЖЕ UI в Dashboard Pull Pool
- Reviewer ДОЛЖЕН видеть ТОТ ЖЕ UI но со своими ограничениями (approve → reviewer_approved)
- Worker видит задачу + получает уведомления

**НЕ ДОПУСКАЕТСЯ:**
- Реализовать функцию в Admin Panel но не в Dashboard
- Сделать упрощённую версию когда полная уже работает
- Добавить backend handler без UI
- Добавить UI без backend handler

## Правило #2: Если есть готовый UI — используй его

Если AdminPullPoolTab работает хорошо → DashboardPullPoolTab КОПИРУЕТ его 1:1.
Не "вдохновляется", не "упрощает" — КОПИРУЕТ.

Адаптации допускаются ТОЛЬКО для:
- Dark/light theme (T объект вместо хардкод цветов)
- Role-specific поведение (reviewer vs admin кнопки)
- API вызовы (dashApi вместо apiPost)

## Правило #3: Review task ≠ обычный task

"Review PR: ..." таск:
- НЕ показывает "Start Working" + text prompt
- ПЕРЕВОДИТ пользователя в Pull Pool таб
- Открывает PR в полном review UI (diff, comments, approve/reject)

"Create plan", "Update doc" — обычные таски с "Start Working" промтом.

## Правило #4: Нет дубликатов

assign-reviewer НЕ создаёт новый task если review task для этого PR+reviewer уже существует.

## Правило #5: Reviewer видит только своё

- Reviewer видит: Work, Goals, Messages, Pull Pool
- Reviewer НЕ видит: Team tab (у него нет manage_team)
- В Pull Pool: reviewer field показывает ТОЛЬКО его имя (не dropdown)
- В Pull Pool: кнопка "Approve (Review)" вместо "Approve & Apply"
