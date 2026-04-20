# ARCHITECTURE REFACTORING PLAN — STATUS

**Дата создания:** 03.04.2026
**Последнее обновление:** 03.04.2026 (вечер)
**Полная версия:** загружена как документ в project knowledge

---

## ПРОГРЕСС

| Шаг | Описание | Статус | Коммиты |
|-----|----------|--------|---------|
| 0 | SSH prep: mkdir lib/data, mv goals.json | ✅ Done | (предыдущая сессия) |
| 1 | constants + security + file-lock + yaml + activity | ✅ Done | 5c9617c, 67f6fdc |
| 2 | goals.ts + tasks.ts + messages.ts | ✅ Done | 4695c80 |
| 3 | pull-pool.ts + team.ts + index.ts | ✅ Done | e210a0a |
| 4 | Миграция MCP tools (6 файлов) | ✅ Done | 8234bc2–64a4443 |
| 5 | Миграция Dashboard handlers (6 файлов) | ✅ Done | 44b9087 |
| 6 | Миграция Admin handlers (2 файла) | ✅ Done | b214437 |
| 7 | Cleanup: admin/shared + mcp/shared → thin wrappers | ✅ Done | a996c55, ce730f9 |
| 8 | Security: deploy-requires-snapshot + ARCHITECTURE.md | ✅ Done | 89cc417, 94f79ed |
| 8b | Zod on admin/dashboard handlers | ⏳ Gradual | (deferred — issue #11) |
| 9 | Extensions foundation | ⬜ Next | — |

## РЕЗУЛЬТАТ

- **~430 строк** дублированного кода удалено
- **10 модулей** в lib/data/ — единый источник правды
- **14 файлов** мигрированы на import from '@/lib/data'
- **admin/shared.ts** и **mcp/shared.ts** — тонкие обёртки
- **deploy-requires-snapshot** — все 4 entry points защищены
- **ARCHITECTURE.md** обновлён с новой структурой

## СЛЕДУЮЩИЙ ШАГ — 9: Extensions Foundation

1. `mkdir extensions/_template`
2. Создать manifest.json schema
3. Создать `project-stats` extension как proof of concept
4. Добавить `extensions-list` handler в admin GET handlers
5. Dynamic tab loading в admin/page.tsx

---

*Обновлено: 03.04.2026*
