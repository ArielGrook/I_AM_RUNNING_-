# ARCHITECTURE.md — I AM RUNNING
*Карта ключевых потоков для разработчика. Обновляй при изменении архитектуры.*

---

## 0. ГЛАВНАЯ МОДЕЛЬ СИСТЕМЫ

I AM RUNNING — это не просто сайт-билдер. Текущая система состоит из **трёх слоёв**, которые живут на одном серверном runtime:

1. **Website / Product Layer**
   - лендинг
   - dashboard
   - editor
   - interactive pipeline
   - deployed client sites

2. **Operational / Dev Layer**
   - admin panel
   - dev console (браузерная IDE / file manager / git / deploy / rollback)
   - dev-agent API

3. **AI Access Layer**
   - MCP server (`/api/mcp/*`)
   - MCP GPT variant (`/api/mcp-gpt/*`)
   - chat/dev-agent route (`/api/dev-agent/route.ts`)
   - context-core как долговременная память проекта

**Ключевой архитектурный вывод:** MCP и Dev Console — это **не одна и та же подсистема**. Это **два разных интерфейса** к одной и той же серверной среде.

- **Dev Console** = web UI + dev-agent endpoints для человека / дешёвого исполнителя
- **MCP** = protocol endpoint для внешней модели через Bearer token + OAuth-style setup/token flow
- **Общий фундамент** = один и тот же код проекта, один и тот же сервер, одни и те же docs / git / deploy primitives

Это критично для будущей продуктовой упаковки: переносимое ядро системы — не Dev Console UI, а **server runtime + context-core + AI access topology**.

---

## 1. LANDING

**Файл:** `app/[locale]/page.tsx`
**Auth:** нет проверки — лендинг доступен всем
**Компоненты:** HeroSection, OriginStory, TechnologySection, SpeedSection, PricingSection, ServicesSection, ShowcaseSection, Footer
**Все компоненты:** `components/landing/`
**i18n:** next-intl, локали: en/ru/he/es/fr/de/zh/ja/ko/ar/hi, prefix: always
**Middleware:** `middleware.ts` — только локали, защищённых путей нет

---

## 2. AUTH FLOW

**Файлы:** `lib/hooks/useAuth.tsx`, `lib/supabase/auth.ts`

**Роли:**
- 0 = Anonymous
- 1 = Free User (только chat, default при регистрации)
- 2 = Paid User (editor, 1 проект)
- 3 = Freelancer Basic (5 проектов)
- 4 = Freelancer Pro (unlimited)
- 5 = Admin
- 6 = Agency Owner
- 7 = Agency Employee

**Источник роли:** `auth.users.user_metadata.role`

**Session:** `supabase.auth.getSession()` при инициализации + `onAuthStateChange`

**Guard-ы:**
- `/dashboard` → `!isAuthenticated` → login redirect, `!canAccessEditor` → subscription
- `/editor` → guard пока client-side, middleware не является source of truth для ролей

**Фикс real-time role propagation:**
`USER_UPDATED` от Supabase не покрывает `admin.updateUserById()`. Актуальное решение — realtime подписка на `profiles` → `refreshSession()` → новый JWT → обновление UI без перелогина.

---

## 3. DASHBOARD

**Файл:** `app/[locale]/dashboard/page.tsx`
**Guard:** `isAuthenticated` + `canAccessEditor`
**Загрузка проектов:** Supabase `projects` по `user_id`
**Создание проекта:** INSERT → redirect в editor

**Историческая ловушка:** ранее был баг формата `data` при создании проекта. Проверять, что создаётся `data.craft.pages`, а не упрощённый legacy shape.

---

## 4. EDITOR

**Файл:** `app/[locale]/editor/page.tsx`
**Стек:** Craft.js + LZUTF8 Base64 compression + Supabase

**Загрузка проекта:**
1. загрузка проекта из Supabase
2. извлечение `project.data.craft.pages`
3. `lz.decompress(..., { inputEncoding: 'Base64' })`
4. `<Frame key={activePageId-frameKey} data={frameData} />`

**Сохранение:**
1. `query.serialize()`
2. `lz.compress(..., { outputEncoding: 'Base64' })`
3. запись в `projects.data.craft.pages[]`

