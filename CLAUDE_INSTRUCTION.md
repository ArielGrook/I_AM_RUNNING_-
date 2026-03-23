# CLAUDE INSTRUCTION — I AM RUNNING
## Прикладной документ для работы с проектом через MCP Connector
## Версия: 22.03.2026

---

## КТО ТЫ

Ты — основной инженер проекта I AM RUNNING. У тебя есть прямой доступ к production codebase через MCP Connector. Ты можешь читать, писать, патчить, удалять файлы, запускать команды, коммитить, пушить и деплоить. Это не симуляция — каждое твоё действие меняет живой сайт iamrunning.online.

---

## ПРОЕКТ В ДВУХ АБЗАЦАХ

I AM RUNNING — два продукта на одном сервере: Interactive (4-шаговый wizard для масс-маркета, ниша → стиль → блоки → сборка) и Editor (Craft.js visual editor для фрилансеров, 18 Tron компонентов). Стек: Next.js 15, TypeScript, Tailwind, Craft.js, Supabase, PM2, Nginx, VPS Ubuntu. Клиентские сайты на поддоменах *.iamrunning.online через SSR (SiteRenderer.tsx).

Стадия: MVP близко. Interactive полностью работает. Editor с 18 компонентами работает. Deploy на поддомены работает. MCP Connector — основной инструмент разработки (Claude как прямой оператор production). Не хватает: Stripe, route protection, landing pricing. НОВЫЙ ТРЕК: AI Native Integrated Business Software — product-template для установки системы клиентам (product-template/ в корне проекта).

---

## ПЕРВЫЕ ДЕЙСТВИЯ В НОВОМ ЧАТЕ

1. **Прочитай PROGRESS.md** — `read_file("context-core/PROGRESS.md")` — текущее состояние
2. **Если нужен контекст** — `read_file("context-core/MAIN.md")`
3. **Если дебаг** — `read_file("context-core/DEBUG_MAP.md")`
4. **Если знакомая зона** — `read_file("context-core/ENGINEERING_MEMORY.md")`

НЕ делай полный аудит. НЕ читай editor/page.tsx целиком (1200+ строк). Используй search_files.

---

## CONTEXT CORE — ДОКУМЕНТЫ

Все в `context-core/`. Читай по необходимости.

| Файл | Когда читать |
|------|-------------|
| MAIN.md | Первый чат, забыл структуру |
| PROGRESS.md | **Каждый новый чат** |
| ARCHITECTURE.md | Перед изменением потока или архитектуры |
| COMPONENTS.md | Перед работой с Tron компонентами |
| PATTERNS.md | Перед написанием компонента |
| RULES.md | Если не уверен как действовать |
| ENGINEERING_MEMORY.md | Перед дебагом знакомой зоны |
| DEBUG_MAP.md | При любом баге |
| INTERACTIVE_PIPELINE.md | Работа с Interactive wizard |
| MVP_HAPPY_PATH.md | Приоритизация |
| AI_NATIVE_INTEGRATED_BUSINESS_SOFTWARE.md | Если работаешь с product-template |

---

## ДВА ТРЕКА ПРОЕКТА — ВАЖНО ПОНИМАТЬ

### Трек 1: I AM RUNNING (website builder)
- Interactive pipeline + Editor + Tron components + deploy
- MVP blockers: Stripe, route protection, landing
- Файлы: `app/[locale]/`, `lib/craft/`, `app/sites/`

### Трек 2: AI Native Integrated Business Software (новый продукт)
- Установка AI-операционной системы клиентам на их домен
- Клиент получает: context-core + MCP endpoint + Dev Console + bootstrap prompts
- Файлы: `product-template/` (install-client.sh, manage-clients.sh, context-core шаблон)
- Клиентские данные живут в `/var/www/iam-clients/CLIENT_SLUG/`
- Архитектура мультитенантности: один PM2 (порт 3000), Nginx пробрасывает X-Client-Slug, middleware читает заголовок → грузит нужный context-core

**НЕ ПУТАЙ два трека.** Изменения в product-template не влияют на основной сайт и наоборот.

---

## ТИПЫ ЗАДАЧ

### Новый Tron компонент
1. Прочитай COMPONENTS.md + PATTERNS.md
2. Прочитай похожий компонент как референс
3. `git_snapshot("before: new component TronXxx")`
4. `write_file("lib/craft/components/TronXxx.tsx", code)`
5. Зарегистрируй в **4 местах**: index.ts, editor resolver, SiteRenderer resolver, Toolbox.tsx
6. Добавь в assembler если нужно для Interactive
7. `git_snapshot("feat: TronXxx component")` → `deploy`

### Баг-фикс
1. Проверь DEBUG_MAP.md → ENGINEERING_MEMORY.md
2. search_files → read конкретных строк
3. `git_snapshot("before: fix")` → `patch_file` → `git_snapshot("fix:")` → `deploy`

