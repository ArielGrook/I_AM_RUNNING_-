# EVOLUTION — CONTINUED 22.03.2026
## Записи 131–145

---

131. INTERACTIVE STEP 1 — REDESIGN V2: СВЕТЛЫЕ SVG КАРТОЧКИ 22.03.2026
16 CSS thumbnails (из записи 125) заменены на детализированные SVG 140×88.
Каждая карточка — mini-концепт сайта в цветовом семействе своей ниши:
food=#fff7ed/оранжевый, startup=#f7fee7/лаймовый, shop=#f5f3ff/фиолетовый,
beauty=#fdf2f8/розовый, health=#f0fdf4/зелёный, education=#eff6ff/синий,
agency=#fff7ed/огненно-оранжевый, travel=#f0f9ff/голубой, craft=#faf5ff/фиолет+палитра.
Карточки всегда светлые — background: transparent, SVG задаёт цвет фона.
border: rgba(0,0,0,0.10) при unselected, 2px solid accentColor при selected.
label: rgba(0,0,0,0.55) — не зависит от isDarkMode. Это ключевое: isDarkMode
влияет только на page background, НЕ на сами карточки.

132. ANIMATED BACKGROUND — DESKTOP FIX 22.03.2026
AnimatedBackground: 140 иконок вместо 120. Критический баг: right: -startX%
давал иконки только в правой четверти экрана на wide viewport. Фикс:
left: startX% где startX в диапазоне 0..130% — полное покрытие любого экрана.
CSS animation translate(-160vw,-140vh) вместо translate(-900px,-900px) —
масштабируется под любой размер экрана. Opacity: 0.10-0.22 вместо 0.85+
(было почти непрозрачным и перекрывало контент).

133. MOBILE LANDSCAPE RESTRICTION — REMOVED 22.03.2026
Удалены: isPortrait state, dismissedRotate state, useEffect с детектором
portrait (window.innerWidth < 768), overlay "Rotate to Landscape" с кнопкой
"Continue anyway". Причина: вертикальный формат естественен для карточного UI,
горизонтальный был лишним требованием. Interactive теперь работает в portrait нативно.

134. CHATGPT MCP CONNECTOR — SAFE AUDIT ENDPOINT 22.03.2026
Создан параллельный MCP стек для ChatGPT: app/api/mcp-gpt/* с отдельным
GPT_MCP_SECRET (независим от основного mcpAuthToken). lib/mcp-server/gpt-safe.ts:
Safe Audit Mode — 7 инструментов: read_file (с offset/limit параметрами для
больших файлов), read_range (start_line..end_line), file_stat (размер/строки/дата),
list_directory (глубина до 6), search_files (TypeScript/Unicode, scope/file_pattern),
read_multiple_files (до 8 файлов), write_file (ТОЛЬКО context-core/**/*.md и docs/**/*.md).
Жёсткие блокировки: .env, node_modules, .next, .git, .dev-agent-config, секреты.
Audit log всех write операций в .gpt-mcp-audit.log. lib/mcp-gpt-oauth-codes.ts —
отдельный in-memory OAuth code store (изолирован от основного).
OAuth discovery: .well-known/oauth-authorization-server/gpt/route.ts.
ChatGPT подключён и протестирован — читает context-core через коннектор.

135. СТРАТЕГИЧЕСКИЙ ПОВОРОТ — AI NATIVE INTEGRATED BUSINESS SOFTWARE 22.03.2026
Ключевой инсайт сессии: I AM RUNNING — не просто website builder. Текущая
архитектура (context-core + MCP + Dev Console + deploy) это переносимое ядро
AI-native операционной системы для бизнеса. Новый продуктовый трек:
продавать систему клиентам как AI Native Integrated Business Software —
founder-led installation, $1000-2500 setup + $300-600/мес поддержка.
Клиент получает: систему на своём домене, context-core под его бизнес,
MCP endpoint для Claude/ChatGPT, Dev Console (урезанный — только файловое
дерево context-core), bootstrap промты. Клиент НЕ знает что внутри Next.js —
он просто работает с AI через браузер. Это не замена website builder MVP,
а параллельный трек поверх того же codebase.

136. PRODUCT TEMPLATE — INSTALLATION PACKAGE 22.03.2026
product-template/ создан в корне проекта как полный пакет установки:
install-client.sh (v2): проверяет зависимости (node/npm/pm2/nginx/git/certbot),
генерирует 3 секрета (MCP token, GPT secret, admin session secret + TOTP),
создаёт /var/www/iam-clients/CLIENT_SLUG/, копирует context-core из шаблона
с заменой плейсхолдеров, пишет .env + .dev-agent-config.json, создаёт
ecosystem.config.js через отдельный generate-ecosystem.js (решение проблемы
bash heredoc + node -e кавычек), запускает PM2, создаёт Nginx конфиг.
manage-clients.sh: list/status/logs/restart/restart-all/backup/remove.
auto-backup.sh: cron — git commit + push context-core каждого клиента на GitHub.
INSTALL.md: founder installation guide с pricing reference ($500-2500 setup,
$300-600/мес). Context-core шаблон: 8 документов (SYSTEM_IDENTITY, CURRENT_GOAL,
IDEAS, MVP_BRIEF, NEXT_ACTIONS, WEEKLY_PROGRESS, ARCHITECTURE, ENGINEERING_MEMORY).
Bootstrap prompts: claude-start.md + chatgpt-start.md с инструкцией copy-paste.