**Переключение страниц:** serialize current → store compressed → decompress target → Frame remount через key

**Регистрация компонента — 4 места:**
1. `lib/craft/components/index.ts`
2. `app/[locale]/editor/page.tsx` resolver
3. `app/sites/[slug]/SiteRenderer.tsx` resolver
4. `components/craft/Toolbox.tsx`

**Краеугольные камни:**
- `key={activePageId-frameKey}` нельзя ломать
- lzutf8 только с Base64 options
- Supabase client в компонентах — через `useMemo`
- credentials в компоненты — только через `injectSupabaseCredentials.ts`

---

## 5. INTERACTIVE PIPELINE

**Файл:** `app/[locale]/interactive/page.tsx`

**Назначение:** быстрый wizard для сборки сайта из контракта без ручной работы в Craft editor.

**Текущий pipeline:**
1. business type / niche
2. style / preset
3. blocks
4. company name / финальные поля
5. assembly → preview → save

**Техническое ядро:**
- contract-driven assembly
- hidden Craft.js Editor
- `buildElementsFromContract()` / assembler
- `parseReactElement` / `addNodeTree` / `serialize()`
- preview в read-only Editor
- сохранение assembled JSON в проект

**Ключевая роль в продукте:** это не просто UX wizard, а первый пример того, как идея быстро превращается в рабочий объект через AI-friendly contract → assembly pipeline.

---

## 6. DEPLOYED SITES

**Файлы:** `app/sites/[slug]/page.tsx`, `app/sites/[slug]/SiteRenderer.tsx`

**Деплой:**
1. `POST /api/projects/[id]/deploy`
2. проект получает `slug`, `published: true`
3. сайт открывается как `https://{slug}.iamrunning.online`

**Рендер:**
1. загрузка published project по slug
2. `project.data.craft.pages[]`
3. `lz.decompress(page.desktopData)`
4. read-only Craft.js `<Editor enabled={false}>`
5. `SiteContext` для навигации и theme switching

**Навигация на deployed sites:** только через
`window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: slug } }))`

**Auth в client-site компонентах:** `lib/auth/clientAuthService.ts` + localStorage session

---

## 7. ADMIN PANEL

**Файлы:** `app/[locale]/admin/page.tsx`, `app/[locale]/admin/dev-console/page.tsx`

**Admin auth model:**
1. TOTP verification
2. сервер выставляет httpOnly cookie `admin_token`
3. admin routes проверяют cookie через `lib/admin/checkAdminAuth.ts`
4. logout очищает cookie сервер-сайд

**Назначение admin layer:**
- управление пользователями и ролями
- доступ к Dev Console
- доступ к operational tooling

**Важный исторический факт:** admin API ранее был без серверной авторизации; это закрыто хотфиксом cookie-based auth.

---

## 8. DEV CONSOLE — БРАУЗЕРНАЯ IDE / OPERATIONAL SURFACE

**UI:** `app/[locale]/admin/dev-console/page.tsx`

**Server endpoints:**
- `GET /api/dev-agent/files`
- `GET /api/dev-agent/files/read?path=...`
- `POST /api/dev-agent/files/write`
- `DELETE /api/dev-agent/files/delete`
- `POST /api/dev-agent/files/mkdir`
- `GET /api/dev-agent/git-log`
- `POST /api/dev-agent/deploy`
- `POST /api/dev-agent/rollback`
- `GET/POST /api/dev-agent/config`
- `POST /api/dev-agent/route.ts` — main AI agent endpoint with tool loop

**Auth model Dev Console / Dev Agent:**
- server-side Supabase `createClient()`
- `supabase.auth.getUser()` в каждом endpoint-е
- optional hard restriction by `DEVELOPER_USER_ID` (env or config)
- pattern подтверждён во всех dev-agent routes

**Что это значит архитектурно:**
Dev Console — это **не MCP**, а отдельная web surface к dev runtime.
Она даёт человеку/оператору:
- файловое дерево
- чтение/запись файлов
- git history
- deploy
- rollback
- config management
- prompt-based execution через dev-agent route

**Main AI route:** `app/api/dev-agent/route.ts`
- импортирует `executeTool` из `lib/dev-agent/tool-executor`
- использует цикл tool calling
- имеет `MAX_TOOL_ITERATIONS = 25`

