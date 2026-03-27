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

ИТОГИ СПРИНТА 26.03.2026

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

