# ЭВОЛЮЦИЯ — 27.03.2026 (Sonnet Sprint)

**Контекст:** Рабочая сессия с Claude Sonnet 4.6. Основные темы: позиционирование платформы, G07 тест install.sh, OAuth баг.

---

## Стратегические решения

### ПОЗИЦИОНИРОВАНИЕ ПЛАТФОРМЫ (зафиксировано)
I AM RUNNING — не конструктор сайтов, а **full-cycle AI development platform** с тремя входами.
Лендинг iamrunning.online должен продавать платформу, а не отдельные инструменты.

**Структура лендинга зафиксирована:**
1. Hero — платформенный манифест, "I AM RUNNING — full-cycle AI development platform"
2. ThreeDoorsSection — три двери (Interactive / Editor / Business Software)
3. SpeedSection — Fast launch. Premium result. Fair price.
4. HostingSection — $20/мес, первый месяц бесплатно, всё включено
5. SavingsCalculator — bar chart вместо donut, landing/business/store
6. FinalCtaSection — пульсирующий "Start Running"
7. Footer — © Ariel Shein

**Детали Hero:**
- Фон: оранжевый (#FF6B35), тёмный режим = чёрный
- Marquee: полупрозрачные бегущие строки с конкретными возможностями платформы
- Заголовок: "I AM RUNNING — full-cycle AI development platform"
- Подзаголовок: "Build your dream website from your phone in 15 minutes"
- Offer: "Starting from $20/month — with the first month free"
- Header: скрыт на первом экране, появляется после скролла
- CTA кнопки: динамические (гость / авторизован / editor access) — НЕ ТРОГАТЬ

**Door Cards:**
- Door A: mobile-first, лёгкий, быстрый. CTA: "Run Interactive"
- Door B: профессиональный редактор, desktop-like. CTA: "Run Editor"
- Door C: САМАЯ ЗАМЕТНАЯ — "Custom AI-native software by I AM RUNNING, our most powerful product". CTA: "Run Business"
- Каждая дверь ведёт на отдельную страницу /doors/interactive, /doors/editor, /doors/business

### МОНЕТИЗАЦИЯ AI BUSINESS OS (уточнена)
- **Малый бизнес:** чистый SaaS, без setup fee, ~$400-500/мес подписка
- **Средний бизнес / стартапы:** $2-15k first launch + $700-1500/мес
- **Целевой сегмент #1:** стартапы без технаря — "технарь больше не обязателен"
- **Канал продаж:** Upwork + прямые обращения к малому бизнесу

---

## G07: Тест install.sh на чистом VPS ✅ (частично)

**Сервер куплен:** Time4VPS Linux VPS (не Hetzner — без KYC верификации)
- IP: 185.5.55.111
- Specs: 1 CPU 2.3GHz, 2GB RAM, 20GB SSD, Ubuntu 24.04
- Домен: test.lego-base.online
- SSL: ✅ получен (certbot, expires 2026-06-25)

**install.sh отработал успешно:**
- Node.js v20.20.0 ✅
- PM2 6.0.14 ✅
- Nginx ✅
- memory/ с YAML frontmatter (5 файлов) ✅
- RULES.md checksum: c2c73922... ✅
- Watchdog cron (каждые 5 мин) ✅
- Git post-commit hook ✅
- Build: ✅ (12/12 страниц)
- PM2 startup ✅

**TOTP Secret (сохранён):** APA3AAMAXQAAAWAAAAAAAAGAWGAA
**MCP Token:** 6fbf0ae1022211c552c632913feb75ca9960d9b98e4bed6e1c44746fd1539f04

**Блокер:** OAuth metadata endpoint возвращает localhost:3000 вместо https://test.lego-base.online

---

## 🔴 АКТИВНЫЙ БАГ: OAuth metadata localhost

**Симптом:**
```
curl https://test.lego-base.online/.well-known/oauth-authorization-server
→ {"issuer":"https://localhost:3000", ...}
```

**Должно быть:**
```
{"issuer":"https://test.lego-base.online", ...}
```

**Файл:** `iam-client-os/app/api/oauth-metadata/route.ts`

**Фикс применён** (добавлено чтение NEXT_PUBLIC_CLIENT_DOMAIN) но не работает.

**Гипотеза:** NEXT_PUBLIC_* переменные инлайнятся в JavaScript бандл на этапе билда. На Vercel они были пустыми → код падал на x-forwarded-host (который Vercel выставляет правильно). На VPS переменная задана в .env.local, но либо не попадает в билд serverless функции, либо next.config.mjs `env:` блок перетирает значение пустой строкой если переменная не задана на момент `next build`.

**Что пробовали:**
- patch_file oauth-metadata/route.ts — не помогло
- python3 скрипт замены файла — не помогло  
- rm -rf .next && npm run build — не помогло
- Добавить X-Forwarded-Host в nginx — не помогло
- pm2 restart --update-env — не помогло

**Для Opus:** прочитай `iam-client-os/app/api/oauth-metadata/route.ts`, `iam-client-os/next.config.mjs` и найди почему NEXT_PUBLIC_CLIENT_DOMAIN не читается в serverless route на VPS.

**На Vercel работало** потому что там x-forwarded-host правильный. На VPS нужен другой подход — вероятно использовать серверную переменную без NEXT_PUBLIC_ префикса, или читать домен из request.headers.get('host').

---

## Технические детали нового сервера

```
Сервер:      Time4VPS (не Hetzner)
IP:          185.5.55.111  
Домен:       test.lego-base.online
App dir:     /var/www/iam-os
PM2 name:    iam-os
Port:        3000
SSL:         /etc/letsencrypt/live/test.lego-base.online/ (expires 2026-06-25)
Nginx conf:  /etc/nginx/sites-available/iam-os
Watchdog:    crontab */5 * * * * APP_DIR=/var/www/iam-os
Backups:     /var/backups/iam-memory/
```

---

## Выученные уроки

35. 🆕 **Hetzner требует KYC верификацию с марта 2026** — паспорт + селфи. Альтернативы без KYC: Time4VPS, DigitalOcean, Vultr.
36. 🆕 **NEXT_PUBLIC_* не работают в serverless route на VPS** — инлайнятся в билд, но serverless runtime не видит .env.local. Использовать серверные env без NEXT_PUBLIC_ префикса для server-side кода.
37. 🆕 **nohup cmd && pm2 restart & зависает** — pm2 restart запускается как часть цепочки в фоне, но nohup ждёт stdin. Правильно: `npm run build && pm2 restart iam-os` (без nohup для билда).
38. 🆕 **install.sh требует публичный GitHub репо** — приватный репо даёт 404 при curl. Либо делать публичным, либо использовать PAT токен.
