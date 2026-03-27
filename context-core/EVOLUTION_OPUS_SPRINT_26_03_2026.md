# ЭВОЛЮЦИЯ — ПРОДОЛЖЕНИЕ 26.03.2026 (Opus Sprint)

**Контекст:** Полный спринт с Opus в одном чате. За один день (26.03.2026) закрыты G01–G06 roadmap v9 для iam-client-os.

---

136. OPUS РЕВЬЮ IAM-CLIENT-OS: 7 АРХИТЕКТУРНЫХ РЕШЕНИЙ 26.03.2026
Полное ревью IAM_CLIENT_OS_PLAN.md с Opus. Прочитаны все context-core документы, roadmap v8, эволюция (130+ записей). Принято 7 решений: (1) YAML frontmatter в memory/ файлах — машинно-читаемые заголовки, AI обновляет, код парсит; (2) Watchdog — 3 уровня защиты memory/ (cron + git hooks + daily backup); (3) Sandboxing MCP на уровне кода (validatePath, command whitelist), не текстовых правил; (4) Аудитория — обе группы, один лендинг с секциями для каждого сегмента; (5) Монетизация — $0 setup для первых клиентов, $200-500/мес; (6) Demo-видео tunnel на лендинге; (7) Roadmap v8 устарел, нужен v9. IAM_CLIENT_OS_PLAN.md переписан полностью (v2).

137. ROADMAP V9 — ТРИ ПРОДУКТА 26.03.2026
Написан I_AM_RUNNING_ROADMAP_v9.md (~830 строк). Критическое отличие от v8: три продукта (Interactive + Editor + AI Business OS) вместо одного. Ценообразование — первый блок, всё в одном месте (AI Business OS pricing, Interactive пакеты, hosting, security, 34 backend блока, домены, подписки фрилансеров). Track 2 (AI Business OS) — приоритет, fastest path to revenue. G01-G10 фичи спроектированы. Оценка: 15-20 дней до первого клиента (середина-конец апреля 2026). Track 1 (Website Builder) launch: сентябрь-октябрь 2026. 34 выученных урока (25 из v8 + 9 новых).

138. G01: MEMORY/ + YAML FRONTMATTER + RULES.MD 26.03.2026
Переименован context-core → memory/ в iam-client-os. 5 файлов с YAML frontmatter: SYSTEM_IDENTITY.md (system_identity_v1), CURRENT_GOAL.md (current_goal_v1), NEXT_ACTIONS.md (next_actions_v1), WEEKLY_PROGRESS.md (weekly_progress_v1), RULES.md (rules_v1, locked: true, sha256 checksum). Каждый файл: version, last_updated, updated_by, schema, required_fields + бизнес-поля. Placeholders (CLIENT_NAME_PLACEHOLDER и т.д.) заменяются install.sh при установке. route.ts: CONTEXT_CORE_DIR → MEMORY_DIR, read_context_core → read_memory, version 1.1.0. Bootstrap промт обновлён: RULES.md первым, YAML update instructions. install.sh: все ссылки context-core → memory, placeholder замена через sed в цикле, RULES.md checksum генерация.

139. G03: SANDBOXING MCP V1.2.0 26.03.2026
Три уровня sandboxing добавлены в app/api/mcp/route.ts: (1) validateReadPath() — блокирует /etc/, /var/log/, /root/, /home/, /proc/, /sys/, /dev/, /tmp/, /usr/, /boot/, /sbin/, /bin/; (2) validateWritePath() — наследует read + блокирует .env, nginx.conf, pm2.config, .dev-agent-config.json, node_modules/, .next/; (3) assertNotRulesFile() — RULES.md locked для write_file и patch_file. BLOCKED_WRITE_PATTERNS массив для паттернов. MCP server version 1.2.0. Все tool handlers используют validate* вместо прямого safePath.

