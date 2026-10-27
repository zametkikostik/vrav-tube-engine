# VRAV Tube Engine

**AI одит, SEO оптимизация и контрол на риска за монетизация в YouTube.**

[English](./README.md) · [Русский](./README.ru.md) · [Български](./README.bg.md)

---

## Преглед

| Модул | Функция |
|--------|---------|
| **AI Одит** | Метаданни, кликаеми заглавия, SEO описания |
| **Риск за монетизация** | Сканиране за „жълта икона“ |
| **Лицензи** | Trial / Pro / Agency, white-label |
| **Плащания** | **USD** — Stripe · **RUB** — YooKassa (карти, СБП, YooMoney) |

## Бърз старт

```bash
npm install && npm run dev
cd server && npm install && cp .env.example .env && npm run dev
```

Demo ключове: `trial_demo` · `pro_demo_2026` · `agency_demo_2026`

## Плащане в рубли (YooKassa)

```env
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=https://вашият-домейн/?paid=1&provider=yookassa
```

Webhook: `POST /api/yookassa/webhook`  
Цени: **Pro 2 900 ₽** · **Agency 9 900 ₽** / месец.

Документация: [docs/YOOKASSA.md](./docs/YOOKASSA.md)

## Лиценз

**Собственически софтуер.** Вижте [LICENSE](./LICENSE).
