# MECHANICS — I AM RUNNING
## Доктрина механик для компонентов

---

## ЧТО ТАКОЕ МЕХАНИКА

Механика — это интерактивный или визуальный эффект, который накладывается на компонент.
Механики делятся на два типа:

### Глобальные механики
Управляются на уровне редактора/сайта, а НЕ внутри отдельного компонента.
Компонент НЕ должен их дублировать.

| Механика | Где живёт | Как управляется |
|----------|-----------|-----------------|
| **Cursor spotlight** | Viewport.tsx (редактор), SiteRenderer.tsx (деплой) | Мини-тулбар → кнопка spotlight → intensity slider |
| **Page animations** | SiteRenderer.tsx + editor GSAP | data-animate атрибуты на контентных div |

### Компонентные механики
Специфичны для конкретного компонента, настраиваются через его Settings Panel.

| Механика | Применение |
|----------|-----------|
| **Static spotlight** | Фиксированный свет сверху (HeroTron, TronAbout) — это НЕ cursor, это декоративный градиент |
| **Magnetic buttons** | Кнопки притягиваются к курсору — специфично для компонента |
| **Parallax image** | Изображение движется при mousemove — специфично для компонента |
| **Count-up stats** | Анимация цифр при попадании в viewport |
| **Card hover tilt** | Наклон карточки при hover |

---

## ГЛАВНОЕ ПРАВИЛО: НЕ ДУБЛИРУЙ ГЛОБАЛЬНЫЕ МЕХАНИКИ

❌ **ЗАПРЕЩЕНО** в любом компоненте:
```tsx
// Компонент НЕ должен слушать mousemove и рисовать свой spotlight
const handleMove = (e: MouseEvent) => {
  spotlight.style.background = `radial-gradient(circle 500px at ${x}px ${y}px, rgba(...) ...)`;
};
section.addEventListener('mousemove', handleMove);
```

✅ **ПРАВИЛЬНО** — cursor spotlight живёт только в двух местах:
- `components/craft/Viewport.tsx` — в редакторе
- `app/sites/[slug]/SiteRenderer.tsx` — на деплоенных сайтах

**Почему важно:** если компонент добавляет свой cursor spotlight, он накладывается поверх глобального → двойной эффект, неконсистентная яркость между компонентами.

---

## STATIC SPOTLIGHT vs CURSOR SPOTLIGHT

Это разные вещи — не путать:

```tsx
// ✅ STATIC SPOTLIGHT — декоративный, разрешён внутри компонента
// Фиксированный радиальный градиент, не реагирует на мышь
<div style={{
  position: 'absolute', inset: 0, pointerEvents: 'none',
  backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 0%,
    rgba(${rgb}, ${spotlightIntensity / 100}) 0%, transparent 70%)`,
}} />

// ❌ CURSOR SPOTLIGHT — запрещён внутри компонента
// section.addEventListener('mousemove', ...) — это глобальная механика
```

`spotlightIntensity` prop в компонентах (HeroTron, TronAbout) — это интенсивность **static spotlight**, не cursor. Называть его `spotlightIntensity` правильно, но документировать как "декоративный верхний свет", не "cursor".

---

## ПЛАНИРУЕМЫЕ МЕХАНИКИ (будущий раздел "Mechanics" в Settings Panel)

### Фоновые механики
| Механика | Описание | Библиотека |
|----------|----------|-----------|
| **Fireflies** | Плавающие светящиеся точки на фоне | Canvas API |
| **Particles** | Частицы с физикой (разлёт, притяжение) | Canvas API |
| **Gradient blob** | Медленно плавающие размытые blobs цвета | CSS + JS |
| **Grid pulse** | Сетка с пульсирующей анимацией | CSS keyframes |
| **Noise texture** | Анимированный шум/статик | Canvas API / SVG filter |

### Интерактивные механики
| Механика | Описание | Применимо к |
|----------|----------|------------|
| **Magnetic** | Элемент притягивается к курсору | Кнопки, иконки |
| **Tilt** | Наклон карточки при hover | Карточки |
| **Parallax** | Движение при mousemove | Изображения, фоны |
| **Ripple** | Волна при клике | Кнопки |
| **Reveal** | Раскрытие текста/контента при скролле | Заголовки |

### Архитектура будущего раздела Mechanics
```
Settings Panel
  └── Mechanics (новая секция)
        ├── Background: [None | Fireflies | Particles | Gradient blobs]
        ├── Interactive: [чекбоксы — Magnetic buttons | Tilt cards]
        └── Confirm → применяется к компоненту через setProp
```

Выбор механики подсвечивает совместимые элементы (кнопки / карточки / изображения).
Реализуется как `<MechanicsSettings>` shared компонент + `useMechanics(props)` хук.

---

## ПРАВИЛА НАПИСАНИЯ МЕХАНИК В КОМПОНЕНТЕ

### 1. Всегда проверять SSR
```tsx
React.useEffect(() => {
  if (typeof window === 'undefined') return;
  // ...
}, []);
```

### 2. Всегда делать cleanup
```tsx
React.useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const handler = (e: MouseEvent) => { ... };
  el.addEventListener('mousemove', handler);
  return () => el.removeEventListener('mousemove', handler); // ← обязательно
}, []);
```

### 3. Отключать в редакторе
```tsx
// Интерактивные механики не работают в enabled (edit) режиме
onMouseEnter={() => !enabled && setHovered(i)}
```

### 4. RAF для производительности
```tsx
let rafId: number;
const handler = (e: MouseEvent) => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => { /* expensive update */ });
};
return () => cancelAnimationFrame(rafId);
```

### 5. Canvas механики — один canvas на компонент
```tsx
React.useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animId: number;
  const draw = () => { /* ... */; animId = requestAnimationFrame(draw); };
  animId = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(animId); // ← cleanup обязателен
}, []);
```

---

## КОНФЛИКТЫ И ЛОВУШКИ

| Ловушка | Почему | Решение |
|---------|--------|---------|
| Cursor spotlight в компоненте | Накладывается на глобальный → двойная яркость | Использовать только static spotlight |
| Multiple mousemove listeners | Утечки памяти, лаги | Один listener в Viewport/SiteRenderer |
| Canvas без cleanup | WebGL context leak | Всегда `cancelAnimationFrame` + `ctx.clearRect` |
| Three.js без ограничений | Браузеры лимитируют WebGL: 8-16 ctx | Максимум 1 Three.js компонент на страницу |
| `glowIntensity` vs `spotlightIntensity` | Путаница именования | `spotlightIntensity` = static декоративный свет; cursor всегда глобальный |

---

*Создан: 21.03.2026*
*Обновлять при добавлении новых механик или изменении архитектуры*
