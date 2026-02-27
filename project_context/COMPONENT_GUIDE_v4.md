# COMPLETE GUIDE — TRON COMPONENTS v4
## Источник истины для разработки компонентов редактора I AM RUNNING

---

## АРХИТЕКТУРА

### Что такое Tron компонент
Каждый Tron компонент — это самодостаточный Craft.js нод.
Он содержит: рендер, Settings панель, craft объект с метаданными.
Компоненты регистрируются в resolver и появляются в Toolbox редактора.

### Файловая структура
```
lib/craft/
├── components/
│   ├── TronStats.tsx          ← эталон токенов и структуры
│   ├── TronContact.tsx        ← эталон ResizeObserver и darkBg/lightBg
│   ├── TronFAQ.tsx
│   ├── TronFeatures.tsx
│   ├── TronFooter.tsx
│   ├── TronPortfolio.tsx
│   ├── TronPricing.tsx
│   ├── TronShowcase.tsx
│   ├── TronTestimonials.tsx
│   ├── HeroTron.tsx
│   └── HeaderTron.tsx
├── shared/
│   └── EditableText.tsx       ← общий хелпер редактирования текста
└── resolver.tsx               ← регистрация всех компонентов
```

---

## СИСТЕМА ТЕМ

### ThemeContext
Редактор передаёт colorScheme ('dark'|'light') и accentColor через контекст.
Компонент читает их через useEditor или ThemeContext.

### Tokens объект — ОБЯЗАТЕЛЬНО копировать из TronStats
```tsx
function buildTokens(darkBg: string, lightBg: string) {
  return {
    dark: {
      bg: darkBg,
      text: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.6)',
      cardBg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
      gridColor: 'rgba(255,255,255,0.03)',
    },
    light: {
      bg: lightBg,
      text: '#0a0a0a',
      textSecondary: 'rgba(0,0,0,0.6)',
      cardBg: 'rgba(0,0,0,0.03)',
      border: 'rgba(0,0,0,0.08)',
      gridColor: 'rgba(0,0,0,0.04)',
    },
  }
}

// Использование:
const t = buildTokens(darkBg, lightBg)[colorScheme]
```

### hexToRgb — ОБЯЗАТЕЛЬНО в каждом файле
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

---

## РЕЗИНОВАЯ АДАПТИВНОСТЬ

### ResizeObserver — ЕДИНСТВЕННЫЙ способ определять мобиль
```tsx
const containerRef = React.useRef<HTMLElement>(null)
const [isMobile, setIsMobile] = React.useState(false)

React.useEffect(() => {
  const el = containerRef.current
  if (!el) return
  
  const checkWidth = () => {
    setIsMobile(el.getBoundingClientRect().width < 520)
  }
  
  checkWidth()  // вызвать сразу при монтировании
  
  const observer = new ResizeObserver(([entry]) => {
    setIsMobile(entry.contentRect.width < 520)
  })
  observer.observe(el)
  return () => observer.disconnect()
}, [])  // СТРОГО пустой массив
```

**Threshold 520px** — не 768, не 640. Именно 520.
Почему: при открытии правой Settings Panel канва сужается.
768 даёт ложный триггер "мобиль" при открытии панели.

**Запрещено:**
- Tailwind breakpoints (md:, lg:) — не работают для ResizeObserver
- Любые зависимости в useEffect кроме [] — сбрасывают isMobile при смене темы

---

## GRID СИСТЕМА

### Правильная реализация
```tsx
<section
  ref={(ref) => ref && connect(drag(ref as HTMLElement))}
  style={{
    position: 'relative',         // ОБЯЗАТЕЛЬНО
    background: t.bg,
    minHeight: `${sectionHeight}vh`,
    // НЕТ backgroundImage здесь
  }}
>
  {/* Grid div — ОТДЕЛЬНЫЙ, key={colorScheme} */}
  <div
    key={colorScheme}             // перемонтируется при смене темы → grid обновляется
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: showGrid
        ? `linear-gradient(${t.gridColor} 1px, transparent 1px),
           linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
        : 'none',
      backgroundSize: showGrid ? '50px 50px' : 'auto',
      pointerEvents: 'none',      // ОБЯЗАТЕЛЬНО
      zIndex: 0,
    }}
  />
  
  {/* Контент */}
  <div
    data-animate={animationType !== 'none' ? animationType : undefined}
    style={{ position: 'relative', zIndex: 1 }}  // ОБЯЗАТЕЛЬНО
  >
    {/* ... */}
  </div>
</section>
```

**Почему так:** key={colorScheme} на section ремонтирует весь компонент → сбрасывает isMobile.
key={colorScheme} только на grid div → только div перемонтируется → grid обновляется.

---

## EDITABLETEXT

### Импорт
```tsx
import { EditableText } from '../shared/EditableText'
// НЕ из TronStats — только из shared
```

### Использование
```tsx
<EditableText
  value={title ?? ''}
  tag="h2"
  style={{ color: t.text, fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700 }}
  enabled={enabled}
  onSave={(val) => setProp((p: Record<string,unknown>) => { p.title = val }, 0)}
/>
```

### Что оборачивать
✅ Заголовки (title, headline, h1-h4)
✅ Subtitle, description, body
✅ Названия карточек, табов, планов
✅ CTA текст кнопок
✅ Brand name, copyright

❌ Цены (числовые поля)
❌ Иконки SVG
❌ Счётчики (count-up анимации)
❌ href, URL поля

---

## МЕДИА СИСТЕМА

### Принцип: только URL, никогда base64
base64 в Craft.js props = катастрофа:
- Craft.js сохраняет снимок JSON при каждом Undo/Redo
- 10 фото × 5MB base64 = 50MB в оперативной памяти = краш вкладки

### Правильная реализация
```tsx
// В Settings — кнопка открывает MediaLibrary
import { MediaLibrary } from '@/components/craft/MediaLibrary'
import { useAuth } from '@/lib/hooks/useAuth'

