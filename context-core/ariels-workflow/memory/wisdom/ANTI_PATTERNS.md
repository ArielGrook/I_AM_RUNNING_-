# WISDOM: Anti-Patterns — IAM Client OS

Вещи которые ломаются. Пиши сюда когда находишь баг caused by паттерн.
Формат: **что случилось** → что не делать → что делать вместо.

---

## API / Data Layer

**loadSettings не экспортируется из @/lib/data:**
Произошло: dev-ai-handler.ts импортировал loadSettings → TypeScript error при билде.
Не делай: import { loadSettings } from '@/lib/data'
Делай: читай data/settings.json напрямую через readFile или через shared.ts из admin

**Dashboard route: conversationId vs id:**
Произошло: loadConvoMsgs передавал {id} но API ждёт {conversationId} → пустой массив.
Не делай: dashApi(token, 'conversation-messages', { id })
Делай: dashApi(token, 'conversation-messages', { conversationId: id })

**Отправка DM через dashboard:**
Произошло: action 'messages-send-chat' не существует в dashboard route.
Не делай: dashApi(token, 'messages-send-chat', ...)
Делай: dashApi(token, 'send-chat-message', ...)

---

## File Tree / Security

**Системные файлы видны всем через Dev Console:**
Произошло: reviewer мог читать app/admin/*, lib/* — весь код платформы.
Не делай: показывать всё дерево без фильтрации
Делай: filterByAccess() + isSystemCodeDir() скрывают app/, lib/ для всех

**Хардкод имён Gemini моделей:**
Произошло: gemini-2.0-flash → 404. gemini-1.5-pro → 404. gemini-2.5-flash-preview → 404.
Не делай: хардкодить имена без проверки через ListModels API
Делай: проверяй через /v1beta/models?key=... перед хардкодом

---

## TypeScript

**`string[] | null` не assignable to `string[]`:**
Произошло: loadCustomHiddenPaths() возвращал null в некоторых ветках.
Не делай: return _customHidden (если тип `string[] | null`)
Делай: return _customHidden ?? []

**tsx файлы в pull-pool/:**
Произошло: .tsx файлы в pull-pool/ компилируются Next.js → TypeScript ошибки.
Не делай: называть pull-pool файлы .tsx
Делай: .ts или .txt для предложенного кода

---

## UI / Dark Mode

**onMouseEnter/Leave не реагируют на тему:**
Произошло: hover эффекты используют хардкодные '#f5f5f5' в темной теме.
Не делай: e.currentTarget.style.background = '#f5f5f5'
Делай: e.currentTarget.style.background = isDark ? '#1a1a1a' : '#f5f5f5'

**ProfileEditor получает isDark:**
Произошло: ProfileEditor поддерживал isDark, но prop не передавался из Settings.
Не делай: забывать передавать isDark в дочерние компоненты
Делай: проверяй цепочку props при добавлении dark mode