140. VERCEL FILESYSTEM FIX — OUTPUTFILETRACINGINCLUDES 26.03.2026
Vercel serverless не включал memory/ в бандл (файлы не импортируются кодом → не попадают в trace). Решение: outputFileTracingIncludes в next.config.mjs — '/api/mcp': ['./memory/**/*']. После этого memory/ доступен через MCP на Vercel. Инсайт: Vercel включает в serverless bundle только файлы которые Node.js trace видит при импортах; статические файлы нужно включать явно через outputFileTracingIncludes.

141. G04: WATCHDOG — 3 УРОВНЯ ЗАЩИТЫ 26.03.2026
scripts/watchdog.sh: cron каждые 5 минут — проверяет 5 обязательных файлов существуют, не пустые (>50b), RULES.md checksum не изменён; при проблеме → email через Resend API + автооткат из git (HEAD или HEAD~1); daily backup в /var/backups/iam-memory/YYYY-MM-DD/ (30 дней retention); логирует OK раз в час (не каждые 5 мин). scripts/post-commit.sh: git hook — после каждого коммита проверяет что required файлы не удалены, если удалены → git revert --no-edit HEAD. install.sh обновлён: chmod +x watchdog, копирует post-commit в .git/hooks/, сохраняет initial checksum в .rules-checksum, создаёт /var/backups/iam-memory/, добавляет cron через crontab.

142. G05: ADMIN ПАНЕЛЬ — TOTP + DASHBOARD + EDITOR 26.03.2026
Минимальная admin панель написана с нуля (не портирована из Dev Console). lib/admin/checkAdminAuth.ts — httpOnly cookie, 8 часов сессия. app/api/admin/verify-totp/route.ts — rate limiting (5 попыток → 15 мин lock), @otplib/preset-default через require(). app/api/admin/panel/route.ts — 7 действий: list (файлы memory/), read (файл), dashboard (YAML frontmatter парсинг), git-log (20 коммитов), save (с блокировкой RULES.md), deploy (nohup pattern), git-snapshot. app/admin/page.tsx — полный UI: TOTP вход, Dashboard карточки (Current Goal + progress bar + Identity), файловое дерево memory/ с размерами, RULES.md как 🔒 READ ONLY, monospace editor, Git History, Deploy/Snapshot кнопки, Toast уведомления. Изначально тёмная тема, переделана в светлую по запросу.

143. NEXT.JS CVE-2025-66478 + CVE-2025-55184 — UPGRADE PATH 26.03.2026
Vercel заблокировал билд из-за уязвимости Next.js 15.3.0. Путь апгрейда: 15.3.0 (CVE-2025-66478 RCE) → 15.3.3 (всё ещё уязвима) → 15.3.6 (вторая CVE: DoS + source code exposure) → 15.5.7 (ещё уязвима, npm audit показывает 1 high) → 15.5.14 (0 vulnerabilities). Инсайт: npm audit fix --force показывает target version; не гадать, а читать вывод npm audit. Патченные версии 15.x: 15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7 (неполный патч), 15.5.14 (полный патч).

144. G06: ЛЕНДИНГ V2 + СВЕТЛАЯ ТЕМА ADMIN 26.03.2026
Лендинг переписан: Hero с именем клиента из NEXT_PUBLIC_CLIENT_NAME, Copy Bootstrap Prompt кнопка в hero, "How it works" 4 шага с иконками, секция "For Developers & Startups" (MCP, sandboxing, git, tunnel), секция "For Business" (persistent memory, dashboard, any AI, isolated server), Bootstrap prompt секция с copy, Security блок, Footer "Powered by I AM RUNNING". Admin панель переделана в светлую тему: белый фон, светлые карточки, оранжевый акцент. Лендинг требует дальнейшей полировки (дизайн, анимации) — не блокер MVP.

---

