# IAMRUNNER.AI → IAMRUNNING.AI — Desktop Client
*Продукт платформы I AM RUNNING | Версия: 1.1 | Обновлён: 08.04.2026*

> **⚠️ Это не отдельный бизнес.** iamrunner.ai — десктоп клиент платформы I AM RUNNING. Переименуется в **iamrunning.ai** когда будут все функции платформы.

---

## Что это

Electron приложение. Три ключевые возможности:
1. **Локальный MCP сервер** — Claude читает/пишет локальные файлы через Cloudflare tunnel бесплатно
2. **Workspace клиент** — подключается к iam-client-os (задачи, PR, сообщения)
3. **Локальный AI** — Ollama + Qwen2.5-Coder, offline, без ограничений

**Killer insight:** Claude.ai + MCP коннектор = Claude работает с локальными файлами через существующую подписку. Без API ключей.

---

## Техстек

- Electron 33, React 18, Tailwind, Zustand, CodeMirror 6
- MCP SDK, Ollama, Qwen2.5-Coder:7b, nomic-embed-text
- cloudflared — Cloudflare Named Tunnel
- **Туннель:** iamrunner-ai.iamrunning.online (DNS Only!)

**Запуск:**
```
Terminal 1: cloudflared tunnel run iamrunner
Terminal 2: cd iamrunner-ai && npm run dev
Приложение: Start Server
```

---

## Knowledge Base — ключевая фича (NotebookLM для fine-tune)

Отдельный главный экран (не Settings). Пользователь накапливает Q&A датасет о проекте:

```
Пустой → [Загрузить документ] [Создать с AI]
    ↓
Накопление: ████████░░ 80% | 847 Q&A пар
    ↓
Порог достигнут → [Fine-tune за $49]
    ↓
Готово → [Скачать LoRA ($99-199)]
```

**Монетизация:**
- RAG — включено в подписку
- Fine-tune на наших серверах — $49
- Экспорт LoRA адаптера — $99-199
- Ускорение датасета — $29

**Retention:** прогресс-бар — вложил данные, не уйдёт.

---

## Статус (08.04.2026)

| Что | Статус |
|-----|--------|
| Electron App, 10 экранов | ✅ |
| Local MCP Server, OAuth PKCE | ✅ |
| Cloudflare Named Tunnel | ✅ |
| Ollama + qwen2.5-coder:7b + nomic-embed-text | ✅ |
| AI Chat (Claude API + Ollama), streaming | ✅ |
| Cursor MCP OAuth fix | 🔄 |
| RAG (Vectra + AST chunking) | ⏸️ Следующий |
| Knowledge Base экран | ⏸️ Следующий |
| Fine-tune pipeline | ⏸️ Планируется |

---

## Cursor MCP Workaround

```json
{
  "mcpServers": {
    "iamrunner-ai": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest",
               "https://iamrunner-ai.iamrunning.online/mcp",
               "--header", "Authorization: Bearer TOKEN"]
    }
  }
}
```
Токен в `mcp-token.txt`.

---

## Бизнес-модель

| | Веб-версия | Локальная (Desktop) |
|-|------------|---------------------|
| Entry | $0 | **$1k+ first-time fee** |
| Ongoing | $200-500/mo | $100-200/user/mo |
| AI | Наши серверы | Ollama локально |
| Данные | Облако | 100% локально |
| Ограничения | Да | Нет (Ollama) |

**Апсейл путь:** веб → локальная через 3-6 мес.

---

## Cursor API стратегия

```
Opus A → архитектурный план
Opus B → ревью
Sonnet (Extended) → мастермайнд + декомпозиция для Cursor
Cursor → исполнение через MCP (не думает, только делает)
```

Текущий остаток Cursor API: ~66%. Беречь — давать только точные задачи.

---

## Ключевые уроки

- Per-session McpServer обязателен (один сервер = один transport)
- Cloudflare DNS Only для MCP — Proxy ломает OAuth
- Qwen 7B tool calling нестабилен → system prompt injection
- RAG приоритетнее fine-tune: 80% пользы при 0% затрат
