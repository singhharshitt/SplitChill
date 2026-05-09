# SplitChill Payment and SMS Architecture

## 1. Architecture Explanation

SplitChill now treats the backend as the only source of truth for payments.

Flow:

1. A `Transaction` already exists from the settlement flow.
2. React calls `POST /api/payments/transactions/:transactionId/initiate` with an `Idempotency-Key`.
3. Express validates auth, group membership, payer ownership, transaction state, and request shape.
4. The backend creates or reuses a `Payment` document.
5. The backend calls Hyperswitch and stores provider IDs, client secret, status, and metadata.
6. React receives checkout data only. It never marks payment success.
7. Hyperswitch posts to `POST /api/webhooks/hyperswitch`.
8. Express verifies HMAC-SHA512 signature and timestamp tolerance.
9. The webhook is logged in `WebhookLog` and deduplicated through `PaymentEvent`.
10. A succeeded provider event calls the existing SplitChill settlement engine through `applyProviderPaymentResult`.
11. The settlement updates `Transaction`, group balances, fairness score, user stats, and bounded `fairnessHistory`.
12. Socket.io emits `transaction:updated`, `fairness:changed`, `payment:updated`, and `group:updated` to `group:{groupId}`.
13. Textbee sends OTP and payment alert SMS through a reusable service with `SmsLog` persistence and retry metadata.

The software layer is free/open-source friendly: MongoDB, Redis, Socket.io, Express, Textbee REST integration, and self-hosted Hyperswitch. Payment processors and SMS carrier usage can still have external costs, but SplitChill does not depend on a paid SaaS orchestration layer.

## 2. Folder Structure

```text
server/src/config/env.js
server/src/controllers/payment.controller.js
server/src/controllers/webhook.controller.js
server/src/jobs/paymentReconciliation.job.js
server/src/jobs/smsRetry.job.js
server/src/middleware/admin.js
server/src/models/AuditLog.js
server/src/models/OtpChallenge.js
server/src/models/Payment.js
server/src/models/PaymentEvent.js
server/src/models/SmsLog.js
server/src/models/WebhookLog.js
server/src/routes/payment.routes.js
server/src/routes/webhook.routes.js
server/src/services/audit.service.js
server/src/services/payment.service.js
server/src/services/sms.service.js
client/src/api/payments.js
client/src/components/PaymentStatusPanel.jsx
server/tests/paymentInfrastructure.test.js
server/tests/fixtures/hyperswitchWebhook.js
```

The codebase is currently JavaScript/CommonJS, so this implementation stays in the existing style instead of introducing a partial TypeScript island.

## 3. MongoDB Schemas

Added collections:

`payments`

- Links `transaction`, `group`, `payer`, and `receiver`.
- Stores provider, provider payment/session IDs, checkout URL, client secret with `select: false`, amount, currency, idempotency key, retry data, failure data, and reconciliation timestamps.
- States: `pending`, `processing`, `succeeded`, `failed`, `cancelled`, `reconciled`.

`payment_events`

- Immutable provider event ledger.
- Unique `(provider, providerEventId)` prevents duplicate webhook application.
- Stores status before/after and raw provider payload.

`sms_logs`

- Stores recipient, purpose, provider message ID, delivery state, attempts, errors, retry time, and linked payment/transaction/group.

`webhook_logs`

- Stores raw provider payload, headers, signature status, processing state, event ID, and errors.

`audit_logs`

- Stores actor, action, resource, group, IP, user agent, and metadata.

`otp_challenges`

- Stores hashed OTP only, phone, purpose, attempts, expiry, and verification timestamp.

Important indexes:

```js
payments: { idempotencyKey: 1 } unique
payments: { group: 1, createdAt: -1 }
payments: { transaction: 1, status: 1 }
payments: { status: 1, nextRetryAt: 1 }
payment_events: { provider: 1, providerEventId: 1 } unique
payment_events: { group: 1, createdAt: -1 }
sms_logs: { status: 1, nextRetryAt: 1 }
webhook_logs: { provider: 1, eventId: 1 } unique
audit_logs: { resourceType: 1, resourceId: 1, createdAt: -1 }
transactions: { group: 1, status: 1, createdAt: -1 }
```

`fairnessHistory` is now trimmed to the newest 200 snapshots after expense and settlement application.

## 4. Environment Variables

Defined in `server/.env.example` and validated by `server/src/config/env.js`.

