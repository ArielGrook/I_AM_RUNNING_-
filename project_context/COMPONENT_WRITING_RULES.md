# COMPONENT WRITING RULES
## Чеклист для Cursor — обязателен перед написанием любого Tron компонента

---

## ПЕРЕД НАЧАЛОМ

```
1. Прочитай Complete_Guide_Components_v4.md
2. Открой TronStats.tsx — это эталон для токенов и структуры
3. Открой TronContact.tsx — это эталон для ResizeObserver и darkBg/lightBg
```

---

## ОБЯЗАТЕЛЬНАЯ СТРУКТУРА ФАЙЛА

```tsx
// 1. Импорты
import React from 'react'
import { useNode, useEditor } from '@craftjs/core'
import { EditableText } from '../shared/EditableText'  // НЕ из TronStats

// 2. Интерфейс пропсов
interface TronXxxProps {
  darkBg?: string
  lightBg?: string
  sectionHeight?: number
  showGrid?: boolean
  title?: string
  subtitle?: string
  // ... специфичные пропсы
  animationType?: string
  animateDelay?: string
}

// 3. hexToRgb утилита (ОБЯЗАТЕЛЬНО в каждом файле)
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

// 4. Tokens (скопировать ТОЧНО из TronStats)
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

// 5. Компонент
export function TronXxx({ ... }: TronXxxProps) {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode()
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))
  
  // ThemeContext или colorScheme из useEditor
  const colorScheme = ... // 'dark' | 'light'
  const accentColor = ... // из ThemeContext
  
  const t = buildTokens(darkBg, lightBg)[colorScheme]
  
  // ResizeObserver — СТРОГО []
  const containerRef = React.useRef<HTMLElement>(null)
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const checkWidth = () => setIsMobile(el.getBoundingClientRect().width < 520)
    checkWidth()
    const observer = new ResizeObserver(([entry]) => {
      setIsMobile(entry.contentRect.width < 520)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])  // СТРОГО пустой массив
  
  return (
    <section
      ref={(ref) => ref && connect(drag(ref as HTMLElement))}
      style={{
        position: 'relative',
        background: t.bg,
        minHeight: `${sectionHeight}vh`,
        // НЕТ backgroundImage здесь
      }}
    >
      {/* Grid div — ОТДЕЛЬНЫЙ с key={colorScheme} */}
      <div
        key={colorScheme}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: showGrid
            ? `linear-gradient(${t.gridColor} 1px, transparent 1px),
               linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`
            : 'none',
          backgroundSize: showGrid ? '50px 50px' : 'auto',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* Контент — ВСЕГДА position relative, zIndex 1 */}
      <div
        data-animate={animationType !== 'none' ? animationType : undefined}
        style={{ position: 'relative', zIndex: 1, padding: `${sectionHeight/2}px 24px` }}
      >
        {/* ... контент */}
      </div>
    </section>
  )
}
```

---

## ЧЕКЛИСТ — ПРОВЕРЬ КАЖДЫЙ ПУНКТ

### Структура
- [ ] hexToRgb функция есть в файле
- [ ] buildTokens скопирован из TronStats (все 6 ключей)
- [ ] darkBg и lightBg props с color picker в Settings
- [ ] sectionHeight prop со слайдером 50-100
- [ ] showGrid prop с toggle
- [ ] animationType и animateDelay props

### ResizeObserver
- [ ] Зависимости строго `[]` — никаких colorScheme, cardStyle
- [ ] checkWidth() вызывается при монтировании внутри useEffect
- [ ] Threshold `< 520` (не 768, не 640)
- [ ] containerRef на корневом section

### Grid
- [ ] На section: НЕТ backgroundImage
- [ ] Отдельный `<div key={colorScheme}>` с position absolute, inset 0
- [ ] pointerEvents: 'none' на grid div
- [ ] zIndex: 0 на grid div
- [ ] Контентный div: position relative, zIndex 1

### Компонент
- [ ] connect(drag(ref)) на корневом section
- [ ] data-animate на контентном div (не на section)
- [ ] useEditor ТОЛЬКО для enabled — не для colorScheme
- [ ] key НЕ добавлять на section

### EditableText
- [ ] Импорт из `../shared/EditableText` (не из TronStats)
- [ ] Все текстовые элементы обёрнуты в EditableText
- [ ] НЕ оборачивать: цены, иконки SVG, счётчики, href

### Hover карточек
- [ ] `onMouseEnter={() => !enabled && setHovered(true)}`
- [ ] В редакторе (enabled=true) hover отключён
- [ ] transition: 'transform 0.2s ease, box-shadow 0.2s ease'

### Media (если есть загрузка фото/видео)
- [ ] НЕ использовать base64 и FileReader
- [ ] Использовать MediaLibrary компонент
- [ ] В props сохранять URL строку (не base64)
- [ ] Fallback на плейсхолдер если нет медиа

### Settings
- [ ] labelCls и inputCls унифицированы
- [ ] Слайдеры: className="settings-slider"
- [ ] Color picker: без белого ободка
- [ ] Карточки items: bg rgba(255,255,255,0.04), border rgba(255,255,255,0.08)
- [ ] Кнопка Remove: красная (text-red-400)
- [ ] Кнопка + Add: оранжевая (#FF6B35)

### craft объект
- [ ] displayName заполнен
- [ ] props содержат все дефолтные значения
- [ ] related: { settings: TronXxxSettings }
- [ ] rules: { canDrag: () => true, canMoveIn: () => false }
- [ ] custom.styleTags, businessTags, featureTags заполнены
- [ ] custom.supportsTheme: true

---

## ЗАПРЕЩЕНО

- ❌ key={colorScheme} на section
- ❌ ResizeObserver с зависимостями кроме []
- ❌ Tailwind breakpoints для мобильной адаптивности
- ❌ base64 для хранения изображений
- ❌ useEditor для получения colorScheme (только для enabled)
- ❌ backgroundImage на section (только на grid div)
- ❌ Импорт EditableText из TronStats (только из shared)
- ❌ isMobile threshold отличный от 520

---

## ЭТАЛОНЫ (читать перед написанием)

| Что нужно | Эталон |
|-----------|--------|
| Токены, структура | TronStats.tsx |
| ResizeObserver, darkBg/lightBg | TronContact.tsx |
| Grid div паттерн | TronShowcase.tsx |
| Аккордеон | TronFAQ.tsx |
| Карусель | TronTestimonials.tsx |
| Табы | TronShowcase.tsx |
| File upload (медиа) | TronPortfolio.tsx |
| Hover карточки | TronFeatures.tsx |
| Billing toggle | TronPricing.tsx |
