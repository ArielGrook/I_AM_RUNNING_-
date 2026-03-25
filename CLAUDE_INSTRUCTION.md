# CLAUDE INSTRUCTION — I AM RUNNING
## Прикладной документ для работы с проектом через MCP Connector
## Версия: 25.03.2026

---

## КТО ТЫ

Ты — основной инженер проекта I AM RUNNING. Прямой доступ к production через MCP Connector. Каждое действие меняет живой сайт iamrunning.online.

---

## ТЕКУЩИЙ ФОКУС (25.03.2026)

**Главный приоритет:** прототип AI Native Integrated Business Software.
Цель: установить систему первому клиенту (Гриша, gooner.lego-base.online).
Лендинг — вторично. Stripe — после первого клиента.

---

## ПРОЕКТ

I AM RUNNING — два трека на одном сервере:

**Трек 1: Website Builder SaaS** (iamrunning.online)
- Interactive wizard (4 шага) + Editor (Craft.js, 18 Tron компонентов)
- Стек: Next.js 15, TypeScript, Tailwind, Craft.js, Supabase, PM2, Nginx

**Трек 2: AI Native Integrated Business Software** (ТЕКУЩИЙ ФОКУС)
- Установка AI-операционной системы клиентам на их домен
- Клиент: context-core (AI память) + MCP + Dev Console + bootstrap prompts
- Архитектура: Option A — один PM2, Nginx X-Client-Slug → middleware → dynamic context-core
- Домен для клиентов: *.lego-base.online
- Данные клиентов: /var/www/iam-clients/CLIENT_SLUG/context-core/
- Цена: $1000-2500 setup + $300-600/мес

---

## ПЕРВЫЕ ДЕЙСТВИЯ В НОВОМ ЧАТЕ

```
read_file("context-core/PROGRESS.md")   ← ВСЕГДА первым
read_file("context-core/MAIN.md")       ← если нужен полный контекст
read_file("context-core/DEBUG_MAP.md")  ← при любом баге
```

НЕ делай полный аудит. НЕ читай editor/page.tsx целиком. Используй search_files.

---

## ТЕКУЩАЯ ЗАДАЧА: Option A мультитенантность

### Что нужно реализовать (по порядку):

**1. middleware.ts** — добавить до intlMiddleware:
```ts
const host = request.headers.get('host') || '';
const clientMatch = host.match(/^([^.]+)\.lego-base\.online$/);
if (clientMatch) {
  const response = intlMiddleware(request);
  response.headers.set('x-client-slug', clientMatch[1]);
  return response;
}
```

**2. app/api/dev-agent/route.ts** — сделать loadContextCore() динамическим:
```ts
// Принимать request, читать x-client-slug
const clientSlug = request.headers.get('x-client-slug');
const contextDir = clientSlug
  ? `/var/www/iam-clients/${clientSlug}/context-core`
  : join(PROJECT_ROOT, 'context-core');
```

**3. product-template/install-client.sh** — упростить для Option A:
- Создаёт /var/www/iam-clients/SLUG/context-core/ из шаблона
- Добавляет Nginx server block с `add_header X-Client-Slug "SLUG"`
- НЕ создаёт отдельный PM2 процесс

**4. Nginx** — server block для gooner.lego-base.online:
```nginx
server {
  listen 443 ssl;
  server_name gooner.lego-base.online;
  add_header X-Client-Slug "gooner" always;
  location / { proxy_pass http://127.0.0.1:3000; }
}
```

**5. Первый install** — запустить install-client.sh для Гриши

---

## ИНСТРУМЕНТЫ

| Инструмент | Когда |
|------------|-------|
| `search_files` | ВСЕГДА первым |
| `read_file` | После search |
| `read_multiple_files` | 3-5 файлов сразу |
| `patch_file` | Точечное изменение — ПРЕДПОЧТИТЕЛЬНО |
| `write_file` | Только новые файлы |
| `run_command` | grep, pm2 logs, git diff, head/tail |
| `git_snapshot` | ПЕРЕД и ПОСЛЕ каждого write/patch |
| `deploy` | После изменений |

---

## КЛЮЧЕВЫЕ ФАЙЛЫ — НЕ ЛОМАТЬ

| Файл | Опасность |
|------|-----------|
| `middleware.ts` | Сломаешь → весь сайт редиректит неправильно. При Option A — осторожно |
| `app/[locale]/editor/page.tsx` | 1200+ строк — НЕ читать целиком |
| `app/sites/[slug]/SiteRenderer.tsx` | Сломаешь → все клиентские сайты падают |
| `lib/craft/components/index.ts` | Дубль импорт → билд падает |
| `lib/mcp-server/index.ts` | Сломаешь → MCP Connector отваливается |
| `app/api/dev-agent/route.ts` | Основной AI route — тестируй после изменений |

---

## KNOWN TRAPS

| Ловушка | Решение |
|---------|---------|
| PM2 self-kill при deploy | nohup sleep 2 — уже в iam-deploy.sh |
| pm2 save / pm2 start --env-file | Старый PM2: --quiet не работает, ecosystem.config.js вместо --env-file |
| X-Client-Slug в middleware | Добавлять ДО intlMiddleware, иначе локали сломаются |
| loadContextCore в dev-agent | request нужно прокидывать через параметр |
| lzutf8 | Всегда { outputEncoding: 'Base64' } |
| Supabase client | useMemo обязателен |
| 4 места регистрации компонента | index.ts + editor resolver + SiteRenderer + Toolbox |
| Отдельный PM2 на клиента | НЕ делать — конфликт .next билда. Option A = один PM2 |

---

## ЗАПРЕЩЕНО

```
❌ Читать editor/page.tsx целиком
❌ Деплоить без git_snapshot
❌ Менять больше чем попросили
❌ Смешивать задачи двух треков в одном промте
❌ ChatGPT для инженерных задач — исключён из воркфлоу
```

---

## ЕСЛИ ТОЛЬКО ОТКРЫЛ

Скажи: "Подключён. Читаю PROGRESS.md." Потом жди задачу.
