# COMPONENT WRITING RULES — I AM RUNNING
## Правила для всех компонентных семейств

---

## ФИЛОСОФИЯ

Каждый компонент — премиальный. Без исключений.
Минимализм не значит статично. Любой компонент должен иметь хотя бы одну анимированную механику.
Чем больше движения, света и тактильности — тем лучше.
Именно это отличает платформу от конкурентов.

---

## 1. РЕГИСТРАЦИЯ — ОБЯЗАТЕЛЬНО В ЧЕТЫРЁХ МЕСТАХ

Компонент не работает на деплое если добавлен не везде.

| Файл | Зачем |
|------|-------|
| `lib/craft/components/index.ts` | экспорт |
| `app/[locale]/editor/page.tsx` | resolver редактора |
| `app/sites/[slug]/SiteRenderer.tsx` | resolver деплоя ← часто забывают |
| `components/craft/Toolbox.tsx` | появление в панели |

**Добавил в editor — сразу добавь в SiteRenderer. Всегда.**

---

## 2. МЕТА-ТЕГИ — МАТЧИНГ DOOR A

Door A (Интерактив) автоматически подбирает компоненты по JSON контракту через теги.
Без правильных тегов компонент не появится в автосборке сайтов.

### block_type — одно значение, тип секции
```
header | hero | about | services | portfolio | stats | team | features |
faq | pricing | cta | footer | contact | newsletter |
login | register | forgot_password | email_confirmation | profile_settings |
product_card | product_page | catalog | cart | checkout | order_confirmation |
user_dashboard | admin_panel
```

### style_tags[] — визуальный характер компонента
```
clear | dark | neon_futuristic | minimal | elegant | bold |
soft | corporate | creative | playful | brutalist | glassmorphism
```

### business_tags[] — типы бизнеса которым подходит
```
food | shop | ecommerce | startup | business_card | portfolio |
craft | beauty | health | education | agency | consulting |
blog | event | real_estate | travel
```

### feature_tags[] — функциональные особенности
```
hero | features | pricing | faq | cta | stats | testimonials |
portfolio | contact | newsletter | auth | ecommerce | dashboard | admin
```

### Алгоритм матчинга (Fallback Chain):
1. Точное совпадение: block_type + variant_name
2. business_tags + style_tags match
3. Только business_tags match
4. DEFAULT — `variant_name: 'default'` должен существовать всегда

### Пример:
```tsx
ComponentName.craft = {
  custom: {
    block_type: 'features',
    variant_name: 'cards-dark',
    style_tags: ['dark', 'minimal'],
    business_tags: ['startup', 'agency', 'consulting'],
    feature_tags: ['features'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  }
}
```

---

## 3. СИСТЕМА ТЕМ

Каждый компонент читает `colorScheme` ('dark'|'light') и `accentColor` из ThemeContext.
Переключение темы обновляет компонент автоматически — никаких своих кнопок смены темы внутри компонента.

### buildTokens — копировать, не изобретать
```tsx
function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark:  { bg: darkBg,  text: '#ffffff', textSecondary: 'rgba(255,255,255,0.6)',
             cardBg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
             gridColor: 'rgba(255,255,255,0.03)' },
    light: { bg: lightBg, text: '#0a0a0a', textSecondary: 'rgba(0,0,0,0.6)',
             cardBg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.08)',
             gridColor: 'rgba(0,0,0,0.04)' },
  }
}
const t = buildTokens(darkBg, lightBg)[colorScheme]
```

### hexToRgb — обязателен в каждом файле
```tsx
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}
// Использование:
background: `rgba(${hexToRgb(accentColor)}, 0.1)`
```

