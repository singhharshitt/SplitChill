# SplitChill — Because Equal ≠ Fair

SplitChill is a full-stack group expense manager for Indian users. It lets friends track shared
expenses in groups, split them fairly (not just equally), see exactly who owes whom, and settle
debts directly through UPI — without the app ever collecting money itself.

```
SplitChill/
├── client/   React 19 + Vite + Tailwind CSS 4 frontend (SPA)
├── server/   Node.js + Express 5 + MongoDB/Mongoose 9 backend API
├── docker-compose.yml          # local dev: mongo (replica set) + redis (optional) + server + client
├── docker-compose.prod.yml     # production build
└── render.yaml                 # Render deployment blueprint (API + static client)
```

---

## Verified features

These are implemented and exercised by the automated tests plus manual API verification:

- **Authentication** — email/password registration and login, JWT access + refresh tokens,
  rate-limited auth routes, protected API surface (everything after `/api/auth/*` requires a token).
- **Groups** — create groups, add existing members by searching registered users, direct 1:1 chats,
  per-group authorization checks on every route (group membership is re-verified server-side for
  every read and write — you cannot access or modify a group you are not a member of).
- **Expenses** — create, list (cursor-paginated), edit, and delete expenses with automatic,
  recalculation of every member's contribution, share and net balance after each change.
- **Splitting** — `equal`, `income-based`, `usage-based`, `custom`, and `ai-recommended`. All money
  math runs through a rounding helper that reconciles shares to the exact rupee (2-decimal) amount;
  custom splits must sum to the expense total (± 1 paisa tolerance is *not* accepted — they must
  reconcile exactly, See "Money correctness" below).
- **Balances & fairness** — a fairness engine computes contributions, shares, net balances,
  outstanding debts, a 0–100 fairness score, and a debt-settlement plan (who should pay whom, how
  much) from authoritative group data.
- **Settlements (UPI / manual)** — payer→receiver settlement records with
  `pending → reported_paid → recipient_confirmed` (or `cancelled`) states, server-recomputed
  outstanding debt, duplicate-confirmation protection, balance updates applied exactly once inside
  a MongoDB session/transaction.
- **AI (Groq, multi-model)** — split recommendations (validated + reconciled server-side), fairness
  explanations, predictive suggestions, analytics summaries, and an in-app assistant. All of them
  degrade to deterministic fallbacks when `GROQ_API_KEY` is missing or the model output is invalid.
- **OCR receipt scanning** — OCRSpace (cloud, optional key) with Tesseract.js (local) fallback;
  extracted merchant/total/date/tax/items are shown to the user for correction before an expense is
  saved. OCR results never auto-create or auto-settle an expense.
- **Real-time** — Socket.io for group chat, typing indicators, presence, live expense/transaction
  and fairness updates. Works single-instance without Redis; optional Redis adapter for scaling.
- **Payments context** — a settlement creates a transaction record that payment status hangs off:
  a settlement is never "verified money movement"; the receiver's in-app confirmation is the only
  trigger that settles balances.

## Removed integrations

The following were removed and their routes, jobs, webhooks, envs and docs are gone:

- **HyperSwitch payment gateway** (merchant payment collection, reconciliation job, webhooks) →
  replaced by the direct member-to-member UPI intent + QR flow.
- **TextBee SMS notifications** (delivery service, retry job, webhook, `SmsLog` model).

---

## Technology stack

| Layer     | Tech                                                                 |
|-----------|----------------------------------------------------------------------|
| Frontend  | React 19.2, Vite 7, Tailwind CSS 4, React Router 7, Axios, Chart.js, Socket.io client |
| Backend   | Node.js (ES modules-free CommonJS), Express 5, Zod 4 validation, Helmet, CORS allow-list, express-rate-limit |
| Data      | MongoDB, Mongoose 9 (index bootstrapping at startup)                 |
| Real-time | Socket.io 4 (optional Redis adapter)                                 |
| AI        | Groq OpenAI-compatible chat completions API (`GROQ_API_KEY`, server-side only) |
| OCR       | OCRSpace REST API (optional) + Tesseract.js 7 (bundled, local)        |
| Payments  | Standard `upi://pay` intent URIs + `qrcode` QR generation (no payment SDK) |

