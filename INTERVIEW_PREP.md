# SplitChill — Interview Preparation Report

Grounded entirely in the final codebase (commit state at time of writing). Read this before your
Accenture technical interview.

---

## 1. What problem does SplitChill solve?

Group expenses split "equally" are often unfair — people eat differently, earn differently, and
forget who paid last. SplitChill tracks real amounts in MongoDB, offers five split models (equal,
income-based, usage-based, custom, AI-recommended), computes exactly who owes whom, and lets
members settle directly through UPI without the app ever collecting money. Balance integrity is the
core engineering problem: every expense edit, deletion, and settlement must leave a mathematically
consistent group state.

## 2. Complete architecture

```
React 19 SPA (Vite, Tailwind 4, Axios, Socket.io-client)
        │  REST (JWT bearer)            │  Socket.io events
        ▼                               ▼
Express 5 API ── middleware: helmet → CORS allow-list → rate-limit → JWT protect → zod validate
        │
        ├── services/  (business logic: expense, fairness, prediction, chat, ai, ocr, upi, transaction)
        ├── models/    (Mongoose: User, Group, Expense, Transaction, ChatMessage, AuditLog)
        └── MongoDB 9 (replica set in dev → session transactions for atomic balance updates)
```

Key structure decisions:
- **Route → zod schema → controller → service → model.** Controllers are thin; services own rules.
- `client/src/context/LiveDataContext.jsx` merges REST snapshots with socket events so all pages see
  the same live state.
- Group membership is re-checked server-side on every group-scoped operation (`ensureMembership`).

## 3. How an expense flows from React → Express → MongoDB

1. User fills the split form in the client; the client calls
   `POST /api/groups/:id/expenses` with `{ title, amount, splitType, participants[] }`.
2. Middleware chain: JWT `protect` identifies the user; the zod `expense` schema bounds every field
   (amount > 0 and ≤ 1 crore, ≤ 50 participants, participant ids must be Mongo ObjectIds).
3. `expense.service.addExpense(dto)` re-verifies group membership, validates that participants are
   actual group members, and rejects custom splits whose shares don't sum to the amount.
4. The fairness engine allocates shares in **integer paisa** and reconciles the total exactly.
5. `applyExpenseToGroup` updates the payer's `totalPaid`, each member's `totalShare`, and
   `netBalance` on the Group document; the expense and group are persisted in one session/transaction.
6. Emit `expense:created` / `fairness:changed` over Socket.io; live UI updates for everyone.

## 4. How equal and custom splits are calculated

All money math lives in `server/src/utils/fairnessEngine.js`:

- **equal**: convert amount to paisa (`round × 100`), integer-divide by participant count, then
  distribute the leftover paisa one per member. Result: shares sum to the **exact** amount — e.g.
  ₹100 across 3 members → 3333 + 3333 + 3334 paisa, never 33.33 × 3 = 99.99 of drift.
- **custom**: every participant carries an explicit share; `assertCustomShares` rejects the request
  unless Σ share === amount (2-decimal exact).
- **income-based / usage-based**: proportional weights with the same paisa-reconciliation sweep.

`roundMoney()` is the only approved way to round money; raw float arithmetic never touches balances.

## 5. How outstanding balances and settlements are calculated

`netBalance = totalPaid − totalShare` per member, stored denormalized on the Group. Outstanding debt
"X owes Y" = `min(X's negative balance flipped, Y's positive balance)` — recomputed
**server-side** at settlement time (`outstandingDebt`), never taken from the client. A settlement
over the outstanding amount is rejected (400). When the receiver confirms, `applySettlementToGroup`
moves `amount` from the payer's to the receiver's `netBalance` inside a Mongo session that re-reads
the transaction status first, so two concurrent confirmations cannot double-apply (the loser gets a
409). Settlement state machine: `pending → reported_paid → recipient_confirmed`, either early state
can `cancel`.