**Запрещено:** хардкодить любые цвета кроме абсолютно нейтральных (#fff, #000) и иконок брендов (Google и т.п.).

---

## 4. МОБИЛЬНАЯ АДАПТИВНОСТЬ — ТОЛЬКО ResizeObserver

### Порог: 520px (не 768, не 640)
При открытии правой Settings Panel канва сужается.
768px даёт ложный триггер "мобиль" при открытии панели настроек.

```tsx
const containerRef = React.useRef<HTMLElement>(null)
const [isMobile, setIsMobile] = React.useState(false)

React.useEffect(() => {
  const el = containerRef.current
  if (!el) return
  const check = () => setIsMobile(el.getBoundingClientRect().width < 520)
  check()
  const observer = new ResizeObserver(([e]) => setIsMobile(e.contentRect.width < 520))
  observer.observe(el)
  return () => observer.disconnect()
}, []) // СТРОГО пустой массив — иначе isMobile сбрасывается при смене темы
```

**Запрещено:** Tailwind breakpoints (md:, lg:), window.innerWidth, CSS media queries.

### Правило двух канв

Редактор имеет Desktop и Mobile канвы — два отдельных пространства, связанных только общим стилем.

**Каждый компонент обязан иметь два layout-состояния:**

| Desktop (isMobile: false) | Mobile (isMobile: true) |
|--------------------------|------------------------|
| Горизонтальный layout | Вертикальный layout |
| flex row / grid columns | flex column |
| Большие отступы | Компактные отступы |
| Многоколоночный контент | Однострочный контент |

```tsx
<div style={{
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',
  gap: isMobile ? 12 : 24,
}}>
```

Горизонтальный на десктопе → вертикальный на мобиле. Без исключений.
Проверять в редакторе кнопкой 375px перед каждым коммитом.

---

## 5. JS МЕХАНИКИ — СТАНДАРТ КАЧЕСТВА

JS не опция — это основной инструмент качества.
CSS даёт переходы. JS даёт физику, 3D, реакцию на пользователя.

### Доступные библиотеки (уже в проекте или подключаются через npm):

| Библиотека | Применение |
|-----------|-----------|
| **GSAP + ScrollTrigger** | Базовый минимум. Анимации при скролле, пин-секции, stagger. Уже подключён. |
| **Three.js** | 3D сцены, вращающиеся объекты, частицы, шейдеры. Для Hero, Portfolio, About. ⚠️ Только один Three.js компонент на страницу — браузеры лимитируют WebGL контексты (8-16 максимум). Несколько 3D компонентов на одной странице = краш. |
| **Canvas API** | Генеративные фоны, кастомные эффекты, без внешних зависимостей. |
| **Lottie** | After Effects анимации в браузере. Для иллюстративных секций. |

### Cursor-реактивные механики (реакция на мышь):
- Spotlight — свечение следует за курсором
- Magnetic buttons — кнопки притягиваются к курсору
- Parallax на mousemove — глубина при движении мыши
- Tilt effect — наклон карточек

### Правила подключения JS в компоненте:
```tsx
React.useEffect(() => {
  // 1. Проверка SSR
  if (typeof window === 'undefined') return

  // 2. Инициализация (GSAP, Three.js и т.д.)
  const animation = gsap.to(...)

  // 3. ОБЯЗАТЕЛЬНЫЙ cleanup — иначе утечки памяти
  return () => {
    animation.kill()
    // renderer.dispose() для Three.js
  }
}, []) // зависимости по необходимости
```

---

## 6. EDITABLETEXT

```tsx
import { EditableText } from '../shared/EditableText' // ТОЛЬКО отсюда, нигде больше

<EditableText
  value={title ?? ''}
  tag="h2"
  style={{ color: t.text }}
  enabled={enabled}
  onSave={(val) => setProp((p: Record<string,unknown>) => { p.title = val }, 0)}
/>
```

**Оборачивать:** заголовки, subtitle, body текст, CTA кнопки, brand name, copyright, названия карточек.
**НЕ оборачивать:** числа и цены, иконки SVG, счётчики count-up, URL поля.

---

## 7. МЕДИА — ЧЕРЕЗ MEDIA LIBRARY

Изображения загружаются в Supabase Storage через Media Library.
В props компонента хранится только URL — не base64, не File объект.

**Почему не base64:** Craft.js сохраняет полный снимок props при каждом Undo/Redo.
10 фото × 5MB base64 = 50MB в памяти = краш вкладки.

```tsx
// Settings Panel — кнопка открывает Media Library
import { MediaLibrary } from '@/components/craft/MediaLibrary'
import { useAuth } from '@/lib/hooks/useAuth'

const { user } = useAuth()
const [showMedia, setShowMedia] = React.useState<number | null>(null)

<button onClick={() => setShowMedia(i)}>
  {item.imageUrl ? '↺ Заменить' : '+ Добавить фото'}
</button>

{showMedia === i && user && (
  <MediaLibrary
    userId={user.id}
    accept="image"
    onSelect={(url) => {
      setProp((p) => { p.items[showMedia!].imageUrl = url }, 0)
      setShowMedia(null)
    }}
    onClose={() => setShowMedia(null)}
  />
)}

// В компоненте — fallback для старых данных:
<img src={item.imageUrl ?? item.imageBase64} />
```

---

## 8. HOVER КАРТОЧЕК

```tsx
const [hovered, setHovered] = React.useState<number | null>(null)

onMouseEnter={() => !enabled && setHovered(i)} // !enabled — в редакторе hover отключён
onMouseLeave={() => setHovered(null)}

style={{
  transform: hovered === i ? 'translateY(-4px)' : 'translateY(0)',
  boxShadow: hovered === i
    ? `0 16px 48px rgba(${hexToRgb(accentColor)}, 0.15)`
    : 'none',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
}}
```

⚠️ При 20+ элементах (большие галереи, портфолио) setState на hover вызывает ре-рендер всего компонента при каждом движении мыши — возможен микрофриз. Для таких случаев использовать чистый CSS `:hover` + `group-hover:` классы Tailwind вместо state.

---

## 9. CRAFT ОБЪЕКТ — ПОЛНАЯ СТРУКТУРА

```tsx
ComponentName.craft = {
  displayName: 'Component Name',
  props: {
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 80,
    title: 'Section Title',
    subtitle: 'Subtitle text.',
    animationType: 'none',
    animateDelay: '0',
    // ...специфичные пропсы
  },
  related: { settings: ComponentNameSettings },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
  },
  custom: {
    block_type: 'features',
    variant_name: 'default',
    style_tags: ['dark', 'minimal'],
    business_tags: ['startup', 'agency'],
    feature_tags: ['features'],
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
}
```

---

## 10. АНИМАЦИИ

```tsx
// Поддерживаемые типы:
animationType: 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'bounce'

// На контентном div, НЕ на корневом section:
<div
  data-animate={animationType !== 'none' ? animationType : undefined}
  data-animate-delay={animateDelay}
  style={{ position: 'relative', zIndex: 1 }}
>
```

### CSS анимации для каруселей и loops:
```tsx
React.useEffect(() => {
  const styleId = 'component-name-animations'
  if (document.getElementById(styleId)) return
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes scrollLeft {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `
  document.head.appendChild(style)
  return () => { document.getElementById(styleId)?.remove() }
}, [])
```

---

## 11. SETTINGS PANEL

### Порядок секций (строго):
1. CONTENT — title, subtitle, основной текст
2. LAYOUT — layoutStyle, columns, cardStyle
3. ITEMS — редактируемые элементы списка
4. COLORS — darkBg, lightBg color picker
5. SIZE — sectionHeight слайдер 40-100
6. DISPLAY — toggles (showGrid и т.п.)
7. ANIMATION — animationType + animateDelay

### Стили:
```tsx
const labelCls = "block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5"
const inputCls = "w-full px-3 py-2 rounded-md text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-orange-500 mb-3"
// Кнопка + Add:  color '#FF6B35', fontWeight 600
// Кнопка Remove: color '#f87171'
// Item cards:    background 'rgba(255,255,255,0.04)', border '1px solid rgba(255,255,255,0.08)'
```

---

## 12. TRON-СПЕЦИФИЧНЫЕ МЕХАНИКИ

Эти паттерны относятся только к Tron семейству.
Другие семейства компонентов имеют свои механики.

### Grid фон
```tsx
// key={colorScheme} ТОЛЬКО на grid div — перемонтирует его при смене темы
<div key={colorScheme} style={{
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
  backgroundImage: showGrid
    ? `linear-gradient(${t.gridColor} 1px, transparent 1px),
       linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
    : 'none',
  backgroundSize: showGrid ? '50px 50px' : 'auto',
}} />
// Контент — position relative, zIndex 1
```

### Spotlight (TBD — будет добавлен в меню механик отдельно)

---

## 13. ЗАПРЕЩЕНО

```
❌ localStorage / sessionStorage — краш при SSR
❌ window.* без проверки typeof window !== 'undefined'
❌ Хардкодить цвета вне buildTokens
❌ base64 для изображений в props
❌ Tailwind breakpoints (md:, lg:) для адаптивности
❌ useEffect с зависимостями кроме [] в ResizeObserver
❌ key={colorScheme} на корневом section — только на специфичных div
❌ CustomEvent для создания страниц — только PagesContext
❌ EditableText импортировать не из ../shared/EditableText
❌ Статичные компоненты без единой анимации
```

---

## 14. ЧЕКЛИСТ ПЕРЕД КОММИТОМ

```
□ Зарегистрирован в editor/page.tsx resolver?
□ Зарегистрирован в SiteRenderer.tsx resolver?
□ Добавлен в index.ts и Toolbox.tsx?
□ block_type, style_tags, business_tags, feature_tags заполнены?
□ variant_name уникален и есть 'default' вариант?
□ isMobile: горизонтальный layout → вертикальный при <520px?
□ Проверено на 375px в редакторе?
□ Есть хотя бы одна анимированная механика?
□ colorScheme и accentColor из ThemeContext — нет хардкода цветов?
□ JS useEffect имеет cleanup функцию?
□ Нет TypeScript ошибок?
```