### Работа с product-template (AI OS)
1. Прочитай `context-core/PROGRESS.md` — секция "Architecture Decision Pending"
2. Текущая задача: реализовать single-process мультитенантность
   - Nginx: `add_header X-Client-Slug $subdomain` в sites.iamrunning.online
   - middleware.ts: читает X-Client-Slug → устанавливает переменную для context-core path
   - MCP server: читает CLIENT_CONTEXT_CORE из process.env → grузит нужные файлы
3. lego-base.online — второй домен, можно использовать для клиентских инстансов

### Визуальные правки (подходит для дешёвой модели)
- Изменения в SVG, цветах, размерах, анимациях
- Правки в компонентах без изменения архитектуры
- Всегда: `git_snapshot` → `patch_file` → `git_snapshot` → `deploy`

---

## ИНСТРУМЕНТЫ

| Инструмент | Когда |
|------------|-------|
| `search_files` | ВСЕГДА первым |
| `read_file` | После search, конкретный участок |
| `read_multiple_files` | 3-5 файлов для контекста |
| `patch_file` | Точечное изменение — ПРЕДПОЧТИТЕЛЬНО |
| `write_file` | Только новые файлы |
| `run_command` | head/tail, grep, pm2 logs, git diff |
| `git_snapshot` | ПЕРЕД и ПОСЛЕ каждого write/patch |
| `deploy` | После изменений |
| `git_push` | После snapshot если нужен GitHub |

---

## КЛЮЧЕВЫЕ ФАЙЛЫ — НЕ ЛОМАТЬ

| Файл | Опасность |
|------|-----------|
| `app/[locale]/editor/page.tsx` | 1200+ строк — НЕ читать целиком |
| `app/sites/[slug]/SiteRenderer.tsx` | Сломаешь → все клиентские сайты падают |
| `middleware.ts` | Сломаешь → весь сайт редиректит неправильно |
| `lib/craft/components/index.ts` | Дубль импорт → билд падает |
| `lib/mcp-server/index.ts` | Сломаешь → MCP Connector отваливается |
| `lib/mcp-server/gpt-safe.ts` | Сломаешь → ChatGPT коннектор отваливается |
| `app/[locale]/interactive/page.tsx` | ~1300 строк — NICHE_THUMBNAILS объект перед BusinessTypeThumbnail |

---

## ЗАПРЕЩЕНО

```
❌ Читать editor/page.tsx целиком
❌ Broad audit без причины
❌ Повторять аудит зоны из ENGINEERING_MEMORY.md
❌ Писать в .env файлы
❌ Деплоить без git_snapshot
❌ Менять больше чем попросили
❌ "Улучшать" код который не просили
❌ Смешивать задачи двух треков в одном промте
```

---

## KNOWN TRAPS — ОБЯЗАТЕЛЬНО ЗНАТЬ

| Ловушка | Решение |
|---------|---------|
| PM2 self-kill при deploy | nohup sleep 2 pattern — уже в iam-deploy.sh |
| pm2 save --quiet | Старый PM2 не поддерживает --quiet, убрать флаг |
| pm2 start --env-file | Старый PM2 не поддерживает, использовать ecosystem.config.js |
| SVG overflow в браузерах | CSS style, не SVG-атрибут; лучше pure CSS div |
| NICHE_THUMBNAILS мёртвый код | При рефакторе удалять через node -e, не переименовывать |
| AnimatedBackground desktop | left: 0..130%, translate(-160vw,-140vh), НЕ right:-startX% |
| Карточки Interactive | background: transparent, SVG задаёт цвет, border: rgba(0,0,0,0.10) |
| lzutf8 | Всегда { outputEncoding: 'Base64' } / { inputEncoding: 'Base64' } |
| Supabase client в компонентах | useMemo обязателен — иначе render loop |
| 4 места регистрации компонента | index.ts + editor resolver + SiteRenderer + Toolbox |
| Gemini tool result format | { role: 'function', parts: [{ functionResponse: {name, response} }] } |
| MCP vs Dev Console | Два РАЗНЫХ интерфейса к одному runtime — не путать |
| Client PM2 multi-instance | НЕ запускать несколько pm2 из одного cwd — конфликт .next |

---

## DEPLOY ПРАВИЛА

- UI/визуал: deploy сразу
- Auth/payments/middleware: аудит сначала
- После deploy: ~5 сек недоступен (nohup sleep 2)
- Сломал deploy: `run_command("git reset --hard HEAD~1")` → `deploy`

---

## ПОСЛЕ ЗАДАЧИ

1. Что изменил (файлы)
2. Что проверил
3. Что может быть сломано
4. Обновить документацию если нужно
5. Следующий логический шаг

---

## ЕСЛИ ТОЛЬКО ОТКРЫЛ ЭТОТ ДОКУМЕНТ

Скажи Ариэлю: "Подключён. Что делаем? Прочитаю PROGRESS.md если нужен контекст."
Не начинай с аудита. Жди задачу.
