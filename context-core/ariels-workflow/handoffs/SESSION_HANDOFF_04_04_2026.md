Сервер: test.lego-base.online (185.5.55.111), /var/www/iam-os/
MCP: Подключай ТОЛЬКО lego-base connector
Последний коммит: a032bb7 (04.04.2026)
Билд: ✅ Задеплоен

КАК НАЧАТЬ

Вызови read_memory — там актуальные ARCHITECTURE.md, CURRENT_GOAL.md, NEXT_ACTIONS.md
При необходимости читай IDEAS/IMPROVEMENT_PLAN_IAM_CLIENT_OS.md — полный трекер задач с тирами


ЧТО БЫЛО СДЕЛАНО (04.04.2026)

Сессия была огромная — 3 больших блока:

1. SECURITY SPRINT 14/14 ЗАКРЫТ
   - httpOnly cookie для dashboard (lib/dashboard/session.ts, /api/dashboard/auth, resolveRoleFromHash в auth.ts)
   - Zod validation на все dashboard handlers (15 схем в app/api/dashboard/lib/validation.ts)
   - TOTP re-issue (lib/admin/totp-secret.ts — getTotpSecret/setTotpSecret, override через data/settings.json)
   - Token rotation (team-regenerate-token handler, destroySessionsByHash)
   - UI кнопки: "Regenerate TOTP" в Settings, "New Token" в Team
   - ИНЦИДЕНТ: Ariel нажал Regenerate TOTP не сохранив QR → залочился. Фикс через MCP: прочитали data/settings.json, дали secret. НУЖНО: добавить confirm step с обязательным вводом нового кода перед финализацией.

2. DIFF VIEW В PULL POOL
   - Admin Panel: AdminPullPoolTab.tsx — LCS diff, 3 режима (⚡ Diff / 📝 Proposed / 📂 Production), +N/-N stats
   - Dashboard: DashboardTeamTab.tsx — кнопка "⚡ View Diff" per PR, inline diff
   - API: pr-read-production endpoint (reads production file from PR meta), capability-gated review_prs
   - computeDiff() — LCS алгоритм, fallback для файлов >3000 строк

3. MOBILE RESPONSIVE (Phase 1+2, ~70%)
   - app/lib/useIsMobile.ts — hook (768px, debounced resize)
   - app/globals.css — word-break на все элементы, iOS zoom prevention, safe area, touch targets
   - app/layout.tsx — viewport meta (width=device-width, no zoom)
   - Dashboard header: двухстрочный на мобилке (logo+user / tabs flex:1)
   - DashboardWorkTab: columns → vertical stack, inbox full-width, PR title wrapping (убран whiteSpace:nowrap), bigger fonts
   - DashboardTeamTab + GoalsTab: padding responsive
   - AdminDashboardTab: pipeline 3-column → vertical, team → vertical, quick task input
   - Admin panel: compact tabs (8px 12px), reduced padding, TOTP box maxWidth
   - ⚠️ ПРАВИЛО: НИКОГДА window.innerWidth в JSX (SSR crash) — только useIsMobile() hook


НЕЗАКОНЧЕНО — MOBILE RESPONSIVE Phase 3

Ariel прислал скриншот с мобилки: карточки Workers Tasks + Available Tasks + PR card text выходят за рамки. Частично пофиксено (overflow:hidden, word-break), но нужно:

1. DashboardWorkTab.tsx — увеличить шрифты карточек workers tasks, available tasks (сейчас 12-13px → нужно 14-15 на мобилке)
2. AdminTeamTab.tsx — member cards, tools grid, expanded view → крупнее на мобилке
3. AdminGoalsTab.tsx — milestone/task cards → responsive padding/fonts
4. AdminDevConsoleTab.tsx — file tree + editor → stacked вертикально на мобилке
5. AdminMessagesTab.tsx — responsive
6. AdminPullPoolTab.tsx — карточки в list view
7. Landing page (app/page.tsx) — Canvas effects, pricing cards, responsive

Подход: useIsMobile() уже импортирован в ключевых файлах. Просто добавлять isMobile ? biggerSize : normalSize.


СЛЕДУЮЩИЕ ЗАДАЧИ (по приоритету от Ariel)

1. 🔴 Дочистить mobile responsive (Phase 3) — все табы admin panel + dashboard
2. 🔴 Push Notifications (Service Worker + subscription + triggers)
3. 🔴 Онбординг брата и дяди — сегодня вечером, создать токены, прогнать workflow
4. 🟡 Dev Console MVP — file browser + editor + Submit PR
5. 🟡 Workflow reviewer/marketer — инструменты, UI, bootstrap prompts
6. 🟡 Лендинг iam-client-os polish
7. 🟡 Лендинг iamrunning.online redesign
8. 🟢 Safety net — TEAM_ROLES.md backup + cron
9. 🟢 Теневые мосты на iamrunning
10. 🟢 install.sh обновление

Дедлайн: 1-1.5 недели на всё. Подписка Claude Pro ($100) нужна для работы над iamrunning после.


КЛЮЧЕВАЯ АРХИТЕКТУРА (обновлённая)

lib/data/                    ← ЕДИНЫЙ DATA LAYER (11 файлов)
lib/dashboard/session.ts     ← Dashboard httpOnly cookie sessions
lib/admin/checkAdminAuth.ts  ← Admin TOTP cookie sessions
lib/admin/totp-secret.ts     ← TOTP secret management (settings.json override)
app/lib/useIsMobile.ts       ← Responsive hook (768px breakpoint)

app/api/dashboard/auth/route.ts    ← POST login / DELETE logout
app/api/dashboard/route.ts         ← Cookie-based auth (resolveRoleFromHash)
app/api/dashboard/lib/validation.ts ← 15 Zod schemas
app/api/dashboard/lib/pr-handlers.ts ← includes pr-read-production

Правило: все data операции через import { ... } from '@/lib/data'. Никогда window.innerWidth в JSX.


ПРАВИЛА

read_memory первым вызовом
git_snapshot перед deploy (enforced)
Аудит перед правкой — read_file до patch_file
Файлы >500 строк → write_file (не chain patch_file)
Один MCP connector — только lego-base
Рабочий язык — русский с Ariel, код на английском
Никогда window.innerWidth в JSX — только useIsMobile() hook
