# VRAV Tube Engine

**AI-аудит, SEO-оптимизация и контроль рисков монетизации для YouTube.**

[English](./README.md) · [Русский](./README.ru.md) · [Български](./README.bg.md)

---

## О продукте

| Модуль | Назначение |
|--------|------------|
| **AI-Аудит** | Метаданные, кликабельные названия, SEO-описания с таймкодами |
| **Риск монетизации** | Проверка на риск «жёлтого значка» |
| **Лицензии** | Trial / Pro / Agency, white-label |
| **Оплата** | **USD** — Stripe · **RUB** — ЮKassa (РФ/СНГ: карты, СБП, ЮMoney) |

## Быстрый старт

```bash
npm install && npm run dev
cd server && npm install && cp .env.example .env && npm run dev
```

Demo-ключи: `trial_demo` · `pro_demo_2026` · `agency_demo_2026`

## Оплата в рублях (ЮKassa)

```env
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=https://ваш-домен/?paid=1&provider=yookassa
```

Webhook: `https://ваш-api/api/yookassa/webhook`  
Цены: **Pro 2 900 ₽** · **Agency 9 900 ₽** / мес.

В UI: **Настройки → Купить план → ₽ Рубли (РФ/СНГ)**.

Документация: [docs/YOOKASSA.md](./docs/YOOKASSA.md)

## Лицензия

**Проприетарное ПО.** См. [LICENSE](./LICENSE).
