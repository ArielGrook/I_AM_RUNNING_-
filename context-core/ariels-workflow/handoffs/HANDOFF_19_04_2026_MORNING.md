# Handoff — 19.04.2026 (morning Opus session end)

**Для следующего чата IAM Client OS (Sonnet или Opus).** Старт: `read_memory` → прочитай этот файл → начни с ПЕРВОЙ задачи (EVOLUTION).

---

## TL;DR состояния

- **Stage 3 тест установки частично пройден** 18.04 вечер — iam-test.lego-base.online установился, основные вещи работают (TOTP, Admin Panel, Dev Console file ops, Work System, Product Tour)
- **BUG #2 (Generate Super Admin Token) — ИСПРАВЛЕН сегодня утром, задеплоен**
- **BUG #1 (CLIENT_DOMAIN без схемы в установщике) — НЕ исправлен в source, только хотфикс на iam-test**
- **Claude.ai MCP connector end-to-end ТЕСТ НЕ ЗАВЕРШЁН** — прошлая попытка упала на двух багах
- **iamrunning.ai РАЗМОРОЖЕН 19.04** — параллельный трек, не блокирует этот. См. `ariel-workflow/iamrunning.ai/SESSION_HANDOFF_19_04_2026.md`

---

## Что сделано в утренней сессии (19.04, Opus)

**BUG #2 диагностика и фикс** — кнопка "Generate Super Admin Token" в Admin Settings создавала токен, клала хеш в TEAM_ROLES.md, возвращала токен пользователю — но MCP route в `mode: "solo"` игнорировал TEAM_ROLES.md и проверял только `MCP_AUTH_TOKEN` из env → 401 Unauthorized.

**Решение (Вариант B — архитектурное переформулирование):**
TEAM_ROLES.md roles стали primary source, env MCP_TOKEN — fallback. `mode` больше не gate-keeper, используется только для UX подсказок.

**Изменённые файлы (lego-base, уже задеплоены):**
1. `app/api/mcp/lib/auth.ts` — `resolveRoleFromToken` + `resolveRoleFromHash` переписаны: сначала поиск в TEAM_ROLES.md roles, потом fallback на env MCP_TOKEN, без mode-зависимой логики
2. `app/api/mcp/authorize/route.ts` — OAuth GET: auto-approve env token **только если в TEAM_ROLES.md нет ни одного `token_hash:`** (пустой fresh install). Как только Super Admin сгенерил токен через UI — показывается форма ввода
3. `app/admin/components/AdminTeamTab.tsx` — убрана кнопка-переключатель solo/team + удалён неиспользуемый `handleModeToggle` (solo mode deprecated по решению Ariel: "он плохо протестирован, потом доделаем для малобюджетников")
4. `scripts/sync-to-skeleton/overrides/memory/TEAM_ROLES.md` — default новых установок: `mode: "team"` (было `solo`)

**Ariel подтвердил:** деплой прошёл без проблем, dev работает.

---

## План сегодня (в порядке выполнения)

### 1. ПЕРВАЯ ЗАДАЧА — обновить EVOLUTION_CONTINUED

`EVOLUTION_CONTINUED_10_04_2026.md` в Project Knowledge (этого чата, на стороне Claude.ai) **не обновлялся 9 дней**. За это время произошло:

**14.04:** Мега-tools рефакторинг (6 tools вместо 26+), iam. prefix, security audit Opus, активация Activity Log V2, iam-client.sh написан Cursor'ом (769 строк)
**15.04:** MCP Tool Injection v1+v2 (smartOk, smartErr, checkBlock, session_handoff, preset injection), TOTP first-run flow, bootstrap prompts (EN), install.sh cleanup, memory templates в install.sh, Memory/Instructions sections в Settings, Deploy pipeline → validate-only
**16.04:** MCP market research ($4.5B market, 97M SDK downloads, SMB niche empty), GTM launch day — Upwork profile + LinkedIn + Gmail + Hebrew DM templates, Upwork suspended (Appeal pending), MCP-as-a-Service концепт (Phase 2)
**17.04:** Admin Dev Console file delete bug fix (commit 2ed817b), Stage 1 skeleton sync infrastructure (MANIFEST + sync.sh + 28 overrides, ~2000 строк), OPERATOR_WEBINSTALLER_SKELETON_SPEC, Stage 0 cleanup, DEVELOPMENT_VS_CLIENT.md
**18.04:** First skeleton sync successful (173 sanitized + 180 committed), Stage 2 install.sh cleanup (commits 054c5ae + 3b544b5), Stage 3 test install на iam-test.lego-base.online (установщик отработал 11/11 шагов), обнаружены 2 бага установщика
**19.04:** BUG #2 fix + solo mode deprecated + скрыт toggle