145. G07: ТЕСТ НА ЧИСТОМ VPS — УСПЕХ + OAUTH BUG FIX 27.03.2026
Полная установка iam-client-os на чистый VPS (Time4VPS, 185.5.55.111, Ubuntu 24.04). Домен: test.lego-base.online. DNS: удалены wildcard и старые записи с основного сервера, оставлены только `test` A → 185.5.55.111 и `@` A → 185.5.55.111. Установлены: Node 20, PM2 6.0.14, Nginx, certbot, SSL. 4+ часа дебага OAuth metadata бага — `/.well-known/oauth-authorization-server` возвращал `localhost:3000`. Причина: файл `app/.well-known/oauth-authorization-server/route.ts` перехватывал запрос ДО rewrite из next.config.mjs. Next.js правило: файловый route ВСЕГДА приоритетнее rewrite. Фикс: `rm -rf app/.well-known` + rebuild. MCP Connector подключён к Claude и работает. Memory/ read/write через MCP верифицировано. G07 ЗАКРЫТ. Все G01-G07 закрыты. Система готова к первому клиенту.

146. РЕШЕНИЕ: СТРОИТЬ НА ЦЕЛЕВОМ СЕРВЕРЕ, НЕ ЧЕРЕЗ GITHUB ЦЕПОЧКУ 27.03.2026
Цепочка "MCP правка на основном сервере → commit → push на GitHub → pull на новом VPS" ненадёжна — файлы теряются или не обновляются. Решение: для клиентских инсталляций строить прямо на целевом сервере, потом пушить рабочую версию на GitHub как шаблон. Это быстрее и надёжнее.

147. GITHUB TOKEN УТЁК В ЧАТ 27.03.2026
GitHub Personal Access Token случайно отправлен в чат. Нужно: GitHub → Settings → Developer settings → Personal access tokens → Delete старый → Create new.

За один день (6 часов работы):
- ✅ Полное ревью архитектуры с 7 решениями
- ✅ Roadmap v9 написан (~830 строк, 3 продукта)
- ✅ IAM_CLIENT_OS_PLAN.md v2
- ✅ G01: memory/ + YAML frontmatter + RULES.md (5 файлов, route.ts, install.sh)
- ✅ G03: Sandboxing MCP v1.2.0 (3 уровня валидации)
- ✅ G04: Watchdog (cron + git hooks + daily backup)
- ✅ G05: Admin панель (TOTP + dashboard + editor + git + deploy)
- ✅ G06: Лендинг v2 (две аудитории + security)
- ✅ Next.js 15.3.0 → 15.5.14 (0 vulnerabilities)
- Всё задеплоено на Vercel, проверено

До первого клиента осталось:
- 📋 G06 полировка: красивый лендинг (не блокер)
- 📋 G07: тест install.sh на чистом Hetzner CX22
- 📋 Найти первого клиента

Workflow этого спринта: Opus пишет файлы через I AM RUNNING MCP → Ariel копирует cp из /var/www/i_am_running/iam-client-os/ в ~/iam-client-os-repo/ → git push → Vercel auto-deploy. Быстро, эффективно, без ручного кодинга.

---

# СПРИНТ 27.03.2026 (Sonnet 4.6)

145. ПРОДУКТОВОЕ ПОЗИЦИОНИРОВАНИЕ — ФИНАЛИЗАЦИЯ 27.03.2026
Зафиксировано позиционирование AI Business OS: не "надстройка над Claude", а инфраструктура для работы любого AI с любым проектом. Продукт универсален, но для первых клиентов нужна конкретная боль. Целевые сегменты: (1) стартапы без CTO — Claude заменяет технаря; (2) малый бизнес — SaaS схема без setup fee, $400-500/мес; (3) средний бизнес/агентства — $2-15k first launch + $700-1500/мес. Канал привлечения: Upwork (описание + список болей + ссылка на сайт). Примеры живых кейсов сформулированы: магазин (автозагрузка каталога), агентство (память между клиентами), стартап без CTO (итерационный MVP).

