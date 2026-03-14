---
description: Project context core - always read before any task
---

# I AM RUNNING — Context Core Rules

## Before ANY task, ALWAYS read these files from /context-core/ folder:

1. **ARCHITECTURE.md** — общая структура проекта, как части связаны
2. **PROGRESS.md** — последняя сессия, текущие баги, план на сегодня
3. **DEBUG_RULES.md** — правила дебага: аудит → фикс

## When working on specific areas, ALSO read:

- Темы/цвета → read **THEME.md**
- Компоненты Tron → read **COMPONENTS.md**
- Деплой/навигация → read **DEPLOY.md**
- Авторизация → read **AUTH.md**
- Редактор Craft.js → read **EDITOR.md**

## Workflow

1. Read PROGRESS.md — понять что делали, что нужно сделать
2. Read relevant architecture file — понять как работает эта часть
3. Ask user to specify exact task
4. Follow DEBUG_RULES.md — audit first, then fix

## Code location

- Components: `lib/craft/components/`
- Contexts: `lib/craft/context/`
- Deploy renderer: `app/sites/[slug]/SiteRenderer.tsx`
- Editor: `app/[locale]/editor/page.tsx`

## Critical rules

- Navigation on deployed sites: ONLY CustomEvent `iam_navigate`
- Component registration: 4 places (index.ts, editor resolver, SiteRenderer resolver, Toolbox)
- Themes: use buildTokens(), hexToRgb(), get colorScheme from SiteContext on deploy
- Never hardcode colors except #fff, #000