---

## Architecture & request flow

1. **React SPA** (`client/`) — pages for dashboard, groups, expenses, settlements/transactions,
   analytics, chat, profile. All API calls go through [client/src/api](client/src/api) helpers; live
   updates flow through a single `LiveDataContext` fed by REST + Socket.io.
2. **Express API** (`server/`) — route → Zod validation middleware → controller → service → model.
   Authorization (`protect` JWT middleware + `ensureMembership` service guard) is applied on every
   group-scoped route; users can never reach another user's group data by guessing IDs.
3. **MongoDB** — Mongoose models: `User`, `Group`, `Expense`, `Transaction`, `ChatMessage`,
   `AuditLog`. Group documents hold per-member denormalized balances (`totalPaid`, `totalShare`,
   `netBalance`, `incomeSnapshot`, `underpaymentStreak`) that are recalculated on every expense and
   settlement mutation, inside a MongoDB session/transaction where supported (Docker compose runs
   Mongo as a single-node replica set precisely for transaction support).

### Money correctness

All money math lives in [`server/src/utils/fairnessEngine.js`](server/src/utils/fairnessEngine.js)
with a single `roundMoney()` helper (2-decimal, banker-style rounding). Split share allocation
works with integer paisa so `equal` and `income-based` splits always sum to **exactly** the expense
amount — no floating-point drift can leak into balances. Custom splits are validated against the
same rule server-side (`assertCustomShares`).

### How splits are calculated

- **equal** — amount × 100 paisa divided evenly; remainders distributed one paisa at a time.
- **custom** — every participant gets an explicit share; rejected unless Σshare = amount.
- **income-based** — shares proportional to each member's income snapshot (higher earners carry
  proportionally more); reconciled to the total the same way.
- **usage-based** — shares proportional to each member's declared usage (e.g. portions of groceries).
- **ai-recommended** — Groq proposes shares; the backend then *re-validates* them: unknown
  participant IDs are dropped, shares are clamped into `[0, amount]`, and any drift is reconciled
  exactly. If the AI output is unusable, the deterministic engine result is returned instead — AI
  output can never override backend financial validation.

### How balances & settlements work

Every expense mutation calls `applyExpenseToGroup`, which adjusts `totalPaid` (payer), per-member
`totalShare`, and `netBalance = totalPaid − totalShare`. The debt a member owes the group is simply
the negative part of their `netBalance`. On settlement:

1. The client proposes `{ groupId, payer, receiver, amount }`.
2. The server **recomputes** the outstanding debt from group balances (`outstandingDebt`) — client
   amounts are never trusted — and rejects amounts > outstanding debt.
3. If the receiver has a saved UPI ID, the settlement is created as `pending` and returned with a
   `upi://pay` deep link + QR. Otherwise it is a manual (`completed`) settlement applied atomically.
4. The payer can mark it `reported_paid` (their own claim only).
5. The receiver confirms → `recipient_confirmed` → `applySettlementToGroup` adjusts both net
   balances **exactly once**, inside a MongoDB session that re-reads the status to block concurrent
   double-confirmation (409 on duplicates).

### UPI settlement flow (direct member-to-member)

SplitChill never touches money and has no merchant account. A settlement generates a standard
`upi://pay?pa=<payee-vpa>&pn=<name>&am=<amount>&cu=INR&tr=<txref>` intent (see
[`server/src/services/upi.service.js`](server/src/services/upi.service.js)) with the *receiver's*
saved UPI ID, the authoritative amount, and the transaction id as reference. The payer scans the QR
or opens the link in any UPI app (GPay/PhonePe/Paytm/BHIM).

