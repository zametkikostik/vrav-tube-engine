# YooKassa (ЮKassa) — оплата в рублях (РФ / СНГ)

## Возможности

- Банковские карты
- **СБП** (Система быстрых платежей)
- ЮMoney, SberPay

## Настройка

```env
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=https://your-frontend/?paid=1&provider=yookassa
YOOKASSA_VAT_CODE=1
```

HTTP-уведомления: `https://your-api-host/api/yookassa/webhook`  
Событие: **payment.succeeded**

## API

| Метод | Путь |
|-------|------|
| GET | `/api/yookassa/prices` |
| POST | `/api/yookassa/checkout` `{ email, planId: "pro"\|"agency" }` |
| POST | `/api/yookassa/webhook` |

## Цены по умолчанию

- Pro — **2900 ₽** / мес
- Agency — **9900 ₽** / мес

Файл: `server/src/routes/yookassa.ts` → `RUB_PLANS`
