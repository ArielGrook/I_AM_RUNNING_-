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
- 1 = Free User (только chat, default при регистрации)
- 2 = Paid User (editor, 1 проект) — **недостижим через admin panel, нет кнопки**
- 3 = Freelancer Basic (5 проектов)
- 4 = Freelancer Pro (unlimited)
- 5 = Admin

**Источник роли:** `user.user_metadata.role` — хранится в Supabase Auth токене, без запроса к БД. `buildProfileFromUser()` читает `user.user_metadata.role` при каждом auth event.

**Флаги в useAuth:** `canAccessEditor = role >= 2`, `isFreelancer = role >= 3`, `isAdmin = role >= 5`

**Session:** `supabase.auth.getSession()` при инициализации + `onAuthStateChange` слушает SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT

**Guards (client-side, НЕ middleware):**
- `/dashboard` → `!isAuthenticated` → `/auth/login?redirect=...`, `!canAccessEditor` → `/subscription`
- `/editor` → guard только client-side ⚠️ (middleware не проверяет роли)

  // Role system:
  // 0 = Anonymous (not logged in)
  // 1 = Free User (chat only, default при регистрации)
  // 2 = Paid User ($20 one-time) - editor, 1 project
  // 3 = Freelancer Basic ($30/mo) - 5 projects
  // 4 = Freelancer Pro ($100/mo) - unlimited
  // 5 = Admin
  // 6 = Agency Owner - manages team, unlimited projects
  // 7 = Agency Employee - works under owner (agency_id в user_metadata)

**Новые поля в user_metadata (добавлены 21.03.2026):**
- `agency_id` — для role 7: ID Agency Owner-а
- `trial_expires_at` — ISO date, зарезервировано для Stripe trial

**Фикс "нужно перелогиниться" (добавлен 21.03.2026):**
`onAuthStateChange` теперь слушает `USER_UPDATED` event — когда admin меняет роль через Admin API, Supabase генерирует это событие, `buildProfileFromUser()` сразу перечитывает новый `user_metadata`. Перелогин больше не нужен.

**Admin panel role buttons (обновлено 21.03.2026):**
Free | Paid | Basic | Pro | Admin | Agency | Employee
Текущая роль подсвечена с галочкой ✓. Все кнопки на мобиле в flex-wrap.
`update-user-role` через Admin API меняет `user_metadata`, но браузерная сессия кэширует старый JWT токен до следующего TOKEN_REFRESHED (~60 мин). Решение: слушать `USER_UPDATED` event в `onAuthStateChange` и вызывать `refreshAuth()`.

**Регистрационный триггер:**
- Email signup: `role: 1` hardcode в `signUp()` → `user_metadata`
- Google OAuth: fallback в `auth/callback/page.tsx` — если `role == null` → `updateUser({ data: { role: 1 } })`
- Нет Supabase DB trigger — только client-side

**Смена роли:**
- Только через admin panel → `POST /api/admin/update-user-role`
- Меняет: `users` таблица + `profiles` таблица + `auth.users.user_metadata` через Admin API
- Stripe webhook для auto-upgrade — **не реализован**

**Маппинг admin panel → role number:**
```
regular → 1, frontend → 3, full_stack → 4, professional → 5
```
⚠️ role 2 (Paid User) недостижим через admin panel — нет кнопки "Paid"

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

**Auth flow (обновлено 21.03.2026):**
1. Юзер вводит TOTP → `POST /api/admin/verify-totp` (IP lockout: 5 попыток → 15 мин)
2. При успехе: сервер выставляет httpOnly cookie `admin_token` (8 часов, secure, sameSite: strict)
3. Все admin API routes вызывают `checkAdminAuth(request)` из `lib/admin/checkAdminAuth.ts`
4. Cookie не совпадает или отсутствует → 401, без исключений
5. Logout: `POST /api/admin/logout` → очищает cookie сервер-сайд + `sessionStorage.removeItem`

**Переменная окружения:** `ADMIN_SESSION_SECRET` — случайный hex32, хранится в `.env`

**API routes:**
- `POST /api/admin/verify-totp` — TOTP проверка, выставляет cookie (не требует auth)
- `POST /api/admin/logout` — очищает cookie (не требует auth)
- `GET /api/admin/get-users` — список пользователей (**требует cookie**)
- `POST /api/admin/update-user-role` — смена роли (**требует cookie**)

**Функции:** список пользователей, смена ролей, список проектов, SEO настройки, Dev Console

⚠️ **БЫЛО:** `/api/admin/get-users` и `/api/admin/update-user-role` не имели серверной авторизации — любой мог получить список юзеров и назначить себе роль Admin. Закрыто хотфиксом c62b9f2.

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
- ~~Admin hardcoded логин/пароль~~ ✅ TOTP был уже реализован
- ~~Admin API без авторизации~~ ✅ Закрыто хотфиксом 21.03.2026 — httpOnly cookie на всех /api/admin/* routes

---

*Последнее обновление: 15.03.2026*