> **What the status proves** — `reported_paid` is the payer's word, `recipient_confirmed` is the
> receiver's word. Neither is bank-verified. Opening the UPI app does not call back to SplitChill.
> A future provider-backed verification (when a properly authorized API is available) would live in
> an isolated payment-provider service; the direct UPI flow remains the fallback.

Users manage their UPI ID in Profile → UPI Settlement (`PATCH /api/users/me`), validated against a
`name@bank` VPA pattern; an empty string clears it. UPI IDs are treated as user-provided payment
destinations, not proof of account ownership — the payer always sees payee name + VPA before paying.
UPI PINs are never collected or stored.

---

## Groq multi-model AI

All AI calls go through one service with a per-task model routing table (primary + fallback per
task), centrally defined in [`server/src/services/ai.service.js`](server/src/services/ai.service.js):

| Task                  | Purpose                                   |
|-----------------------|-------------------------------------------|
| `split-recommendation`| Fair, contextual split shares (JSON)      |
| `fairness-explanation`| Human-readable fairness state             |
| `predictive-suggestions`| Group trend predictions (JSON)          |
| `analytics-summary`   | Natural-language analytics headline       |
| `app-assistant`       | In-app SplitChill chatbot                 |

Behavior guarantees:
- The key stays server-side (`GROQ_API_KEY`); the browser never sees it.
- Every AI path has a **deterministic fallback**: missing key, model error, or invalid JSON returns
  a computed or canned response instead of failing the request.
- Split recommendations are sanitized and reconciled before use (see Money correctness).
- Predictions require actual expense history; with no history the API returns an explicit
  `insufficientData` message instead of invented data, and AI outputs are tagged
  `source: "ai-recommendation"` to distinguish them from balance-derived facts.

---

## OCR processing

`POST /api/groups/:id/scan-receipt` (multipart `receipt` field):

1. **Validation** — JPEG/PNG/WebP/BMP/TIFF/PDF only, ≤ 5 MB, checked in both multer and the
   service; the upload route itself is membership-guarded (you can only scan within your group).
2. **Extraction** — OCRSpace first (when `OCRSPACE_API_KEY` is set); Tesseract.js local fallback.
   PDFs require the cloud key (Tesseract cannot read them) — the API says so explicitly.
3. **Field parsing** — merchant, total (subtotals excluded), tax, date, and line items are parsed
   from the raw text with receipt-level confidence scoring.
4. **Editing before saving** — the client shows extracted fields for the user to correct; nothing
   is auto-saved and OCR can never settle anything.

Without the cloud key the local Tesseract path works for photos (not PDFs); a missing/unreadable
receipt returns a clear 422 error rather than a guess.

---

## Environment variables

Copy `server/.env.example` → `server/.env` and `client/.env.example` → `client/.env`.

### Server (`server/.env`)

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` (or `DB_URI`) | ✅ | MongoDB connection string; use the Docker replica set URI for transactions |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | ✅ (prod) | At least 16 chars, different from each other |
| `JWT_EXPIRES_IN`, `REFRESH_TOKEN_TTL_MS` | optional | Token lifetimes (defaults: 15m / 30d) |
| `PORT` | optional | API port (default 5000) |
| `CLIENT_URL` | optional | CORS origin for the client (default `http://localhost:5173`) |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | optional | API rate limiting |
| `GROQ_API_KEY` | for AI features | Groq key; AI falls back deterministically without it |
| `OCRSPACE_API_KEY` | optional | Cloud OCR; Tesseract works without it (photos only) |
| `REDIS_URL` / `SOCKET_REDIS_URL` | optional | Only for multi-instance socket.io scaling |
| `DEMO_AUTH_ENABLED` | dev only | Enables the demo seed data route |

### Client (`client/.env`)

| Variable | Notes |
|---|---|
| `VITE_API_URL` | API base, e.g. `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket server base, e.g. `http://localhost:5000` |

