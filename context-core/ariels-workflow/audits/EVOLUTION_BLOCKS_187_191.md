187. ADMIN PANEL FULL DARK MODE — ВСЕ 7 ТАБОВ 09.04.2026

Полная тёмная тема admin panel. Проблема: предыдущая реализация была косметической — header и tabbar были тёмными, но внутренности всех табов оставались белыми.

Архитектура: AdminTheme тип с 8 переменными (bg, cardBg, text, textMuted, textSec, border, borderLight, surfaceAlt, inputBg, inputBorder). ADMIN_DARK / ADMIN_LIGHT константы. th(AT) helper в styles.ts — возвращает {card: TC, inp: TI, row} для переиспользования. isDark + AT пробрасываются через AdminSharedProps во все табы.

Все 7 основных табов переписаны: Dashboard, Team, Goals, Pull Pool, Messages, Logs, Settings. DevConsole получил локальный T объект с 8 переменными и отдельную логику для CodeMirror (oneDark тема, live switching через Compartment без пересоздания редактора).

Персистентность: localStorage сохраняет предпочтение темы между сессиями. Кнопка 🌙/☀️ рядом с аватаром Super Admin.

ProfileEditor (lib/ProfileEditor.tsx) — принимает isDark?: boolean, уже был готов, нужно было только передать пропс.

Расширение Statistics (extensions/project-stats/AdminTab.tsx) — переписано с поддержкой isDark: тёмные карточки, statBox с border, barBg для прогресс-баров.

ИНСАЙТ: правильный паттерн для dark mode в inline-styled компонентах — theme object с 8-10 переменными, не className. Позволяет точечно менять любой цвет без риска конфликтов Tailwind.

---

188. DEVCONSOLE MESSAGES TAB — BLOCK 3 09.04.2026

Полноценный чат в правой панели Dev Console — и в admin panel, и в dashboard.

State: convos, activeConvoId, activeConvoMeta, convoMsgs, msgInput, profiles — всё в компоненте. Polling каждые 3 секунды пока открыта переписка. Auto-scroll через msgEndRef.

Список conversations: загружается при первом переходе на ✉️ Msg таб. Показывает аватар-инициал с цветом профиля, имя, последнее сообщение, время. Поддержка групповых чатов (иконка 👥, синий фон).

Chat view: мои сообщения справа (оранжевые), чужие слева. Групп-чат: имя отправителя над пузырём в цвете его профиля. Системные уведомления (✅/❌/📋) — компактные центрированные пиллы с цветом по типу.

Критические баги найдены и закрыты сразу:
- Dashboard: conversation-messages ожидает conversationId, код передавал id — пустой массив
- Отправка DM: неверный action name (messages-send-chat → send-chat-message)
- Оптимистичный апдейт: сообщение появляется мгновенно, потом confirm через reload
- useEffect на activeConvoId: надёжная загрузка при открытии чата

Цветные ники: profiles загружаются через profiles-list при первом открытии таба. Цвет из settings применяется к аватарам и именам отправителей. Маркетеры получают ту же функциональность автоматически — API те же, роль не важна.

ИНСАЙТ: API контракт (параметр conversationId vs id) должен быть задокументирован явно. Разные handlers в одной системе используют разные имена для одного понятия — это источник молчаливых багов.

---

189. DEVCONSOLE AI CHAT (GEMINI) — BLOCK 4 09.04.2026

Встроенный AI агент в Dev Console с полным tool calling. Первый в системе прецедент — AI внутри AI (Gemini внутри IAM Client OS, которую строит Claude).

Backend: dev-ai-handler.ts — agentic loop до 10 итераций. Каждая итерация: вызов Gemini → парсинг functionCall → выполнение tool → добавление functionResponse → следующий вызов. Финальный ответ — когда Gemini возвращает только text без functionCall.

Tool set по роли:
- Все роли: read_file, list_directory
- Admin: + write_file, patch_file, delete_file, git_snapshot
- Workers: + create_pr (все изменения через PR workflow)

patch_file имеет умную валидацию: old_text должен встречаться ровно один раз. При 0 вхождений — ошибка "Read the file first". При >1 — "Include more surrounding context". Это предотвращает молчаливые неправильные патчи.

Модель: gemini-2.5-pro (основная) + gemini-2.5-flash (fallback при 503). Выбор моделей через реальный вызов ListModels API — предыдущие попытки (gemini-2.0-flash, gemini-1.5-pro) давали 404. Имена моделей в Gemini API не совпадают с маркетинговыми названиями.

Настройки: Admin → Settings → AI Providers → поле geminiApiKey. Ключ хранится в data/settings.json, читается с кешем 30 секунд.

UI: таб 🤖 AI в правой панели DevConsole. Бейдж "🟢 Gemini". Кнопки прикрепления: 📎 текущий файл (content первые 30KB), 📋 PR diff (первые 15KB). Tool calls отображаются как collapsible: "🔧 patch_file("path") ✓" — можно раскрыть и увидеть результат. История чата за сессию через newHistory в каждом запросе.

ИНСАЙТ: agentic loop в браузере через serverless handler — правильный паттерн. AI думает и действует на сервере, фронтенд только показывает результат. Tool calls как детализированный лог — не просто "AI сделал что-то", а именно что и с каким результатом.

