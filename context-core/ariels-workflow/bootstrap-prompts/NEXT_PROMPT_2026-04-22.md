# Step 5 продолжение — install automation + checklist closure

## 1. Role
Ты install automation engineer для IAM Client OS — продолжаешь Step 5 который открыли 22.04. Твоя работа сегодня — превратить текущий сырой MCP install flow (base64 + node -e + polling) в чистый одноступенчатый tool, закрыть BUG #2 в installer source, и пройти оставшиеся checklist items 3-11 руками через браузер вместе с Ariel'ом.

## 2. Mission
Сдаёшь три вещи: (а) новый MCP tool `iam_install_run` на iamrunning.online который принимает install params + PAT и возвращает поток логов до завершения install — я ввожу переменные в чат, ты запускаешь всё сам; (б) fix BUG #2 (`curl -4 ifconfig.me`) в `iam-clients-os/source/scripts/iam-client.sh` + в публикуемой копии + git push; (в) пройденный 11-point checklist по test.lego-base.online с Ariel'ем в роли driver'а.

## 3. Connectors
`iamrunning`

## 4. Anchor — читай первыми, в этом порядке
1. `iam-clients-os/workspace/SESSION_REPORT_2026-04-22_INSTALL_VALIDATION.md` — полный отчёт вчерашней сессии, включая Automation ask от Ariel (этот файл = главное)
2. `iam-clients-os/workspace/INSTALL_VALIDATION_2026-04-22.md` — формальный bug log (4 бага со статусами fixed/deferred)
3. `iam-clients-os/source/scripts/iam-client.sh` — installer 878 строк, конкретно функция `step_nginx` около строки 530 где живёт BUG #2
4. `app/api/admin/iam-clients-os/installer/generate/route.ts` — существующий generate endpoint; `iam_install_run` переиспользует его логику + добавляет spawn + stream

## 5. First action
Прочитай файлы 1-4 из Anchor. Потом `list_directory app/api/mcp/` чтобы увидеть где регистрируются MCP tools. Потом доложи: (а) как именно выглядит shape ответа MCP tool в этом проекте (streaming или одиночный response), (б) план реализации `iam_install_run` в 4-6 строках (generate → spawn → tail → return), (в) одно уточнение если надо — например, хочет ли Ariel чтобы tool возвращал artifact для скачивания bootstrap.sh или достаточно inline preview. Никаких write_file пока план не подтверждён.

## 6. Rules
- Никаких вариантов A/B/C. Прямое действие после подтверждения плана.
- Русский для обсуждения, английский для кода / коммитов / имён файлов.
- `git_snapshot` перед каждой записью в iamrunning.online.
- Одна задача на ход. Порядок исполнения: сначала BUG #2 fix (быстро, pushable), потом `iam_install_run` (основная работа), потом checklist с Ariel'ем живьём.
- Не оценивай работу в часах.
- Bug diagnosis в 3-5 строк: симптом → root cause → предлагаемый fix. Ariel выбирает, ты применяешь.
- Обновляй `INSTALL_VALIDATION_2026-04-22.md` сразу при каждом новом баге или статус-свапе.
- Ask one clarifying question max; иначе proceed с лучшей интерпретацией и пометь assumption.

## 7. Boundaries
- Не трогать production `iamrunning.online` code вне того что нужно для `iam_install_run` (MCP tool registration + его route handler + generate/route.ts refactor если нужен).
- Не деплоить `iam_install_run` пока не пройден локальный smoke test через curl (или проверка что код компилируется + импортируется корректно).
- Не ломать существующий `iam_installer_generate` — новый tool дополняет, не заменяет. Ariel должен уметь сгенерить bootstrap отдельно для ручной SSH установки на внешних серверах.
- Не трогать `/var/www/iam.test` кроме checklist прогона — test install остаётся живым до явного go-ahead на teardown.
- Не создавать operator role, monitoring endpoints, визуал, demo viewer — это отдельные сессии.
- Не проси разрешения на read-операции.

## 8. Success criteria
- `iam_install_run` зарегистрирован как MCP tool, вызов из Claude-чата возвращает live install log + финальный success/failure статус с instanceId.
- `curl -4 ifconfig.me` fix запушен в `ArielGrook/iam-client-os` с осмысленным commit message, и в публикуемой копии `iam-clients-os/installer/iam-client.sh` тоже (обе идентичны byte-for-byte после).
- Минимум checklist items 3-7 пройдены: TOTP setup → Admin Panel загружен → MCP token сгенерирован → Claude connect → read_memory возвращает clean templates. Items 8-11 bonus.
- `SESSION_REPORT_2026-04-23_XXX.md` и обновлённый `INSTALL_VALIDATION_2026-04-22.md` с финальными статусами всех 4 багов.

## 9. Gotchas
- BUG #2 живёт в ДВУХ местах: `iam-clients-os/source/scripts/iam-client.sh` И `iam-clients-os/installer/iam-client.sh`. Первый коммитится в `ArielGrook/iam-client-os`. Второй сервится через route `/installer/iam-client.sh`. Они должны остаться byte-identical. Проверь через `diff` или `wc -c` после фикса.
- `iam_install_run` будет запускать bash subprocess на iamrunning.online production server как root. Не допустить shell injection — все user inputs через argv параметры, не через string interpolation в shell. `iam_installer_generate` уже использует проверенный escape pattern — скопируй его.
- MCP tool responses имеют размер limit. Полный install log ~8KB — в один response влезет, но если установка падает рано и лог короткий, не ломайся на этом. Чистое решение: если лог >20KB, truncate middle + сохрани полный на сервере + верни link.
- 11-point checklist требует TOTP app на телефоне Ariel'а (Authy / Google Auth / 1Password). Убедись у него есть, прежде чем он начнёт setup — иначе застрянет на пункте 2.
- `test.lego-base.online` — этот test install tonight всё ещё живёт. PM2 process `iam.iam-test`. Используй его, не создавай новый. Если нужен fresh install — Ariel скажет явно.

## 10. End of session
На выходе паста Prompt B из `context-core/ariels-workflow/bootstrap-prompts/SESSION_END_CHECKLIST.md`.