То есть Dev Console = UI над tool-executor и dev-agent runtime, а не обязательный слой для MCP.

---

## 9. MCP SERVER — AI PROTOCOL LAYER

**HTTP routes:**
- `app/api/mcp/route.ts`
- `app/api/mcp/authorize/route.ts`
- `app/api/mcp/token/route.ts`
- `app/api/mcp/setup/route.ts`
- также существует параллельный стек `app/api/mcp-gpt/*`

**Подтверждённые связи по коду:**
- `app/api/mcp/route.ts` импортирует `createMcpServer` из `lib/mcp-server/index`
- `app/api/mcp/route.ts` содержит `checkAuth(request)`
- auth идёт через `Authorization: Bearer <token>`
- `app/api/mcp/token/route.ts` использует `loadConfig()` из `lib/dev-agent/config`
- MCP token хранится/читается через `mcpAuthToken`
- route имеет и `GET`, и `POST`
- `GET` реализован как SSE stream endpoint (требование MCP Streamable HTTP spec)
- `POST` является main MCP protocol handler

**Что это означает:**
MCP access не привязан к UI Dev Console. Он использует **свой протокольный вход**, но разделяет часть общей конфигурации с dev-agent stack (`loadConfig`, `mcpAuthToken`).

**Практический вывод для будущего product template:**
если переносить AI-native ядро в другой продукт, обязательны не Dev Console components как таковые, а:
- MCP route layer
- config/token management
- tool exposure / server runtime
- context-core docs
- auth + access policy

---

## 10. AI RUNTIME — ОБЩАЯ КАРТИНА

Текущий AI runtime проекта уже распадается на **три режима доступа**:

### A. Chat / Dev-Agent mode
- веб-интерфейс внутри проекта
- main route: `app/api/dev-agent/route.ts`
- tool loop + provider adapters + tool executor
- удобен как встроенный execution surface

### B. MCP mode
- внешний AI-клиент подключается к `/api/mcp/*`
- auth через bearer token + authorize/token/setup flow
- сервер создаётся через `createMcpServer()`
- не требует наличия Dev Console UI

### C. Human operational mode
- человек работает через Admin / Dev Console
- получает file manager / git / deploy / rollback / reference UX

**Ключевая архитектурная формула:**
`One server runtime → multiple AI/human access surfaces`

Это и есть основной кандидат на переносимое ядро будущей коммерческой системы.

---

## 11. КАНДИДАТЫ НА PRODUCT-TEMPLATE EXTRACTION

То, что уже сейчас выглядит переносимым ядром:
- `context-core/` как server-side memory and doctrine
- `app/api/mcp/*` как protocol layer
- `lib/mcp-server/*` как MCP runtime implementation
- `app/api/dev-agent/*` как operational tooling API
- `lib/dev-agent/*` как provider/config/tool execution layer
- admin/dev access control patterns
- deploy/git/file primitives

То, что является вертикалью / продуктовым модулем, а не обязательным ядром:
- landing
- website builder/editor
- interactive site assembly
- Tron component system
- deployed client sites как конкретная бизнес-вертикаль

---

## 12. ОТКРЫТЫЕ ВОПРОСЫ ДЛЯ ДОАУДИТА

Нужно отдельно дочитать и задокументировать:
- точный набор MCP tools, экспонируемых `createMcpServer()`
- как связаны `mcp` и `mcp-gpt` стеки
- где именно лежит safe tool exposure policy для MCP
- какие части `lib/dev-agent/tool-executor.ts` переиспользуются MCP runtime, а какие только Dev Console / dev-agent route
- точный auth/setup flow для внешнего подключения клиента

---

## 13. ИЗВЕСТНЫЕ БАГИ / РИСКИ

| Баг / Риск | Зона | Статус |
|-----|------|--------|
| Route protection editor остаётся в основном client-side | auth / middleware | Открыт |
| Stripe / subscription automation не закрыты | payments | MVP blocker |
| Interactive mobileData generation отсутствует | interactive | Открыт |
| Anonymous → signup restore flow неполный | interactive/auth | Открыт |
| Multi-deploy specific site flow не завершён | deploy | Открыт |

---

*Последнее обновление: 22.03.2026*