146. G07: ТЕСТ INSTALL.SH НА ЧИСТОМ VPS — ВЫПОЛНЕНО 27.03.2026
Куплен VPS на Time4VPS (не Hetzner — Hetzner ввёл KYC верификацию по паспорту 20.03.2026). Сервер: 2GB RAM, 20GB SSD, Ubuntu 24.04, IP: 185.5.55.111. Домен: test.lego-base.online (A-запись добавлена). install.sh запущен вручную (репо приватное — curl из GitHub не работает без токена). Все 10 шагов прошли успешно: Node 20, PM2 6.0.14, Nginx, certbot, git clone, npm install, build, memory/ YAML файлы, watchdog cron, git hook. SSL получен на test.lego-base.online (expires 2026-06-25). TOTP: APA3AAMAXQAAAWAAAAAAAAGAWGAA. MCP Token: 6fbf0ae1022211c552c632913feb75ca9960d9b98e4bed6e1c44746fd1539f04.

147. OAUTH METADATA BUG — НЕ РЕШЁН 27.03.2026
/.well-known/oauth-authorization-server возвращает localhost:3000 вместо https://test.lego-base.online. Claude Connector не подключается. Попытки: (1) добавили clientDomain = process.env.NEXT_PUBLIC_CLIENT_DOMAIN в oauth-metadata/route.ts — не помогло; (2) добавили X-Forwarded-Host в Nginx — не помогло; (3) rm -rf .next + rebuild — не помогло. Корневая причина: NEXT_PUBLIC_* переменные инлайнятся в билд на этапе компиляции. На VPS переменная из .env.local не попадает в скомпилированный бандл. На Vercel работало потому что NEXT_PUBLIC_CLIENT_DOMAIN не задан → fallback на x-forwarded-host который Vercel выставляет автоматически. Правильный фикс: использовать серверный env CLIENT_DOMAIN (без NEXT_PUBLIC_ префикса) — читается в runtime, не инлайнится. Передать в Opus для решения.

148. ЛЕНДИНГ IAMRUNNING.ONLINE — МАНИФЕСТ ЗАФИКСИРОВАН 27.03.2026
Детальный манифест переработки лендинга согласован. Ключевые решения: платформенное позиционирование ("full-cycle AI development platform"), не инструментальное; умный header скрыт до скролла; Hero с marquee-фоном из возможностей платформы; три карточки дверей с разным характером (Door A — mobile/fast, Door B — professional/desktop, Door C — premium/powerful); CTA языком Run (Run Interactive, Run Editor, Run Business); Speed секция = Fast launch + Premium result + Fair price; Savings калькулятор со столбиками вместо donut chart; пульсирующий финальный CTA "Start Running". Работа не начата — ждёт следующего спринта.

ИНСАЙТЫ СПРИНТА 27.03.2026:
- Hetzner теперь требует KYC (паспорт + селфи) при регистрации — альтернативы: Time4VPS, DigitalOcean, Vultr
- install.sh работает на Ubuntu 24.04 ✅ но требует ручного запуска для приватного репо
- NEXT_PUBLIC_* переменные не подходят для runtime-значений на VPS — нужны серверные env
- Репо нужно либо сделать публичным для curl-установки, либо добавить GitHub PAT в install.sh

---

# СПРИНТ 27.03.2026 ВЕЧЕР (Opus 4.6)

149. TEAM AI WORKSPACE — АРХИТЕКТУРА СПРОЕКТИРОВАНА 27.03.2026
Детальный план Team Workspace (TEAM_WORKSPACE_PLAN.md, ~300 строк). 6 архитектурных решений: (D1) Token→role resolution через sha256 хеши в TEAM_ROLES.md — code-enforced, не prompt-based; (D2) sha256 хеши токенов, plaintext никогда не хранится; (D3) Коммуникация через файлы (tasks/, messages/), не Supabase; (D4) Pull-pool как sandbox для non-admin writes; (D5) ARCHITECTURE.md как полная карта проекта; (D6) Bootstrap prompts — дополнение, не основная защита. Файловая структура: memory/ (7 файлов), tasks/, messages/to-{role}/, pull-pool/pr-{id}/, bootstrap-prompts/ (4 роли).