**Как обновлять EVOLUTION:**
- Формат каждой записи: problem → root_cause → actions → files_changed → result → insight
- Поле `insight` — самое ценное (идёт в будущий fine-tune dataset)
- Категоризация: architecture_decision | bugfix_pattern | security_lesson | ux_principle | workflow_optimization | tooling_lesson | deployment_gotcha

Ariel сказал: "первым делом с новым чатом обновить документ Evolution Continued". Это стартовая задача нового чата.

### 2. BUG #1 — CLIENT_DOMAIN без схемы в установщике

**Симптом:** Установщик генерит `.env.local` с `CLIENT_DOMAIN=<host>` без `https://`. OAuth `new URL()` падает → 500 на `/authorize` при попытке Claude.ai коннектора.

**Хотфикс на iam-test уже применён** (через `sed -i`). В source коде `scripts/iam-client.sh` ещё не починено.

**Где фиксить:**
- `scripts/iam-client.sh` step 5 (.env.local generation)
- Найти строку типа `echo "CLIENT_DOMAIN=$DOMAIN"` и заменить на `echo "CLIENT_DOMAIN=https://$DOMAIN"`
- Проверить `NEXT_PUBLIC_CLIENT_DOMAIN` — нужно ли там тоже добавить схему (может использоваться в других контекстах без схемы — проверить usages в коде)
- После фикса: re-sync в skeleton

### 3. "ещё один баг" (некритичный) — Ariel уточнит

Ariel упомянул: "Мне есть еще один баг который надо пофиксить, он совсем не критичный но тем не менее нужно пофиксить". Какой именно — не сказал. В начале сессии спросить его конкретно.

### 4. docs/architecture/ cleanup из skeleton

**Наблюдение Ariel:** `docs/architecture/data/`, `/api/`, `/features/`, `/ui/` — это internal dev docs (описание `lib/data/goals.ts`, карта MCP роутов, и т.д.). Клиенту это не нужно. Делает продукт визуально "сложным".

**Действие:** в `scripts/sync-to-skeleton/MANIFEST.txt` убрать `docs/architecture/*` из COPY-списка. Возможно оставить только высокоуровневый README, который объясняет как работать клиенту (добавить worker, подключить Claude, deploy). Остальное переписать под клиента или удалить целиком.

### 5. Re-sync skeleton

После фиксов — запустить `scripts/sync-to-skeleton/sync.sh` — 173+ файлов sanitize → push в `ArielGrook/iam-client-skeleton`.

### 6. Re-install iam-test

На сервере 185.5.55.111:
```bash
# Snapshot дев
pm2 list  # убедиться что iam-os online
# Удалить старую тестовую установку
pm2 delete iam.iam-test
rm -rf /var/www/iam.test
# Удалить старую skeleton копию
rm -rf /root/skeleton
# Свежий clone + install
git clone https://<PAT>@github.com/ArielGrook/iam-client-skeleton.git /root/skeleton
cd /root/skeleton
bash scripts/iam-client.sh \
  --domain=iam-test.lego-base.online \
  --name="IAM Test" \
  --github-token=<PAT> \
  --path=/var/www/iam.test \
  --port=4742
```

DNS уже настроен (`iam-test.lego-base.online` → 185.5.55.111 через Namecheap), Let's Encrypt сертификат переоформится автоматически.

### 7. Финальная проверка — завершить 11-точечный чек-лист

