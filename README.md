# VRAV Tube Engine

**AI audit, SEO optimization, and monetization risk control for YouTube creators.**

[English](./README.md) · [Русский](./README.ru.md) · [Български](./README.bg.md)

---

## Overview

VRAV Tube Engine is a multi-platform SaaS toolkit for YouTube channels:

| Module | What it does |
|--------|----------------|
| **AI Audit** | Scores metadata, generates clickable titles and SEO descriptions with timestamps |
| **Monetization Risk** | Scans scripts/subtitles for yellow-icon risk (profanity, shock, restricted topics) |
| **Licensing** | Trial / Pro / Agency tiers, white-label for agencies |
| **Payments** | **USD** via Stripe · **RUB** via YooKassa (Russia & CIS: cards, SBP, YooMoney) |

Built for creators and agencies who care about ranking **and** keeping full monetization.

---

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, i18n (EN / RU / BG)
- **API:** Express (YouTube Data API v3 + LLM proxy)
- **LLM:** RouterAI ([routerai.ru](https://routerai.ru)) → OpenRouter → OpenAI fallback
- **Billing:** Stripe (USD) · YooKassa (RUB)
- **Data:** optional Postgres for licenses; in-memory demo keys out of the box
- **Desktop:** Tauri 2 (Windows / Linux / macOS)
- **Mobile:** Capacitor (Android)

---

## Quick start

```bash
git clone https://github.com/zametkikostik/vrav-tube-engine.git
cd vrav-tube-engine

npm install
npm run dev          # http://localhost:5173

cd server
npm install
cp .env.example .env
npm run dev            # http://localhost:8787
```

### Demo license keys

| Key | Tier |
|-----|------|
| `trial_demo` | Trial |
| `pro_demo_2026` | Pro |
| `agency_demo_2026` | Agency (white-label) |

---

## Payments

### International (USD) — Stripe

Set `STRIPE_SECRET_KEY`, webhook `POST /api/stripe/webhook`.

### Russia & CIS (RUB) — YooKassa

Pay in **rubles** with bank cards, **SBP**, YooMoney, SberPay.

```env
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=https://your-domain.com/?paid=1&provider=yookassa
```

Webhook: `POST /api/yookassa/webhook` (`payment.succeeded`).

Default prices: **Pro 2 900 ₽** · **Agency 9 900 ₽** / month.

Docs: [docs/YOOKASSA.md](./docs/YOOKASSA.md) · [BUILD.md](./BUILD.md)

---

## License

**Proprietary software.** All rights reserved. See [LICENSE](./LICENSE).
