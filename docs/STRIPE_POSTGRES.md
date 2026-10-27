# Stripe + Postgres — реальные лицензии

## 1. Postgres

```bash
docker run -d --name vrav-pg -e POSTGRES_PASSWORD=vrav -e POSTGRES_USER=vrav \
  -e POSTGRES_DB=vrav_tube -p 5432:5432 postgres:16

psql postgres://vrav:vrav@localhost:5432/vrav_tube -f server/sql/schema.sql
```

В `server/.env`:
```
DATABASE_URL=postgres://vrav:vrav@localhost:5432/vrav_tube
```

Без `DATABASE_URL` — in-memory (demo-ключи).

## 2. Stripe

1. Products/Prices в Stripe Dashboard (Pro, Agency).
2. Price IDs → `server/src/routes/stripe.ts` → `PRICE_TO_TIER`.
3. `.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
4. Webhook: `POST /api/stripe/webhook`  
   Events: `checkout.session.completed`, `customer.subscription.deleted`

```bash
cd server && npm install stripe pg
stripe listen --forward-to localhost:8787/api/stripe/webhook
```

## 3. Flow

1. `POST /api/stripe/checkout` { email, priceId }
2. Оплата в Stripe Checkout
3. Webhook выдаёт ключ `pro_…` / `agency_…`
4. Ключ в Postgres + in-memory
5. Активация в UI (Settings)

## 4. Production

- Raw body для подписи webhook
- Email с ключом (Resend/SendGrid)
- Env для Price IDs вместо хардкода
