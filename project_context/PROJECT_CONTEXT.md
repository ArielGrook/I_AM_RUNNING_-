# I AM RUNNING - Полный контекст проекта
## Последнее обновление: 20.02.2026

---

## О проекте

SaaS платформа для создания сайтов, объединяющая два продукта на общей инфраструктуре:

**Интерактив (Door A)** — пошаговый конструктор (7+ шагов с branching) для масс-маркета
- Выбор темы, цветов, контента через визард
- Генерация contract (структурированные данные)
- Простой интерфейс для непрофессионалов
- Автосборка сайтов из компонентов по тегам

**Редактор (Door B)** — Craft.js визуальный редактор для фрилансеров
- Полная свобода дизайна, drag & drop
- Inline editing через react-contenteditable
- Multi-page поддержка
- Сохранение через lz-string сжатие в Supabase

**Продакшн:** iamrunning.online
**GitHub:** ArielGrook/I_AM_RUNNING_-

---

## Технический стек

| Область | Технология |
|---------|-----------|
| Frontend | Next.js 15, TypeScript, React, Tailwind CSS |
| Visual Editor | Craft.js (custom DnD engine, flat node map) |
| Canvas | React Virtual DOM (не iframe!) |
| Editor State | Craft.js JSON + lz-string compression → Supabase JSONB |
| Inline Editing | react-contenteditable (two-click pattern) |
| Animations | GSAP + ScrollTrigger (только в preview mode) |
| Database | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Email | Resend |
| Deploy | Coolify + PM2 + Nginx на VPS (Hetzner) |
| i18n | next-intl (en, ru, he) |

**ВАЖНО:** GrapesJS удалён из проекта — архитектурно несовместим с React (Backbone.js, iframe canvas). Craft.js — единственный редактор.

---

## Архитектура

### One-Way Ejection
```
Wizard → contract (JSONB) → One-Way Ejection → Craft.js editor → data (JSONB)
         ↑ readonly после editor save
```

### Файловая структура редактора
```
lib/craft/
  components/        Hero, Header, Footer, Features, CTA,
                     Testimonials, Pricing, FAQ,
                     Hero2, Header2 (v2 Dark Red — в разработке)
                     Container, Text, Button, Image,
                     Divider, Video, HtmlBlock, index.ts
  presets/
    index.ts         Пресет "Dark Launch" (полный лендинг)
    animations.ts    6 анимационных пресетов (в разработке)
  icons.tsx          Кастомные SVG иконки

components/craft/
  Toolbar.tsx
  Toolbox.tsx        Коллапсируемые группы Basic/Sections/Navigation
  SettingsPanel.tsx
  RenderNode.tsx     Badge с кнопкой удаления
  Viewport.tsx

app/[locale]/editor/page.tsx   Главный файл редактора
app/api/parser/route.ts        ZIP парсер
public/component-previews/     Скриншоты компонентов (пока пусто)
```

---

## Роль Claude в проекте

Claude — технический архитектор и prompt engineer. **Не пишет код напрямую** — пишет детальные "снайперские промпты" для Cursor, который реализует код. Ариэль принимает все финальные решения и тестирует на продакшне.

**Ключевой принцип промптов:** не "сделай красиво", а точные пиксельные спецификации — градиент от X до Y, font-size clamp(40px, 6vw, 72px), конкретный box-shadow.

---

## Что сделано (production-ready)

### ✅ F01 — Database Schema
8 таблиц: users, projects, components, backend_blocks, payments, freelancer_clients, freelancer_referrals, chat_insights. RLS policies настроены. One-Way Ejection работает.

### ✅ F08 — Dashboard
CRUD проектов, stats карточки, dark mode, i18n (3 языка).

### ✅ F02.5 — Craft.js Editor Core (стабильная база)