## 6. How Groq model routing and fallback handling work

One service (`server/src/services/ai.service.js`) owns all AI calls:

- A routing table maps a *task* (`split-recommendation`, `fairness-explanation`,
  `predictive-suggestions`, `analytics-summary`, `app-assistant`) to a primary + fallback model
  (current production Groq models, verified against Groq's docs/deprecations list).
- `callModel(task, sys, user)` loops primary → fallback, logging per-model failures, and returns a
  structured `{ text, model, usage }` or `{ text: null, error }` — no key, no crash.
- JSON tasks run with Groq's `response_format: json_object` and go through `parseJsonResponse`,
  which strips markdown fences and returns `null` on any parse failure.

## 7. How chatbot and prediction requests are handled

- **Chatbot** `POST /api/ai/chat`: zod-validated message (≤ 1000 chars), then the controller loads
  only *user-authorized* context (their groups, their last 8 transactions) into a compact prompt.
  The app-assistant system prompt locks scope to SplitChill topics with strict "never touch data /
  never reveal secrets" rules; output is sanitized (whitespace-collapsed, 900 chars) and if the
  model returns nothing a canned, feature-aware fallback replies. `fallback: true` is surfaced so
  the UI can label it.
- **Predictions** `GET /api/groups/:id/suggestions`: first the engine produces **facts** from real
  balances (settlement plan, next payer, expected imbalance) tagged `source: "historical-calculation"`.
  Only when ≥1 recent expense exists does it call Groq, tagging results
  `source: "ai-recommendation"`. Zero history returns an explicit `insufficientData` message — the
  model never gets to invent records.

## 8. How OCRSpace and Tesseract.js work together

`POST /api/groups/:id/scan-receipt` requires membership; multer + service both enforce type/size
(JPEG/PNG/WebP/BMP/TIFF/PDF, ≤ 5 MB). `extractText()`: OCRSpace first when `OCRSPACE_API_KEY` is
set; on error/empty result it falls back to local Tesseract.js. PDFs need the cloud key
(Tesseract can't read PDFs) and the API returns an explicit, actionable error for that case.
`parseReceiptFields()` regex-parses merchant, total (ignores subtotals), tax, date, and line items,
then `analyzeReceiptDetection()` scores confidence and refuses (`422`) non-receipt images. The
client shows every extracted field for manual correction — OCR can create **nothing** by itself and
can never trigger a settlement.

## 9. How UPI intent and QR generation work

`server/src/services/upi.service.js` builds a standard UPI intent:
`upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tr=<txref>`, with the receiver's saved/validated
UPI id (`name@bank` VPA regex), the server-computed amount (`toFixed(2)`), and the SplitChill
transaction id as the `tr` reference. `qrcode.toDataURL()` renders the PNG QR. On the client,
`PaymentStatusPanel` shows payee name + VPA + amount for review, the QR, and an "open UPI app"
deep-link. No gateway, no merchant account, no credentials in the browser.

## 10. What the settlement status proves — and what it does not

- `pending` — a settlement record exists; nothing has happened.
- `reported_paid` — *the payer's claim* that they sent money. Proof level: none.
- `recipient_confirmed` — *the receiver's claim* that money arrived; this is what triggers the
  balance transfer. Proof level: user-confirmed, **not bank-verified**.
- Opening the UPI app, returning to the site, a screenshot, or a UPI reference string does **not**
  prove a bank transfer happened. Balances change only on the receiver's confirmation, applied
  exactly once; both parties can cancel until confirmed. (Future: a properly authorized provider
  API could add real verification behind an isolated payment-provider service.)

## 11. Security considerations and trade-offs

- **Authorization before data**: JWT on every protected route; group membership re-verified in the
  service layer, so knowing someone's group id buys nothing.
- **Server-side money truth**: amounts, debts, and splits are recomputed from authoritative data;
  AI output is sanitized, reconciled, and can only *suggest* — client status strings can't mark
  money as settled.
- **Secrets stay server-side**: Groq and OCRSpace keys live in server env only.
- **Rate limiting on auth** (register/login) + zod input bounds + Helmet + strict CORS.
- **Trade-off accepted**: denormalized group balances scale great but require disciplined
  recalculation on every mutation (paid off via engine functions + transactions). Settlement
  verification is testimonial rather than cryptographic (the direct member-to-member UPI trade-off:
  no merchant fees/KYC, but no bank truth). Mongo session transactions require a replica set in dev
  (Docker compose runs one).

---

## Five likely interview questions (with answers)

**Q1. "How do you prevent floating-point rounding errors in money calculations?"**
*A:* All money is handled in integer paisa in the fairness engine — split allocation divides paisa
and distributes the remainder one paisa at a time, and a single `roundMoney()` helper rounds interim
values. Shares are then asserted to sum exactly to the amount (custom splits are rejected at 400
otherwise). Balances are updated by the same engine functions, so no drift can compound across
expenses. Unit tests lock this in for awkward amounts like ₹333 and ₹999.99.

**Q2. "A user edits or deletes an expense — how do balances stay correct?"**
*A:* The service loads the persisted expense, removes its old effect on the group (`undo` side of
`applyExpenseToGroup`), validates the new payload exactly like creation, applies the new effect, and
saves expense + group in one Mongo session/transaction. Deletion is just removal + persistence.
Members can't see stale balances because the recalculation emits `fairness:changed` over Socket.io.
Participant share sums and membership are re-validated on every edit.

**Q3. "What happens when the Groq API is down or returns garbage?"**
*A:* Three layers. (1) Transport: `callModel` tries the task's fallback model, logging failures,
and returns `{ text: null, error }` instead of throwing. (2) Parsing: `parseJsonResponse` returns
null unless the JSON actually parses. (3) Semantics: split recommendations are sanitized — unknown
participant ids dropped, shares clamped, drift reconciled — and if the AI result isn't usable, the
deterministic fairness engine computes the split. Predictions with no history never even call the
model; they return `insufficientData`. The chatbot falls back to feature-aware canned answers.

**Q4. "Can one user read or modify another user's group? Walk me through the enforcement."**
*A:* No. Three gates: the JWT middleware resolves the caller; group-scoped routes accept `:id` but
the service calls `ensureMembership(group, userId)` before any read/write, so an ObjectId you don't
belong to 404s; and sensitive mutations (settlement report/confirm/cancel) additionally check that
the actor is the payer/receiver or participant. OCR scans, expenses, chat, analytics — all go
through the same guard. IDs guessed from another group are useless.

**Q5. "Your settlement 'succeeded' — does that mean the bank verified the money moved?"**
*A:* No, and the UI says exactly that. The state `recipient_confirmed` means the receiver clicked
"I received the payment"; `reported_paid` means the payer claims they sent it. There is no webhook
or bank API in the direct member-to-member UPI flow: we generate a `upi://pay` intent + QR with the
receiver's saved VPA and the server-verified amount, but UPI gives the app no callback. Balances
settle only on the receiver's confirmation, exactly once (a session transaction re-reads the status
to block concurrent double-confirms with a 409), and either side can cancel beforehand. If we later
integrate a provider API with true verification, it goes behind an isolated payment-provider
service — the direct flow stays as the fallback. UPI PINs are never collected.

---

### Demo one-liners (30 seconds each)

- **Split fairness:** "Equal ≠ fair. Income-based and AI splits reconcile to the paisa; AI output
  is only ever a suggestion the backend re-validates."
- **Settlement honesty:** "We never touch money — we generate the UPI intent, and only the
  receiver's confirmation changes balances."
- **Resilience:** "Missing AI key? Deterministic engine. Missing OCR key? Local Tesseract.
  MongoDB down? API keeps serving and retries."