137. PM2 COMPATIBILITY FIXES — СТАРАЯ ВЕРСИЯ PM2 22.03.2026
Три баги совместимости обнаружены при первой реальной установке:
1. --env-file флаг не поддерживается старым PM2 → решение: ecosystem.config.js
   через generate-ecosystem.js (node скрипт читает .env → генерирует JS конфиг).
2. --quiet флаг у pm2 save не поддерживается → убран флаг.
3. bash heredoc + node -e с кавычками внутри → SyntaxError → решение:
   вынести генерацию в отдельный generate-ecosystem.js файл, вызывать как
   node SCRIPT_PATH ARG1 ARG2 ARG3 из bash.
Первая успешная установка: iam-gooner, порт 3100, online статус в PM2.

138. МУЛЬТИТЕНАНТНОСТЬ — АРХИТЕКТУРНОЕ РЕШЕНИЕ 22.03.2026
Проблема: несколько PM2 процессов из одного cwd конфликтуют за общий .next билд.
iam-gooner пытался запустить next start из /var/www/i_am_running но .next
был пересобран основным процессом с другими env → Error: no production build.
Решение выбрано (реализация в следующей сессии): ОДИН PM2 процесс (порт 3000),
Nginx добавляет заголовок X-Client-Slug по server_name, middleware.ts читает
заголовок и устанавливает контекст для загрузки нужного context-core.
lego-base.online (второй домен Ариэля) будет использован как домен для
клиентских инстансов: gooner.lego-base.online, client2.lego-base.online и т.д.
Ноль дополнительной инфраструктуры — просто Nginx конфиг + middleware.

139. CLIENT HOME PAGE — ОНБОРДИНГ ЛЕНДИНГ 22.03.2026
Создан app/[locale]/client-home/page.tsx — тёмный онбординг лендинг для
клиентских инстансов. Показывает: имя клиента, 4 шага как пользоваться системой,
bootstrap prompt snippet, кнопка Enter Admin Panel. Условие показа: если
NEXT_PUBLIC_CLIENT_SLUG задан в .env — показывать ClientLanding вместо
основного IAM лендинга. ПРИМЕЧАНИЕ: эта логика не до конца дореализована
(архитектурное решение pending) — при следующей сессии либо дореализовать
через X-Client-Slug middleware либо откатить patch в page.tsx.

140. CHATGPT VS CLAUDE — ИНЖЕНЕРНОЕ СРАВНЕНИЕ 22.03.2026
Практическое наблюдение из сессии: ChatGPT 4.5 при работе с архитектурными
документами склонен к галлюцинациям, особенно в длинных сессиях — начинает
выдавать одинаково звучащую информацию не отражающую специфику проекта.
Claude (Sonnet/Opus) надёжнее для: архитектурного аудита, точечных патчей,
работы с реальным кодом через MCP. ChatGPT можно доверять: визуальные правки
(SVG, цвета, анимации), написание markdown документов по чёткому шаблону,
генерацию bootstrap промтов. Рабочий workflow: сложная архитектура → Claude,
визуал и механические задачи → ChatGPT с жёсткими инструкциями.

---

КЛЮЧЕВЫЕ ИНСАЙТЫ ЧЕТЫРНАДЦАТОЙ ЧАСТИ

Светлые SVG карточки лучше CSS thumbnails — больше деталей, нет overflow проблем при правильном подходе
AnimatedBackground: left вместо right, vw/vh вместо px — масштабируется под любой экран
Отдельный OAuth store для каждого MCP endpoint — изоляция токенов обязательна
PM2 compatibility: всегда проверять версию, --env-file и --quiet не работают в старых версиях
generate-ecosystem.js как отдельный файл — единственный надёжный способ передать env в PM2 без heredoc
Один PM2 процесс для всех клиентов — правильная архитектура, X-Client-Slug через Nginx
lego-base.online — второй домен без новой инфраструктуры, просто Nginx server_name
Context-core как коммерческий продукт — не просто документация проекта, а ядро нового бизнеса
$1000-2500 setup + $300-600/мес — реалистичная цена, первая продажа цель апреля 2026

22.03.2026 — проект разделился на два параллельных трека: website builder MVP и AI Native Integrated Business Software