Required baseline:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/splitchill
MONGODB_URI=mongodb://127.0.0.1:27017/splitchill
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-strong-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-strong-random-secret
REDIS_URL=redis://127.0.0.1:6379
SOCKET_REDIS_URL=redis://127.0.0.1:6379
HYPERSWITCH_BASE_URL=http://localhost:8080
HYPERSWITCH_API_KEY=replace-with-hyperswitch-api-key
HYPERSWITCH_WEBHOOK_SECRET=replace-with-payments-response-hash-key
HYPERSWITCH_WEBHOOK_TOLERANCE_MS=300000
TEXTBEE_BASE_URL=https://api.textbee.dev/api/v1
TEXTBEE_API_KEY=replace-with-textbee-api-key
TEXTBEE_DEVICE_ID=replace-with-textbee-device-id
TEXTBEE_WEBHOOK_SECRET=replace-with-textbee-webhook-secret
OTP_TTL_MS=300000
OTP_RATE_LIMIT_PER_15_MIN=3
PAYMENT_RECONCILIATION_INTERVAL_MS=300000
SMS_RETRY_INTERVAL_MS=120000
SMS_MAX_ATTEMPTS=5
```

In production, the env loader requires Hyperswitch and Textbee secrets. Development can run with a dev Hyperswitch response when no API key is present.

## 5. Service Layer

`server/src/services/payment.service.js`

- `initiatePayment(actorId, transactionId, payload)`
- `handleHyperswitchWebhook({ rawBody, headers, payload })`
- `getPayments(userId, query)`
- `getPaymentEvents(userId, paymentId, query)`
- `verifyHyperswitchSignature(rawBody, signature)`
- `isHyperswitchReplay(headers, payload)`
- `hyperswitchStatusToLocal(status, eventType)`

`server/src/services/sms.service.js`

- `sendSms(payload)`
- `startOtp(userId, phone)`
- `verifyOtp(userId, challengeId, code)`
- `resendSms(actorId, smsLogId)`
- `handleTextbeeWebhook(rawBody, headers, payload)`
- `getSmsRetryDelayMs(attempts)`

`server/src/services/audit.service.js`

- `writeAudit(payload)`

The existing settlement logic remains in `transaction.service.js`; payment success calls `applyProviderPaymentResult`, which uses `applySettlementToGroup`.

## 6. Controllers

`payment.controller.js`

- Requires `Idempotency-Key` for payment initiation.
- Starts payments, fetches payment pages/events, starts/verifies OTP, and supports admin SMS resend.
- Writes audit logs for payment and OTP actions.

`webhook.controller.js`

- Receives raw webhook body preserved by Express JSON `verify`.
- Delegates Hyperswitch and Textbee provider-specific verification to services.

## 7. Routes

Mounted under `/api`:

```text
POST /payments/transactions/:transactionId/initiate
GET /payments
GET /payments/:id/events
POST /payments/otp/start
POST /payments/otp/verify
POST /payments/sms/:id/resend
POST /webhooks/hyperswitch
POST /webhooks/textbee
```

Webhook routes are intentionally mounted before auth middleware. They authenticate through provider signatures, not user JWTs.

## 8. Hyperswitch Integration

Create payment:

```js
POST `${HYPERSWITCH_BASE_URL}/payments`
headers:
  api-key: HYPERSWITCH_API_KEY
  Idempotency-Key: payment.idempotencyKey
body:
  amount: amountMinor
  currency: "INR"
  confirm: false
  capture_method: "automatic"
  return_url: `${CLIENT_URL}/transactions?payment=${payment._id}`
  metadata: { paymentId, transactionId, groupId, app: "SplitChill" }
```

Local development without a Hyperswitch key returns a deterministic dev payment ID/client secret so the rest of the app can be exercised.

Payment state:

```text
pending -> processing -> succeeded -> transaction completed
pending -> failed
pending -> cancelled
processing -> failed
succeeded -> reconciled
```

The frontend only receives `checkout.clientSecret`, provider payment ID, checkout URL, and current status.

## 9. Textbee Integration

Send SMS:

```js
POST `${TEXTBEE_BASE_URL}/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`
headers:
  x-api-key: TEXTBEE_API_KEY
body:
  recipients: [recipient]
  message
