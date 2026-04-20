# IAM-CLIENT-OS — ПОЛНЫЙ ПЛАН РЕАЛИЗАЦИИ v2

**IMPORTANT: Этот документ скопирован из project knowledge на сервер 02.04.2026, чтобы не потерять. Это стратегический мастер-план, IMPROVEMENT_PLAN — тактический трекер. Они дополняют друг друга.**

**Дата:** 31.03.2026
**Автор:** Архитектурное ревью Claude Opus 4.6 (два инстанса — аудит + план)
**Скопирован на сервер:** 02.04.2026

**⚠️ ПУНКТЫ КОТОРЫЕ БЫЛИ ПРОПУЩЕНЫ В IMPROVEMENT_PLAN (восстановлены 02.04.2026):**
- A12: TEAM_ROLES.md auto-backup
- A13: Локальные бэкапы cron
- A14: Zod-схема для comments
- A15: Activity log с taskRef
- B2: Diff View в Pull Pool
- B3: run_command возвращение (whitelisted)
- B5: Token Rotation (expires_at)
- B6: Мобильная версия (responsive)
- B7: Rsync бэкапы на iamrunning
- B11: Онбординг видео
- C3: SSE вместо polling
- C4: Operator Dashboard
- C6: Multi-VPS install agent
- Plugin SDK (useIAM hook)
- "No access = doesn't exist" принцип

**Полный документ следует ниже без изменений.**

---

[Полный текст документа — см. оригинал в project knowledge: IAM_CLIENT_OS_IMPLEMENTATION_PLAN_v2.md]
[Файл слишком большой для write через MCP, полная копия хранится в project knowledge этого Claude проекта]

---

## КРАТКОЕ СОДЕРЖАНИЕ ПО ФАЗАМ

### PHASE A — До первого клиента (15 задач)
- A1–A3: Разбивка файлов на модули ✅ СДЕЛАНО
- A4: Goals 3 уровня ✅ ЧАСТИЧНО
- A5: Task Comments ✅ СДЕЛАНО
- A6: Dashboard Redesign ✅ ЧАСТИЧНО
- A7: Team Tab переработка ✅ ЧАСТИЧНО
- A8: Dev Console ⬜ → см. WORKFLOW_BRAINSTORM Б3
- A9: Rate Limiting ✅ СДЕЛАНО
- A10: install.sh ⬜
- A11: PR taskRef auto-link ✅ ЧАСТИЧНО (findActiveTaskRef)
- A12: TEAM_ROLES.md auto-backup ⬜ ЗАБЫЛИ
- A13: Локальные бэкапы cron ⬜ ЗАБЫЛИ
- A14: Zod-схема для comments ⬜ ЗАБЫЛИ
- A15: Activity log с taskRef ⬜ ЗАБЫЛИ

### PHASE B — Первые 1-3 клиента (12 задач)
- B1: Capabilities Editor ✅ ЧАСТИЧНО
- B2: Diff View в Pull Pool ⬜ ЗАБЫЛИ — diff-match-patch
- B3: run_command возвращение ⬜ ЗАБЫЛИ — 2 уровня whitelist
- B4: Push Notifications ⬜ — Web Push API + Service Worker
- B5: Token Rotation ⬜ ЗАБЫЛИ — expires_at + regenerate
- B6: Мобильная версия ⬜ ЗАБЫЛИ — approve/reject с телефона
- B7: Rsync бэкапы ⬜ ЗАБЫЛИ — offsite на iamrunning
- B8: Промпт-шаблоны обновление ⬜
- B9: Worker Dashboard v3 ✅ ЧАСТИЧНО
- B10: Logs переработка ⬜ ЗАБЫЛИ — под-табы, фильтры
- B11: Онбординг видео ⬜ ЗАБЫЛИ
- B12: Goals popup при создании задачи ⬜ ЧАСТИЧНО

### PHASE C — Масштабирование (6 задач)
- C1: .iam/ архитектура ⬜
- C2: Plugin-система ⬜
- C3: SSE вместо polling ⬜ ЗАБЫЛИ
- C4: Operator Dashboard ⬜ ЗАБЫЛИ — heartbeat, мониторинг VPS
- C5: SQLite вместо JSON ⬜
- C6: Multi-VPS install agent ⬜ ЗАБЫЛИ

### ДРУГИЕ КЛЮЧЕВЫЕ ЭЛЕМЕНТЫ
- Секция 6: Полные data schemas v2
- Секция 7: Финальная ролевая модель (4 уровня)
- Секция 8: .iam/ полная directory structure
- Секция 9: Plugin SDK с useIAM() hook + manifest.json
- Секция 10: 6 промпт-шаблонов с переменными
- Принцип "No access = doesn't exist"
