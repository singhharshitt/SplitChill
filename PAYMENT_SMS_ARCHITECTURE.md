# SplitChill Payment and SMS Architecture

## Architecture

SplitChill now treats the backend as the source of truth for settlements. The React app asks the API to initiate a payment for an existing settlement transaction. The server creates or reuses an idempotent `Payment`, calls Hyperswitch, stores the provider IDs/client secret, and emits `payment:initiated` to the group room. The frontend may redirect to checkout, but it never marks the settlement paid.

Hyperswitch sends webhooks to `POST /api/webhooks/hyperswitch`. The server verifies `x-webhook-signature-512` with HMAC-SHA512 using `HYPERSWITCH_WEBHOOK_SECRET`, stores a `WebhookLog`, deduplicates with `PaymentEvent.providerEventId`, updates `Payment.status`, and only then updates the linked `Transaction`. A succeeded webhook calls `applyProviderPaymentResult`, which updates the transaction to `completed`, applies the settlement to group balances, trims fairness history, increments user stats, and emits `transaction:updated`, `fairness:changed`, `payment:updated`, and `group:updated`.

Textbee sends SMS through your own Android phone/SIM using its REST API, so the software layer is free and self-hostable/low-cost. SplitChill logs every send attempt in `SmsLog`, supports OTP verification, payment initiation/success/failure alerts, admin resend, retry metadata, and optional Textbee callback verification with `X-Signature` HMAC-SHA256.

## Request Flow

1. UI calls `POST /api/payments/transactions/:transactionId/initiate` with `Idempotency-Key`.
2. Backend validates group membership and payer ownership.
3. Backend creates `payments` and calls `POST {HYPERSWITCH_BASE_URL}/payments`.
4. UI receives `checkout.clientSecret` and optional `checkoutUrl`.
5. Hyperswitch webhook arrives and is signature verified.
6. Backend writes `webhook_logs` and `payment_events`.
7. On success, backend updates `transactions`, recalculates fairness, writes audit/SMS logs, and emits Socket.io events to `group:{groupId}`.

## Payment State Machine

`pending -> processing -> succeeded -> completed transaction -> reconciled`

Failure path: `pending|processing -> failed|cancelled`; retries create new idempotent attempts or admin/manual review. Reconciliation can mark stale succeeded provider records as `reconciled` after comparing Hyperswitch status with MongoDB.

## Folder Structure

```text
server/src/controllers/payment.controller.js
server/src/controllers/webhook.controller.js
server/src/models/Payment.js
server/src/models/PaymentEvent.js
server/src/models/SmsLog.js
server/src/models/WebhookLog.js
server/src/models/AuditLog.js
server/src/models/OtpChallenge.js
server/src/routes/payment.routes.js
server/src/routes/webhook.routes.js
server/src/services/payment.service.js
server/src/services/sms.service.js
server/src/services/audit.service.js
client/src/api/payments.js
client/src/components/PaymentStatusPanel.jsx
```

## API Routes

`POST /api/payments/transactions/:transactionId/initiate`

`GET /api/payments?limit=20&cursor=&status=&groupId=`

`GET /api/payments/:id/events`

`POST /api/payments/otp/start`

`POST /api/payments/otp/verify`

`POST /api/payments/sms/:id/resend` admin only

`POST /api/webhooks/hyperswitch`

`POST /api/webhooks/textbee`

## MongoDB Collections and Indexes

Core collections remain `users`, `groups`, `expenses`, and `transactions`. Added collections are `payments`, `paymentevents`, `smslogs`, `webhooklogs`, `auditlogs`, and `otpchallenges`.

Important indexes:

```js
payments: { idempotencyKey: 1 } unique
payments: { group: 1, createdAt: -1 }
payments: { status: 1, nextRetryAt: 1 }
paymentevents: { provider: 1, providerEventId: 1 } unique
smslogs: { status: 1, nextRetryAt: 1 }
webhooklogs: { provider: 1, eventId: 1 } unique
auditlogs: { resourceType: 1, resourceId: 1, createdAt: -1 }
transactions: { group: 1, status: 1, createdAt: -1 }
```

## Environment

See `server/.env.example`. Required production secrets: `JWT_SECRET`, `HYPERSWITCH_API_KEY`, `HYPERSWITCH_WEBHOOK_SECRET`, `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`, and `TEXTBEE_WEBHOOK_SECRET`.

## Deployment

Run SplitChill with:

```bash
docker compose up -d
```

Run Hyperswitch from the official open-source repo:

```bash
git clone https://github.com/juspay/hyperswitch
cd hyperswitch
docker compose --file docker-compose-development.yml up -d
```

Set Hyperswitch webhook URL to:

```text
https://your-api.example.com/api/webhooks/hyperswitch
```

Set Textbee callback URL to:

```text
https://your-api.example.com/api/webhooks/textbee
```

## Failure and Retry Strategy

Webhook retries are safe because `PaymentEvent` has a unique `(provider, providerEventId)` index. SMS failures record `nextRetryAt` and `attempts`; a cron worker can query failed logs and resend with exponential backoff. Payment reconciliation should run every few minutes, fetch nonterminal provider payments, compare provider status to MongoDB, and call the same server-side settlement function used by webhooks.

## Testing

Unit tests:

- Hyperswitch signature pass/fail.
- duplicate webhook idempotency.
- status mapping.
- SMS failure logs `failed` and `nextRetryAt`.

Integration tests:

- create pending settlement, initiate payment, assert `Payment` and `PaymentEvent`.
- send mocked signed succeeded webhook, assert transaction `completed`, fairness changed, socket event emitted.
- send duplicate webhook, assert no double fairness application.
- send failed webhook, assert transaction `failed`.
- OTP start/verify with mocked Textbee.

## Production Readiness Checklist

- Configure real Hyperswitch API key and webhook hash key.
- Configure Textbee Android device, API key, and webhook secret.
- Move auth tokens from localStorage to httpOnly secure cookies.
- Add Redis Socket.io adapter before horizontal scaling.
- Add cron workers for payment reconciliation and SMS retries.
- Add admin screens for `payments`, `payment_events`, `sms_logs`, `webhook_logs`, and `audit_logs`.
- Keep `fairnessHistory` bounded or move snapshots to a separate collection.
- Enable structured logs, metrics, alerting, and dead-letter queues.
- Never accept frontend success callbacks as payment success.