```

SMS purposes:

- `otp`
- `payment_initiated`
- `payment_success`
- `payment_failed`
- `admin_notification`
- `admin_resend`

Every send attempt creates an `SmsLog`. Failed sends store error, attempts, and `nextRetryAt`.

OTP security:

- 6 digit random code.
- Stored as bcrypt hash.
- TTL index through `expiresAt`.
- Attempt capped.
- Request rate limited per user.

## 10. Webhook Verification

Hyperswitch:

- Reads `req.rawBody`.
- Verifies `x-webhook-signature-512` using `HMAC-SHA512(rawBody, HYPERSWITCH_WEBHOOK_SECRET)`.
- Rejects stale timestamps from `x-webhook-timestamp`, `x-hyperswitch-timestamp`, `x-event-timestamp`, or payload timestamp when outside `HYPERSWITCH_WEBHOOK_TOLERANCE_MS`.
- Logs `WebhookLog`.
- Deduplicates with unique `(provider, providerEventId)` in `PaymentEvent`.
- Never double-applies settlement.

Textbee:

- Optional `TEXTBEE_WEBHOOK_SECRET`.
- Verifies `x-signature` with HMAC-SHA256 over raw body.
- Updates `SmsLog` delivery state when provider callback data matches a provider message ID.

## 11. Socket Integration

Existing group rooms remain the realtime boundary:

```text
group:{groupId}
```

Payment emits:

```text
payment:initiated
payment:updated
transaction:updated
fairness:changed
group:updated
```

`server/src/socket/socketHub.js` now optionally attaches `@socket.io/redis-adapter` using `SOCKET_REDIS_URL` or `REDIS_URL`. If Redis is unavailable, local development continues with the in-memory adapter.

Frontend:

- `PaymentStatusPanel` listens to `payment:initiated` and `payment:updated`.
- Existing `LiveDataContext` still handles broad group refreshes.
- Payment pages should gradually move to a smaller query cache pattern such as React Query or Zustand-backed slices to avoid rerender storms in the monolithic context.

## 12. Cron/Retry System

`paymentReconciliation.job.js`

- Finds stale `pending`/`processing` Hyperswitch payments.
- Fetches provider status.
- Creates reconciliation `PaymentEvent`.
- Calls `applyProviderPaymentResult` for succeeded/failed states.
- Marks succeeded reconciliations as `reconciled`.

`smsRetry.job.js`

- Finds failed SMS logs due for retry.
- Uses capped exponential backoff.
- Stops at `SMS_MAX_ATTEMPTS`.

Future dead-letter upgrade:

- Add `dead_letter_logs` or mark `SmsLog.status = "dead_lettered"` after max attempts.
- Alert admins on unreconciled payments older than the business SLA.

## 13. Docker Setup

Main Compose includes:

- `mongo`
- `redis`
- `server`
- `client`

Start local stack:

```bash
docker compose up -d
```

Hyperswitch is intentionally run from its official self-hosted repo:

```bash
git clone https://github.com/juspay/hyperswitch
cd hyperswitch
docker compose --file docker-compose-development.yml up -d
```

Then set:

```env
HYPERSWITCH_BASE_URL=http://localhost:8080
```

Local webhook exposure:

```text
https://your-tunnel.example.com/api/webhooks/hyperswitch
https://your-tunnel.example.com/api/webhooks/textbee
```

Production:

- Terminate HTTPS at Render/VPS reverse proxy.
- Use HTTPS-only webhook URLs.
- Set production secrets in the platform secret manager.
- Run exactly one reconciliation worker, or move jobs to a dedicated worker process with distributed locks.

## 14. Testing

Implemented:

```bash
cd server
npm test
```

Current tests cover:

- Hyperswitch signature pass/fail.
- Hyperswitch status mapping.
- Webhook timestamp replay detection.
- SMS retry backoff.
- Existing realtime pagination deduplication.

Fixtures:

```text
server/tests/fixtures/hyperswitchWebhook.js
```

Recommended integration tests next:

- Create pending settlement, initiate payment, assert `Payment` and `PaymentEvent`.
- Send signed succeeded webhook, assert transaction `completed`.
- Send duplicate succeeded webhook, assert fairness is applied once.
- Send failed webhook, assert transaction `failed`.
- Assert socket emits on success.
- Start OTP, verify OTP, assert phone is stored with `phoneVerifiedAt`.

Verification already run:

```text
server: npm test
client: npm run build
```

NPM audit currently reports two moderate vulnerabilities after updating the lockfile; review before production release.

## 15. Production Readiness Checklist

- Configure real Hyperswitch API key and webhook secret.
- Configure Textbee device, API key, and webhook secret.
- Use strong distinct `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Move auth tokens from `localStorage` to httpOnly, secure, SameSite cookies.
- Use Redis adapter before horizontal Socket.io scaling.
- Add distributed lock for reconciliation when running more than one server.
- Add admin screens for `payments`, `payment_events`, `sms_logs`, `webhook_logs`, and `audit_logs`.
- Add alerting for failed webhooks, dead-letter SMS, unreconciled payments, and provider API errors.
- Keep `fairnessHistory` bounded or migrate snapshots to a separate collection.
- Add request IDs and structured log correlation across API, webhook, job, and socket paths.
- Never accept frontend success callbacks as payment success.