---

190. WORKSPACE / SYSTEM BOUNDARY — БЕЗОПАСНОСТЬ ФАЙЛОВОГО ДЕРЕВА 10.04.2026

Критическая архитектурная проблема обнаружена: reviewer мог читать app/admin/*, app/api/*, lib/* — весь код IAM Client OS через Dev Console. Это нарушало фундаментальный принцип: система не должна показывать собственную реализацию клиентам и воркерам.

Разделение введено явно:

SYSTEM_CODE_DIRS (скрыто для ВСЕХ в Dev Console, включая Super Admin):
app/, lib/, extensions/, scripts/, public/, bootstrap-prompts/, messages/, logs/, data/

Root config files: next.config.mjs, tsconfig.json, package.json, ecosystem.config.js, install.sh

WORKSPACE (то что команда реально редактирует):
pull-pool/, memory/, tasks/, docs/, source-of-truth/, IDEAS/, skills/, tests/, README.md

Три уровня защиты:
1. filterByAccess() — dir не появляется в tree
2. dev-read-file handler — 403 при прямом запросе пути
3. admin get-handlers 'read' — 403 при прямом запросе

Принцип "No access = doesn't exist" расширен: теперь системные файлы не просто запрещены — они физически отсутствуют в tree UI.

Custom hidden paths: Super Admin может добавить любые пути через Settings → Dev Console Hidden Paths. Поддержка glob: *.env, secrets/, config/private/*. Хранится как JSON array в settings.json под devConsoleHiddenPaths. Кеш 30 секунд в памяти процесса. Это позволяет при клиентской инсталляции скрыть специфичные для клиента чувствительные директории.

ИНСАЙТ: "Workspace tool vs Code editor" — фундаментальное различие. Dev Console — это инструмент для работы с контентом команды, не с реализацией платформы. Когда IAM Client OS интегрируется на чужой сервер, клиент видит только свои файлы. Системные файлы управляются через MCP/SSH, не через браузер.

---

191. IAMRUNNER.AI — DESKTOP AI CLIENT ПРОГРЕСС 10.04.2026

Параллельный продукт — Electron/Tauri desktop приложение с локальным AI. Разработка идёт в отдельных сессиях с моделями, специализированными на локальном AI.

Реализовано на текущий момент:
- Встроенный терминал — работает, полноценный shell внутри desktop app
- Соло-режим — один пользователь без команды, упрощённый UX
- Файловая система — можно писать файлы, добавлять файлы, ссылаться на них в диалоге
- File references в чате — @filename синтаксис, модель читает referenced файл как контекст
- Ollama интеграция — локальная LLM (llama, qwen и др.) без облака
- Tool use для локальной модели — инструменты чтения файлов доступны модели

В разработке:
- RAG (Retrieval Augmented Generation) — ChromaDB + nomic-embed-text. Все файлы проекта → embeddings. При вопросе: релевантные чанки в контекст. Ключевое для работы с большими кодовыми базами
- MCP Bridge — локальная модель вызывает MCP tools на VPS. Замыкает петлю: desktop AI → действует на сервере через тот же протокол что и Claude

Бизнес-модель кристаллизуется: $4-5k разовый пакет. Desktop Client + VPS Setup (IAM Client OS) + локальная AI под ключ. Никаких подписок после. Прецедентов нет — никто не продаёт "свою нейросеть для команды" с таким уровнем интеграции.

ИНСАЙТ: два продукта (iamrunning.online + iamrunner.ai) развиваются параллельно, но сходятся в одну точку — MCP как протокол. Desktop клиент подключается к тому же MCP серверу что и Claude. Это не два продукта, это один ecosystem с разными точками входа.

---

ИТОГИ 07-10.04.2026:

✅ Admin Panel Dark Mode — все 7 табов + DevConsole + Statistics extension
✅ DevConsole Block 3 — Messages tab (Admin + Dashboard), WhatsApp-style
✅ DevConsole Messages bugs — conversationId param, оптимистичный апдейт, polling
✅ Colored nicknames в DevConsole Messages — profile colors из settings
✅ DevConsole Block 4 — Gemini AI Chat с полным tool calling (10-iteration agentic loop)
✅ Gemini tool set по роли: admin = full access, workers = PR-only
✅ Gemini 2.5-pro + 2.5-flash fallback (подтверждено через ListModels API)
✅ Workspace/System boundary — app/, lib/ скрыты от всех в Dev Console
✅ Custom hidden paths — Super Admin настраивает дополнительные ограничения через UI
✅ iamrunner.ai: терминал, соло-режим, file references, Ollama tool use

ИНСАЙТЫ:

AI внутри AI-системы — рабочий паттерн. Gemini в IAM Client OS, управляемой Claude через MCP.
Workspace boundary — архитектурный принцип, не просто security. "Что видит команда" = "что они делают".
Custom restrictions = multi-tenant readiness. Одна инсталляция, разные клиенты, разные ограничения.
ListModels перед хардкодом моделей — обязательная практика. Маркетинговые имена ≠ API имена.
Оптимистичный апдейт + confirm reload — правильный UX для messaging. Не ждать API, но верифицировать.
iamrunner.ai + MCP = один ecosystem. Desktop и браузер используют один протокол, один сервер.
