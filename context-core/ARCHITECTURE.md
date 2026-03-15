# ARCHITECTURE.md — I AM RUNNING
*Карта ключевых потоков для разработчика. Обновляй при изменении архитектуры.*

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
- 1 = Free User (только чат)
- 2 = Paid User (редактор, 1 проект)
- 3 = Freelancer Basic (5 проектов)
- 4 = Freelancer Pro (unlimited)
- 5 = Admin

**Флаги:** `canAccessEditor = role >= 2`, `isFreelancer = role >= 3`, `isAdmin = role >= 5`
**Источник роли:** `user.user_metadata.role` → `buildProfileFromUser()`
**Session:** `supabase.auth.getSession()` при инициализации AuthProvider
**OAuth/Email confirm:** `app/[locale]/auth/callback/page.tsx` → `exchangeCodeForSession(code)`

**Guards (client-side, не middleware):**
- `/dashboard` → `!isAuthenticated` → `/auth/login?redirect=...`, `!canAccessEditor` → `/subscription`
- `/editor` → `!isAuthenticated` → `/auth/login` ⚠️ (исправлено ac5a25b)
- `/profile` → `!isAuthenticated` → `/auth/login` (без locale — баг)
- `/subscription` → `!isAuthenticated` → `/auth/login`

⚠️ **ВАЖНО:** Middleware НЕ защищает пути. Вся защита client-side через useAuth.

---

## 3. DASHBOARD

**Файл:** `app/[locale]/dashboard/page.tsx`
**Guard:** `isAuthenticated` + `canAccessEditor` (role >= 2)
**Загрузка проектов:** `supabase.from('projects').select(...).eq('user_id', uid).order('updated_at')`
**Создание проекта:** INSERT в projects → `router.push(/${locale}/editor?id=${data.id})`
⚠️ **БАГ:** новый проект создаётся с `data: { pages: [...] }` вместо `data: { craft: { pages: [...] } }`

---

## 4. EDITOR

**Файл:** `app/[locale]/editor/page.tsx`
**Стек:** Craft.js + LZUTF8 Base64 compression + Supabase

**Загрузка проекта:**
1. `loadProjectFromSupabase(projectId)` → `lib/store/supabase-sync.ts`
2. `pd.craft.pages` → `PageState[]` → `setPages()`
3. `lz.decompress(desktopData, Base64)` → `setFrameData(json)`
4. `<Frame key={activePageId-frameKey} data={frameData} />`

**Сохранение:**
1. `query.serialize()` (Craft.js) → JSON
2. `lz.compress(json, Base64)` → compressed
3. `saveProjectToSupabase()` → `projects.data.craft.pages[]`

**Переключение страниц:**
1. `query.serialize()` текущей страницы
2. `handlePageChange(targetId, json)`
3. `lz.decompress(targetPage.desktopData)` → `setFrameData()`
4. `key` меняется → Frame remount

**Color preset:**
- Кнопки в `components/craft/Viewport.tsx` → `applyColorPreset()`
- Диспатч `iam_color_preset_changed` → `applyColorPresetToAllPages()` в editor/page.tsx
- Dark/light: `applySchemeToTronNodes()` → диспатч `iam_color_scheme_changed`

**Регистрация компонента — 4 места:**
1. `lib/craft/components/index.ts`
2. `app/[locale]/editor/page.tsx` resolver
3. `app/sites/[slug]/SiteRenderer.tsx` resolver
4. `components/craft/Toolbox.tsx`

**Краеугольные камни (не ломать):**
- `key={activePageId-frameKey}` на Frame — remount при смене страницы
- `lz.compress/decompress` с `inputEncoding: 'Base64'` — иначе битые данные
- `useMemo` для Supabase клиента — без него render loop
- Token refresh перед каждым Supabase запросом в компонентах
- `injectSupabaseCredentials` — единственный способ передать credentials в компонент

---

## 5. DEPLOYED SITES

**Файлы:** `app/sites/[slug]/page.tsx`, `app/sites/[slug]/SiteRenderer.tsx`

**Деплой:**
1. `POST /api/projects/[id]/deploy` → slug из email, `published: true`
2. URL: `https://{slug}.iamrunning.online`

**Рендер:**
1. `supabase.from('projects').select().eq('slug', slug).eq('published', true)`
2. `project.data.craft.pages[]` → `lz.decompress(page.desktopData)`
3. `<Editor enabled={false}>` (read-only) → `<Frame data={craftJson} />`
4. `SiteContext` — `navigateToPage()`, `toggleTheme()`

**Навигация:** только через `window.dispatchEvent(new CustomEvent('iam_navigate', { detail: { page: slug } }))`
**Auth в компонентах:** `clientAuthService.ts` + localStorage `iam_client_session`

---

## 6. ADMIN PANEL

**Файл:** `app/[locale]/admin/page.tsx`
**Dev Console:** `app/[locale]/admin/dev-console/page.tsx`

⚠️ **SECURITY:** Логин через hardcoded `admin`/`super.admin`, сессия в sessionStorage.
Нет Supabase auth. Первый приоритет при pentest закрытии.

**Функции:** список пользователей, смена ролей, список проектов, SEO настройки, Dev Console

---

## 7. DEV CONSOLE — IDE

**Файл:** `app/[locale]/admin/dev-console/page.tsx`

**API Endpoints:**
- `GET /api/dev-agent/files` — файловое дерево проекта
- `GET /api/dev-agent/files/read?path=...` — чтение файла (макс 500KB, блокирует .env)
- `POST /api/dev-agent/files/write` — создание/сохранение файла (не делает git commit)
- `DELETE /api/dev-agent/files/delete` — удаление файла (папки только пустые)
- `POST /api/dev-agent/files/mkdir` — создание папки
- `GET /api/dev-agent/git-log` — последние 30 коммитов
- `POST /api/dev-agent/deploy` — деплой (git push → build → pm2 restart через nohup)
- `POST /api/dev-agent/rollback` — откат к хэшу или HEAD~1

**Функции UI:**
- Файловое дерево с контекстным меню (правый клик): New File, New Folder, Delete, Copy Path, Open in Edit
- Code viewer (CodeMirror) с подсветкой синтаксиса: .ts/.tsx/.js/.jsx/.css/.html/.json
- Edit mode — редактирование в браузере + Ctrl+S сохранение
- Reference кнопка — выделил строки → путь + строки + код вставляются в промпт
- Git History панель — список коммитов, rollback в один клик
- Resizable panels (3 колонки), ширина в localStorage
- Light/Dark тема

**Краеугольные камни (не ломать):**
- Edit mode НЕ делает git commit — только пишет файл на диск. Deploy нужен после
- Delete работает только для пустых папок — рекурсивного удаления нет намеренно
- Все endpoints используют одинаковый auth паттерн: Supabase session + DEVELOPER_USER_ID
- Path security везде: no .., no absolute paths, BLOCKED_PATTERNS
- PM2 рестартует через 2 секунды после deploy (nohup sleep 2) — сайт недоступен ~3-5 сек

---

## 8. ИЗВЕСТНЫЕ БАГИ

| Баг | Файл | Статус |
|-----|------|--------|
| Dashboard создаёт проект с неправильным data форматом | dashboard/page.tsx:86 | Открыт |
| Profile редирект без locale `/auth/login` | profile/page.tsx:15 | Открыт |
| Subscription — оплата не реализована (coming soon) | subscription/page.tsx:41 | Открыт |
| Admin hardcoded логин/пароль | admin/page.tsx:99 | Открыт ⚠️ |

---

*Последнее обновление: 15.03.2026*