Неисполненное из `ariel-workflow/INSTALL_TEST_INCIDENT_18_04.md`:
- Пункт 5: **Claude.ai MCP connector end-to-end** (это главное что мы не смогли проверить из-за BUG #2). После реинсталла: Ariel в Claude.ai Settings → Integrations → Add MCP Server → `https://iam-test.lego-base.online/api/mcp` → Bearer token из Admin Panel Settings → должно подключиться без 500, без 401
- Пункт 6: `read_memory` в подключённом коннекторе → вернуть чистые templates (ARCHITECTURE пустой, CURRENT_GOAL "Set up workspace")
- Пункт 7: Add user via Admin → Team → generate token → login to `/dashboard` в инкогнито
- Пункт 10: Push notifications — enable в Dashboard Setup → send message → push arrives
- Пункт 11: Deploy button в Admin → Logs → triggers → entry в `logs/deploy.jsonl`

---

## Параллельный трек — iamrunning.ai разморожен

**НЕ МЕШАЕТ** работе этого чата. Ariel параллельно ведёт там сессию с другим AI (Opus или Cursor).

**Статус:** ROADMAP_17_EXTENDED v3 написан (10 sub-phases 17A.0-9 + 17B + 17C + 17D). Cursor ждёт промпт на 17A.0. Реализация 0%.

**Для нашего чата значимо:**
- iamrunning.ai теперь в `ariel-workflow/iamrunning.ai/` (не в workspace) — папка перенесена 19.04
- MCP-as-a-Service (концепт № 19 в SHARED_CONTEXT) — Phase 2, после 4-5 клиентов IAM Client OS
- Tool distribution для IAM Client OS: `ariel-workflow/iamrunning.ai/TOOL_DISTRIBUTION_SPEC.md` (если нужно будет, читать отдельно)

Всё что касается IAM Client OS — в нашем чате. Если Ariel перескакивает тему на iamrunning.ai — напомни ему что это параллельный трек и уточни, что делать.

---

## Контекст от Ariel (цитаты сессии)

> "Бля, понимаешь, в чем проблема? Ты растягиваешь нахуй очень жестко всю ошибку. Вот напиши мне: чё за ошибка? В чем прикол?"

**Урок:** Ariel хочет КОРОТКО: суть бага → варианты решения → он выбирает. Не растягивать диагностику на несколько сообщений когда можно уместить в 3-5 строк.

> "Соло мод у нас плохо протестирован, его в принципе надо выключить. Ну, можно его не удалять, просто убрать визуальный эффект для смены мода, чтобы можно было только в тим моде работать. Потом будем докручивать соло мод для каких-нибудь малобюджетников."

**Директива:** Solo mode deprecated в UI, код оставлен. В handoff зафиксировать — не трогать solo mode логику полностью, только спрятать toggle.

> "Мало времени. Как можно быстрее закончить все максимально технически, чтобы можно было пиариться."

**Темп:** быстро, прагматично. Не идеально — работоспособно.

---

## Важные контексты

- **Tokens** в чате засвечены (GitHub PAT + MCP токены iam-test). Ariel отложил ротацию "похуй на ротацию токенов, это чисто для локалки". Не напоминать пока сам не попросит — но после первого реального клиента обязательно
- **Subscription deadline:** Claude Max ~неделя, Cursor ~2 недели. Приоритет — планы и roadmaps пока есть инструмент
- **Git snapshot после каждой правки памяти** — MCP injection блокирует операции иначе
- **Dev сервер не трогать** — только iam-test. "iam-os online" в PM2 это dev, снести его = снести test.lego-base.online
- **Deploy validate-only** — реальный deploy через SSH, кнопка в UI только запускает build + pm2 restart

---

## Git state на конец утренней сессии

Последний `git_snapshot` на dev (lego-base):
- `0687b64` — docs: Stage 3 install complete + 2 installer bugs logged (18.04 вечер)
- + новые коммиты сегодня утра с фиксами BUG #2 (Ariel задеплоил)

Не забыть новый git_snapshot если будешь трогать код в первых 10 минутах сессии (иначе MCP блочит write).

---

*Author: Claude Opus 4.7 (19.04.2026, ~09:00-12:15 UTC+3 session). Next chat: start with EVOLUTION update, then BUG #1 fix in installer, then skeleton re-sync + iam-test reinstall + final Claude.ai connector test.*
