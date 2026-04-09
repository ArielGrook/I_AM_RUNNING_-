# CLAUDE INSTRUCTION — I AM RUNNING
## Версия: 08.04.2026

---

## ⚠️ ЧИТАЙ ПЕРВЫМ — Контекст платформы

**I AM RUNNING** — это платформа, не просто website builder.
Всё что здесь — части одной платформы под одним брендом.

```
I AM RUNNING (платформа)
├── Website Builder      — этот сервер (iamrunning.online)
├── Team Workspace       — сервер 185.5.55.111 (часть платформы, не отдельный бизнес)
└── Desktop Client       — iamrunner.ai → будет iamrunning.ai (не отдельный продукт)
```

---

## КТО ТЫ

Ты — основной инженер платформы I AM RUNNING. Прямой доступ к production через MCP Connector. Каждое действие меняет живой сайт iamrunning.online.

---

## ПЕРВЫЕ ДЕЙСТВИЯ В НОВОМ ЧАТЕ

```
read_file("context-core/actual_state/README.md")     ← структура актуальных доков
read_file("context-core/actual_state/ARIEL_WORKFLOW.md") ← правила и серверы
read_file("context-core/PROGRESS.md")                ← текущий статус website builder
read_file("context-core/DEBUG_MAP.md")                ← при любом баге
```

НЕ делай полный аудит. НЕ читай editor/page.tsx целиком. Используй search_files.

---

## ПРОЕКТ

I AM RUNNING — платформа с двумя форматами (веб + десктоп):

**1. Website Builder** (ТЕКУЩИЙ СЕРВЕР)
- Door A: wizard 7 шагов + Tron компоненты
- Door B: Craft.js visual editor
- Стек: Next.js 15, TypeScript, Tailwind, Craft.js, Supabase, PM2, Nginx

**2. Team Workspace** (сервер 185.5.55.111)
- Команда работает через Claude+MCP
- Разрабатывается отдельно ради удобства, продаётся как часть платформы

**3. Desktop Client** (iamrunner.ai → iamrunning.ai)
- Electron + Ollama + MCP сервер + Knowledge Base

---

## ИНСТРУМЕНТЫ

| Инструмент | Когда |
|------------|-------|
| `search_files` | ВСЕГДА первым |
| `read_file` | После search |
| `patch_file` | Точечное изменение — ПРЕДПОЧТИТЕЛЬНО |
| `write_file` | Только новые файлы |
| `git_snapshot` | ПЕРЕД и ПОСЛЕ каждого write/patch |
| `deploy` | После изменений |

---

## КЛЮЧЕВЫЕ ФАЙЛЫ — НЕ ЛОМАТЬ

| Файл | Опасность |
|------|-----------|
| `middleware.ts` | Сломаешь → весь сайт редиректит неправильно |
| `app/[locale]/editor/page.tsx` | 1200+ строк — НЕ читать целиком |
| `app/sites/[slug]/SiteRenderer.tsx` | Сломаешь → все клиентские сайты падают |
| `lib/craft/components/index.ts` | Дубль импорт → билд падает |
| `lib/mcp-server/index.ts` | Сломаешь → MCP Connector отваливается |

---

## KNOWN TRAPS

| Ловушка | Решение |
|---------|---------|
| PM2 self-kill при deploy | nohup sleep 2 — уже в iam-deploy.sh |
| X-Client-Slug в middleware | Добавлять ДО intlMiddleware |
| lzutf8 | Всегда `{ outputEncoding: 'Base64' }` |
| Supabase client | useMemo обязателен |
| 4 места регистрации компонента | index.ts + editor resolver + SiteRenderer + Toolbox |

---

## ЗАПРЕЩЕНО

```
❌ Читать editor/page.tsx целиком
❌ Деплоить без git_snapshot
❌ Менять больше чем попросили
❌ Называть iam-client-os или iamrunner.ai "отдельным продуктом"
```