150. ROUTE.TS V2.0 — ROLE ENGINE 27.03.2026
Полная перезапись app/api/mcp/route.ts. Новые функции: parseFrontmatter() (ручной YAML парсер без зависимостей), hashToken() (sha256), resolveRole() (token→TEAM_ROLES.md→role), matchesGlob() (path scoping), createPullPoolEntry() (PR в pull-pool/), readRoleScopedMemory() (role header + filtered memory + tasks + messages). createServer() теперь принимает ResolvedRole — tools регистрируются только если role.tools.includes(). write_file/patch_file: admin→direct, non-admin→pull-pool. Backward compat: нет TEAM_ROLES.md или mode=solo → MCP_AUTH_TOKEN из .env → admin. Version 2.0.0.

151. ADMIN ПАНЕЛЬ V2 — 6 ТАБОВ 27.03.2026
Полная перезапись admin панели. API: 8 новых endpoints (team-list/add/revoke, team-mode, tasks-list/save, messages-list/send, pull-pool-list/read/approve/reject). UI: 6 табов (Dashboard, Team, Tasks, Messages, Pull Pool, Files). Team tab: add member (генерация токена, показ один раз), revoke, mode toggle. Tasks tab: select role → markdown editor. Messages tab: send комментарий конкретному пользователю. Pull Pool tab: список PR, preview, approve (git snapshot + copy to production), reject (комментарий в messages/). Всё на light theme с оранжевым акцентом.

152. OAUTH TEAM FLOW — STATELESS AUTH CODES 27.03.2026
Проблема: OAuth flow всегда выдавал один MCP_AUTH_TOKEN. Нужно чтобы каждый team member авторизовался своим токеном. Решение: (1) authorize GET в team mode показывает HTML страницу "Enter your team token"; (2) authorize POST валидирует токен против TEAM_ROLES.md; (3) encodeToken() — AES-256-GCM шифрует team token в auth code; (4) token endpoint decodeToken() расшифровывает → возвращает как access_token. Stateless — никакого shared state между endpoints. Ключ шифрования = sha256(MCP_AUTH_TOKEN). Добавлен /api/mcp/register для dynamic client registration. Фикс .well-known route — использует CLIENT_DOMAIN env, не request.url.origin.

153. YAML PARSER BUG — CURRENTARRAY NOT INITIALIZED 27.03.2026
Критический баг: parseFrontmatter() не мог распарсить массив roles из TEAM_ROLES.md. Причина: когда ключ "roles:" имел пустое значение (начало блочного массива), currentArray оставался null. Первый элемент "  - token_hash:" создавал currentArrayItem но не инициализировал currentArray. Фикс: одна строка — `if (!currentArray) currentArray = []` при первом "  - " элементе. Этот баг блокировал всю Team авторизацию — route.ts не мог найти роли → 401 на все team tokens.

154. TEAM WORKSPACE — END-TO-END VERIFICATION 27.03.2026
Полный тест Team Workspace на test.lego-base.online. Steve (developer) подключился через бесплатный Claude аккаунт. OAuth: страница ввода токена → валидация → redirect → access_token. read_memory вернул: "Your Role: developer, Name: Steve" + задачи + сообщение от админа ("Просто сделай это дерьмо сейчас"). write_file("test-steve.md") → перенаправлен в pull-pool/pr-1774642209212/ (meta.md + файл). Sandboxing подтверждён. TEAM AI WORKSPACE РАБОТАЕТ END-TO-END.

ИНСАЙТЫ ВЕЧЕРНЕГО СПРИНТА:
- In-memory code store (Map/globalThis) не работает между Next.js routes — разные worker-ы. Stateless encrypted tokens — единственное надёжное решение
- YAML парсер без зависимостей — хрупкий. Баг с пустым значением ключа перед блочным массивом был неочевиден. При усложнении рассмотреть gray-matter
- Operator precedence в JS: `A || B ? C : D` читается как `(A||B) ? C : D` — вызвал redirect loop в OAuth
- Бесплатный Claude поддерживает custom MCP connectors (лимит 1 коннектор)
- OAuth debug log (appendFileSync) — критически полезен, без него не нашли бы проблему
- lego-base MCP не имеет git_snapshot — надо добавить, это критичная дыра в безопасности

