# IMPROVEMENT PLAN — IAM CLIENT OS
## Рабочий трекер (обновлён 04.04.2026 — сессия планирования)

**Сервер:** test.lego-base.online (185.5.55.111)
**MCP:** Подключай ТОЛЬКО `lego-base` connector
**Мастер-план:** `IDEAS/MASTER_PLAN.md`

---

## ✅ ЗАВЕРШЕНО (не трогать)

### Архитектурный рефакторинг (03.04.2026)
- Data Layer: 11 модулей в `lib/data/` — единый источник правды
- ~430 строк дублированного кода удалено

### Security sprint (03-04.04.2026) — 14/14 ✅
- httpOnly cookie, Zod validation, TOTP re-issue, token rotation, rate limit, deploy gate

### Infrastructure
- ✅ Admin panel 8 табов, Dashboard 5 табов, MCP 15+ tools
- ✅ PR workflow: create → diff view → approve/reject → auto-status
- ✅ Goals: 3 уровня, comments, PR linking
- ✅ Team: roles, capabilities, scope, presets
- ✅ Extensions framework (manifest.json + project-stats PoC)
- ✅ Landing page test.lego-base.online

### Messaging System V2 (04.04.2026)
- ✅ Conversations, group chats, avatars, message/conversation deletion
- ✅ Push Notifications (95%): SW, VAPID, auto-prompt, bell button, все triggers

### Mobile Responsive (Phase 1-3)
- ✅ useIsMobile hook, всё admin panel + dashboard responsive
- ⬜ Landing page — отложено

### Баги закрытые
- ✅ 1.5 Дубликаты комментариев (PR + goal task) — fixed
- ✅ 1.7 SuperAdminName — решено оставить хардкод "Super Admin" навсегда

### Dev Console
- ✅ 2.1 Dev Console MVP — file browser + CodeMirror + базовый editor в admin panel
- ✅ 2.8 Resizable panels — уже есть в admin panel (file tree ↔ editor + bottom git)

### Worker Tools (частично)
- ✅ 3.3 create_pr — title + description реализованы. Patch mode — не реализован и не приоритет.
- ✅ 3.4 Task Request System — базовая реализация есть, нужны улучшения (см. TIER 2)

### Other
- ✅ 4.4 Admin ↔ Dashboard feature parity — есть базовая, но неудобная. Нужен редизайн (см. TIER 2)
- ✅ 7.2 run_command — частично реализован
- ✅ 7.5 Extensions / Statistics tab — работает через connector принцип

---

## 🔴 TIER 1 — ИНФРАСТРУКТУРА И ОНБОРДИНГ

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| T1.1 | **Онбординг брата + дяди** | Создать токены, подключить Claude MCP, прогнать полный цикл задача → PR → ревью | ⬜ |
| T1.2 | **TEAM_ROLES.md auto-backup** | cp при старте PM2 + восстановление при ошибке парсинга | ⬜ |
| T1.3 | **Cron backups** | Ежедневный backup memory/ + data/ в /var/backups/iam/, ротация 7 дней | ⬜ |
| T1.4 | **install.sh обновление** | data/, workers/, skills/, extensions/, lib/push.ts, public/sw.js, ecosystem | ⬜ |
| T1.5 | **BUG: Worker reply не уведомляет admin** | handlePrComment() → send message + push to admin when worker replies | ⬜ |

---

## 🟡 TIER 2 — ПРОДУКТ (следующие спринты)

### Dev Console (полная версия)
| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| D1 | **Dev Console для Dashboard** | DashboardDevConsoleTab: worker видит файлы по read_paths, Save → Submit as PR | ⬜ |
| D2 | **Каскад видимости** | Capability `dev_console`, фильтрация file tree по роли | ⬜ |
| D3 | **Code Reference System** | Выделить строки → floating toolbar → Message Admin / Copy AI Prompt / Add to PR | ⬜ |
| D4 | **Path Presets UI** | SuperAdmin задаёт presets для Admin в Team tab | ⬜ |
| D5 | **Image preview** | .png/.jpg/.webp/svg preview в file tree | ⬜ |