---

## Installation & startup

### Local Node processes

```bash
# 1. MongoDB — either Docker (replica set for transactions)…
docker compose up mongo redis -d

# 2. Server
cd server && npm install && npm run dev        # http://localhost:5000

# 3. Client (new terminal)
cd client && npm install && npm run dev        # http://localhost:5173
```

### Everything in Docker

```bash
docker compose up --build        # client http://localhost:5173 · API http://localhost:5001
```

If MongoDB is unreachable at boot, the API starts in a development retry mode: HTTP keeps serving
(`/api/health` reports `mongo: disconnected`) and it reconnects automatically.

### Production build & run

```bash
cd client && npm run build                 # dist/ static bundle
cd server && npm start                     # serves the API
# deploy: render.yaml (API + static client) or docker-compose.prod.yml
```

---

## API overview (`/api` prefix)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health`, `/health/ready` | – | Liveness / DB readiness |
| POST | `/auth/register` · `/auth/login` · `/auth/refresh` · `/auth/logout` | mixed | Account lifecycle |
| POST | `/demo/seed` | dev flag | Demo data |
| GET/POST/PATCH | `/users/me` · `/users?search=` | ✅ | Profile (name, income, preferences, UPI ID) |
| GET | `/ai/chat` | ✅ | SplitChill assistant (Groq) |
| GET/POST | `/groups` · `/groups/direct` | ✅ | List/create groups, direct chats |
| POST | `/groups/:id/add-member` | ✅ | Add a registered user |
| GET/POST/PATCH/DELETE | `/groups/:id/expenses[/:expenseId]` | ✅ | Expense CRUD (cursor-paginated list) |
| GET | `/groups/:id/fairness` | ✅ | Fairness score, imbalance, AI explanation |
| POST | `/groups/:id/recommend-split` | ✅ | AI/fairness split recommendation |
| GET | `/groups/:id/analytics` · `/groups/:id/suggestions` | ✅ | Analytics + predictions |
| GET/POST | `/groups/:id/chat/messages` | ✅ | Group chat (paginated + realtime) |
| POST | `/groups/:id/scan-receipt` | ✅ | OCR receipt scan (multipart) |
| POST | `/settle` | ✅ | Create settlement (UPI intent/QR or manual) |
| PATCH | `/transactions/:id/report` · `/:id/confirm` · `/:id/cancel` | ✅ | Settlement state transitions |
| GET | `/transactions?groupId=&status=` | ✅ | Transaction history (paginated) |

Realtime (Socket.io): `chat:message`, `transaction:created/updated`, `fairness:changed`,
`group:updated`, typing + presence events.

---

## Tests & checks

```bash
cd server && npm test      # node --test — 26 passing tests:
                           #   real-time deduplication suite + core-logic suite
                           #   (money math, split reconciliation, UPI intents/QR,
                           #    AI JSON parsing & missing-key fallback, validation
                           #    schemas, OCR field parsing)
cd client && npm run lint  # ESLint (clean)
cd client && npm run build # production build (vite, ~12s)
```

Full end-to-end flows need a reachable MongoDB for registration/login/expenses; the unit suite was
designed to cover the payment/AI/OCR math without one.

## Known limitations

- **Settlement status is user-confirmed, not bank-verified** — `reported_paid` (payer claim) and
  `recipient_confirmed` (receiver confirmation) settle balances by consent, not proof.
- **No web push / email reminders yet** — reminder preferences exist but delivery is not wired to
  an external notification provider.
- **Prediction quality depends on history** — new groups get an explicit "not enough history"
  message instead of AI guesses.
- **PDF receipts need the cloud OCR key** — local Tesseract handles photos only.
- **Horizontal scaling of sockets needs Redis** — single-instance deploys don't.
- pytest-style integration tests against live Mongo endpoints are not in CI; DB-backed flows are
  verified manually and by the pure-logic unit suite.