const { user } = useAuth()
const [showMedia, setShowMedia] = React.useState<number | null>(null)

// Кнопка:
<button onClick={() => setShowMedia(i)}>
  {item.imageUrl ? '↺ Change' : '+ Add image'}
</button>

// Модалка:
{showMedia === i && user && (
  <MediaLibrary
    userId={user.id}
    accept="image"  // или "video" или "all"
    onSelect={(url) => {
      setProp((p) => {
        const items = [...p.items]
        items[showMedia!] = { ...items[showMedia!], imageUrl: url }
        p.items = items
      }, 0)
      setShowMedia(null)
    }}
    onClose={() => setShowMedia(null)}
  />
)}

// В компоненте:
<img src={item.imageUrl ?? item.imageBase64} />  // fallback для старых данных
```

---

## HOVER КАРТОЧЕК

```tsx
const [hovered, setHovered] = React.useState<number | null>(null)

// На карточке:
onMouseEnter={() => !enabled && setHovered(i)}
onMouseLeave={() => setHovered(null)}

style={{
  transform: hovered === i ? 'translateY(-4px)' : 'translateY(0)',
  boxShadow: hovered === i
    ? `0 16px 48px rgba(${hexToRgb(accentColor)}, 0.15)`
    : 'none',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
}}
```

**Важно:** `!enabled` — в редакторе hover отключён, чтобы не мешать drag & drop.

---

## SETTINGS PANEL

### Стили — единый стандарт
```tsx
// Лейблы
const labelCls = "block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5"

// Инпуты
const inputCls = "w-full px-3 py-2 rounded-md text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 mb-3"

// Слайдеры
<input type="range" className="settings-slider" />
// (стили в globals.css)

// Color picker
<input type="color" style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', padding: 2, background: 'none', cursor: 'pointer' }} />

// Карточки items
style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, marginBottom: 8 }}

// Кнопка Remove
<button style={{ color: '#f87171' }}>× Remove</button>

// Кнопка + Add
<button style={{ color: '#FF6B35', fontWeight: 600 }}>+ Add item</button>

// Pill кнопки (layout переключатель)
<button style={{
  background: active ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
  border: 'none', borderRadius: 6, padding: '4px 12px',
  color: active ? '#FF6B35' : '#a1a1aa',
  cursor: 'pointer', fontSize: 11, fontWeight: 500,
}}>Tab Left</button>
```

### Порядок секций в Settings
1. CONTENT (title, subtitle, основной текст)
2. LAYOUT (layoutStyle, columns, cardStyle)
3. ITEMS (список редактируемых элементов)
4. COLORS (darkBg, lightBg)
5. SIZE (sectionHeight)
6. DISPLAY (showGrid)
7. ANIMATION (animationType, animateDelay)

---

## CRAFT ОБЪЕКТ

```tsx
TronXxx.craft = {
  displayName: 'Tron Xxx',
  props: {
    // Обязательные дефолты
    darkBg: '#0a0a0a',
    lightBg: '#ffffff',
    sectionHeight: 80,
    showGrid: true,
    title: 'Section Title',
    subtitle: 'Section subtitle text goes here.',
    animationType: 'none',
    animateDelay: '0',
    // ... специфичные пропсы
  },
  related: {
    settings: TronXxxSettings,
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,    // компоненты не принимают дочерние ноды
  },
  custom: {
    styleTags: ['dark', 'minimal'],              // 'dark'|'light'|'minimal'|'bold'|'elegant'
    businessTags: ['saas', 'startup', 'agency'], // тип бизнеса
    featureTags: ['hero', 'features', 'pricing'],// функциональный тег
    supportsTheme: true,
    supportsColorPreset: true,
    supportsGradient: false,
  },
}
```

**Теги важны для Door A (Интерактив)** — по ним JSON контракт автоматически подбирает компоненты.

---

## АНИМАЦИИ

### Поддерживаемые типы
```tsx
animationType: 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'bounce'
```

### Применение
```tsx
<div
  data-animate={animationType !== 'none' ? animationType : undefined}
  data-animate-delay={animateDelay}
  style={{ position: 'relative', zIndex: 1 }}
>
```

data-animate на контентном div (не на section).
GSAP подхватывает атрибут при входе в viewport.

---

## CSS АНИМАЦИИ (для каруселей)

```tsx
React.useEffect(() => {
  const styleId = 'tron-xxx-animations'
  if (document.getElementById(styleId)) return
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes scrollLeft {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `
  document.head.appendChild(style)
  return () => { document.getElementById(styleId)?.remove() }
}, [])
```

---

## СПИСОК КОМПОНЕНТОВ И ИХ ЭТАЛОННЫЕ ПАТТЕРНЫ

| Компонент | Уникальная фича | Эталон для |
|-----------|----------------|------------|
| TronStats | Tokens, hexToRgb | Все компоненты |
| TronContact | ResizeObserver, darkBg/lightBg | Адаптивность |
| HeroTron | Spotlight cursor, count-up | Анимации |
| HeaderTron | Smart links, sticky | Навигация |
| TronFeatures | 3 стиля карточек | Hover тактильность |
| TronTestimonials | Бесконечная карусель | CSS анимации |
| TronPricing | Billing toggle, popular badge | Переключатели |
| TronPortfolio | Hover overlay, MediaLibrary | Медиа загрузка |
| TronFAQ | Аккордеон, split/centered | Layout варианты |
| TronShowcase | Табы + видео embed + upload | Комплексные медиа |
| TronFooter | Соцсети SVG, 2×2 grid | Footer паттерны |