### MCP Fine-tune (3.5) — СЕРЬЁЗНЫЙ ИНСТРУМЕНТ
| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| M1 | **Experiment 4 complete** | Контекстные file-specific hints в my_workspace("status") (номера строк, предыдущие PR) | ⬜ |
| M2 | **Experiment 5: Error recovery** | Умные инструкции в error responses (patch_file fail → re-read → retry pattern) | ⬜ |
| M3 | **Метрики сбора** | Логировать % PR с description, update_notes usage, время до первого PR | ⬜ |
| M4 | **Onboard v2** | Ещё глубже персонализировать: текущие задачи + непрочитанные + PR статус в одном onboard | ⬜ |
| M5 | **Tool response tuning** | Систематически проверить ВСЕ MCP tool responses и добавить поведенческие подсказки | ⬜ |

### Worker Tools
| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| W1 | **my_workspace audit** | Проверить что реально работает из 8 actions. Закрыть gaps. | ⬜ |
| W2 | **Task Request System v2** | Улучшение UI: список открытых задач для воркера, better approve flow для admin | ⬜ |

### UX / Dashboard
| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| U1 | **Spec Request → прямая навигация** | Воркер просит спецификацию → admin получает кнопку "Create Specification" прямо в inbox | ⬜ |
| U2 | **Кликабельные задачи в pipeline** | Dashboard pipeline → click card → details + comments + spec inline | ⬜ |
| U3 | **Workers' Tasks в Admin Work Tab** | Секция в Work Tab: задачи каждого worker'а + last comment + Add Comment inline | ⬜ |
| U4 | **Admin ↔ Dashboard parity редизайн** | Переделать так чтобы было удобно (сейчас неудобно). Spec нужен отдельно. | ⬜ |
| U5 | **Activity log с taskRef** | Трассировка MCP вызовов по задачам | ⬜ |
| U6 | **Permissions system** | usePermissions hook + UI_CAPS map (единый источник правды для capability checks) | ⬜ |

### Роли
| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| R1 | **Reviewer роль** | Architectural guardian: approve/reject PR, documentation, аудиты | ⬜ |
| R2 | **Marketer роль** | Content editor, ТЗ → developer flow, asset upload | ⬜ |
| R3 | **Bootstrap prompts** | Для reviewer + marketer | ⬜ |
| R4 | **Work Groups** | Channels/rooms: несколько workers работают над одной фичей | ⬜ |

---

## 🟡 GTM — ЛЕНДИНГИ И ПРОДАЖИ

| # | Задача | Статус |
|---|--------|--------|
| G1 | Landing test.lego-base.online polish | ⬜ |
| G2 | Landing iamrunning.online редизайн | ⬜ |
| G3 | Upwork профиль + 3 proposal templates | ⬜ |
| G4 | Reddit + LinkedIn outreach templates | ⬜ |

---

## 🟢 TIER 3 — ЗРЕЛОСТЬ ПРОДУКТА

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| P1 | **Logs redesign** | Подтабы: Deploy / Activity / Audit Trail + фильтры по дате | ⬜ |
| P2 | **run_command завершение** | 2-уровневый whitelist (basic: ls/cat/grep, extended: npm test). Сейчас частично. | ⬜ |
| P3 | **SSE вместо polling** | Server-Sent Events для 10+ юзеров | ⬜ |
| P4 | **Rsync offsite backups** | На iamrunning.online | ⬜ |
| P5 | **More extensions** | SEO manager, CRM, custom dashboards | ⬜ |

---

## 🔵 TIER 4 — МАСШТАБИРОВАНИЕ

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| S1 | Operator Dashboard | Мониторинг клиентских VPS: uptime, disk, heartbeat | ⬜ |
| S2 | Multi-VPS install agent | One-liner curl installer | ⬜ |
| S3 | Plugin SDK | useIAM() hook + полный manifest.json стандарт | ⬜ |
| S4 | SQLite миграция | Замена JSON файлов на SQLite внутри lib/data/ | ⬜ |

---

## ПРАВИЛА РАБОТЫ

1. **read_memory** первым вызовом каждой сессии
2. **Аудит перед правкой** — read_file до patch_file
3. **git_snapshot перед deploy** (enforced)
4. **Файлы >500 строк → write_file** (не chain patch_file)
5. **Один MCP connector** — только lego-base
6. **Data операции → `import { ... } from '@/lib/data'`**
7. **Никогда window.innerWidth в JSX** — только useIsMobile()

---

*Мастер-план с промтами для воркер-чатов: IDEAS/MASTER_PLAN.md*
*Обновлено: 04.04.2026 — сессия планирования с Ariel*