**Компоненты v1 (Dark Blue, акцент #FF6B35) — 8 секций:**
- Hero — градиентный фон, сетка из линий, social proof, inline editing заголовка
- Header — sticky, логотип с акцентной первой буквой, nav
- Features — сетка карточек 1/2/3 колонки, иконки в оранжевых кружках
- CTA — оранжевый градиент фон с сеткой
- Footer — трёхколоночные ссылки, социальные иконки
- Testimonials, Pricing (с highlighted карточкой), FAQ
- Базовые: Container, Text, Button, Image, Divider, Video, HtmlBlock

**Редактор — что работает:**
- Сохранение/загрузка: lz-string + Supabase, стабильно
- Preview mode: GSAP + ScrollTrigger, кнопка "Replay"
- Анимации в preview: gsap.fromTo() с immediateRender: false, инициализация только при enabled: false
- Удаление: кнопка корзины в RenderNode badge + красная кнопка в Settings
- Переименование страниц/проекта: двойной клик → inline input
- Clear Canvas: кнопка с confirm диалогом
- Toolbox: коллапсируемые группы, превью картинки на hover
- Пресеты: вкладка в Toolbox, "Dark Launch" загружает полный лендинг
- ZIP парсер: /api/parser + HtmlBlock + кнопка "Import ZIP"

**Редактор — что убрано:**
- Layers panel (убрана полностью)
- Style вкладка (всё в одной Settings панели)
- Delete/Backspace с клавиатуры (было случайное удаление)
- Синий dark mode (заменён на нейтральный #141414/#1a1a1a)

---

## Компоненты v2 — в разработке

**Палитра Dark Red:**
```
Фон:     #0a0a0a / #111111 / #141414
Акцент:  #e11d48
Gradient: linear-gradient(135deg, #e11d48, #dc2626)
```

**Статус:** Header2 — пишется промпт. Остальные 7 компонентов следом.

**Отличия v2 от v1:**
- outline-red-500 вместо outline-orange-500 при выделении
- Полная мобильная адаптация (hamburger в Header2 обязателен)
- colorScheme: 'dark' | 'light' из коробки в каждом компоненте
- accentColor prop для применения color preset

---

## Правила написания компонентов (критично)

### Обязательная структура каждого компонента

```tsx
// 1. useEditor — ТОЛЬКО через деструктуризацию
const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))
// Иначе возвращает Object, а не boolean — анимации не работают

// 2. connect+drag на корневом элементе
<section ref={(ref) => connect(drag(ref))}>

// 3. Выделение
className={isSelected ? 'outline outline-2 outline-orange-500' : ''}
// Для v2: outline-red-500

// 4. data-animate только когда НЕ в редакторе
if (!enabled && animationType !== 'none') {
  animAttrs['data-animate'] = animationType
}

// 5. Throttle
// ContentEditable → 1000ms, input → 500ms, color → 300ms
```

### tokens объект (обязателен в каждом компоненте)

```tsx
const tokens = {
  dark:  { bg, bgSecondary, text, textSecondary, accent, border, cardBg },
  light: { bg, bgSecondary, text, textSecondary, accent, border, cardBg },
}
const t = tokens[colorScheme]
// Везде t.bg, t.text — никакого хардкода цветов
```

### Props у каждого компонента

```tsx
colorScheme: 'dark' | 'light'   // обязателен
accentColor: string              // обязателен (для color preset)
animationType: string            // обязателен (default: 'none')
animateDelay: string             // обязателен (default: '0')
```

### .craft объект (полный)

```tsx
Component.craft = {
  displayName: 'Human Name',
  props: { /* все props с дефолтами */ },
  related: { settings: ComponentSettings },
  custom: {
    styleTags: [],    // из 12 стилей F02: dark, minimal, elegant, bold...
    businessTags: [], // из 16 типов F02: startup, saas, agency...
    featureTags: [],  // hero, cta, pricing, header, footer...
    supportsTheme: true,
    supportsColorPreset: true,
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,  // секции не принимают children
  },
}
```

### На корневом JSX элементе

```tsx
<section
  data-block-type="hero"
  data-block-category="header"
  ...
>
```

**Почему теги критичны:** Door A делает SQL запрос `WHERE 'hero' = ANY(feature_tags)` — без тегов компонент невидим для wizard и никогда не попадёт в автосборку.

### Mobile-first обязателен

```tsx
// НЕЛЬЗЯ — ломает responsive:
style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}

// НУЖНО:
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold"
className="px-4 sm:px-6 md:px-8 lg:px-16 py-12 md:py-20"
```

---

## Дизайн-система редактора

```
Акцент платформы:     #FF6B35
Фон редактора:        #141414 / #1a1a1a / #1f1f1f
Панели:               #1a1a1a / #1f1f1f
Borders:              #2a2a2a
```

---

## Две официальных темы компонентов

**v1 — Dark Blue (существующие):**
```
Фон:    #0f172a / #0a0f1e / #020617
Акцент: #FF6B35
```

**v2 — Dark Red (новые):**
```
Фон:    #0a0a0a / #111111 / #141414
Акцент: #e11d48
```

---

## Color Preset (применяется ко всему сайту)

```tsx
const applyColorPreset = (accentHex: string) => {
  const nodes = query.getSerializedNodes()
  Object.keys(nodes).forEach(id => {
    if (id === 'ROOT') return
    actions.setProp(id, (props) => {
      props.accentColor = accentHex
    })
  })
}
```

6 кружков в Toolbar → один клик → весь сайт меняет акцентный цвет.

---

## Animation Presets (в разработке)

6 пресетов (из F02): None, Subtle, Elegant, Dynamic, Playful, Corporate, Bold, Smooth, Tech, Cinematic.
Кнопка "Animate" в Toolbar → итерация всех нод → применяет animationType + animateDelay с задержкой по индексу секции.

---

## Известные проблемы (актуальные)

1. **Inline editing на светлом фоне** — ContentEditable текст становится белым на белом. Нужен `color: inherit`. Низкий приоритет.
2. **ZIP парсер** — эвристики не парсят все блоки. Низкий приоритет.
3. **Responsive breakpoints в редакторе** — viewport меняет ширину канвы, но компоненты не адаптируют props. Большая архитектурная задача, после стабилизации.
4. **Превью картинки компонентов** — папка public/component-previews/ пустая, нужны скриншоты.
5. **Multiple GoTrueClient instances** — предупреждение в консоли, не критично.

---

## Приоритеты прямо сейчас

1. ✅ Preview mode визуальный баг — **РЕШЕНО** (GSAP immediateRender: false + gsap.fromTo())
2. 🔄 Header2 — пишется промпт для Cursor
3. 📋 Hero2, Features2, CTA2, Footer2, Testimonials2, Pricing2, FAQ2
4. 📋 Color Preset в Toolbar
5. 📋 Animation Presets в Toolbar
6. 📋 Новые компоненты: About, Stats, Team, Services, Contact Form
7. 📋 Превью картинки 16 компонентов

---

## Workflow разработки

**Инструменты:**
- Claude — архитектура, снайперские промпты для Cursor
- Cursor — реализация кода по промптам
- Windsurf — системные аудиты (дорого, только при необходимости)

**Формат промптов для Cursor:**
```
[ЦЕЛЬ], [ФАЙЛЫ], [ВИЗУАЛЬНАЯ СПЕЦИФИКАЦИЯ],
[PROPS], [SETTINGS], [.craft ОБЪЕКТ],
[ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ], [ACCEPTANCE CRITERIA], [CRITICAL]
```

**Короткие сфокусированные промпты — одна задача за раз.**

---

## Git правила

```bash
# НИКОГДА:
git add .
git add -A

# ВСЕГДА:
git add -u                          # только изменённые
git diff --cached --name-only       # проверить перед коммитом
git commit -m "feat(components): add Header2 with mobile menu"
git push origin main
```

---

## Оценка времени до запуска

При 4-5 часах/день — **май-июнь 2026**.

| Этап | Статус |
|------|--------|
| F01 Database | ✅ |
| F08 Dashboard | ✅ |
| F02.5 Craft.js Editor | 🔄 стабилизация |
| F03 Component Library (v1+v2) | 🔄 в работе |
| F04 Backend Blocks | 📋 |
| F05 Assembler | 📋 |
| F07 Interactive Wizard | 📋 |
| F14-F16 Оплата | 📋 |
| F17 Coolify Deploy | 📋 |
| F18 Security | 📋 |
| F20 AI Chat | 📋 |
