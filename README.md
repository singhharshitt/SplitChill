# SplitChill 💸
### Because Equal ≠ Fair

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-0ea5e9?style=for-the-badge)](#-tech-stack)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-16a34a?style=for-the-badge)](#-tech-stack)
[![Database](https://img.shields.io/badge/Database-MongoDB-10b981?style=for-the-badge)](#-tech-stack)
[![AI](https://img.shields.io/badge/AI-Groq%20LLMs-8b5cf6?style=for-the-badge)](#-ai-integration)
[![OCR](https://img.shields.io/badge/OCR-OCRSpace%20%2B%20Tesseract-f59e0b?style=for-the-badge)](#-ocr-receipt-scanning)

SplitChill is a fairness-powered expense splitting platform that goes beyond equal splits. It uses a real-time fairness engine, AI-powered recommendations via Groq LLMs, and OCR receipt scanning to make group finance truly equitable.

---

## 🚀 Features

### Core Expense Splitting
- **Equal split** — divide evenly among participants
- **Income-based split** — weighted by income level
- **Usage-based split** — weighted by consumption
- **AI-recommended split** — Groq LLM analyzes group context and recommends optimal shares
- **Custom split** — manual allocation

### Fairness Engine
- Dynamic Fairness Score (0-100) for every group
- Tracks payment behavior, usage patterns, and settlement delays
- AI-powered fairness explanations via Groq Qwen 3 32B

### AI Integration (Groq)
- **Split Recommendations** — Llama 4 Maverick analyzes income, history, and balance to recommend shares
- **Fairness Explanations** — Qwen 3 32B generates human-readable fairness assessments
- **Predictive Suggestions** — Llama 4 Scout predicts next expenses and suggests who should pay
- **Analytics Summaries** — Llama 3.3 70B generates natural-language dashboard insights
- Structured prompt templates with JSON output parsing
- Automatic fallback chain if primary model is unavailable

### OCR Receipt Scanning
- Upload receipt images (JPEG, PNG, WebP, PDF)
- **OCRSpace** cloud API for primary extraction
- **Tesseract.js** local fallback when cloud is unavailable
- Automatic field extraction: merchant, date, total, line items
- Confidence scoring and manual correction support

### Real-Time Collaboration
- Socket.io authenticated connections
- Live chat between group members
- Typing indicators and online/offline presence
- Instant message delivery and persistence
- Reconnect recovery with message backfill
- Real-time balance and fairness updates across users

### Predictive Suggestions
- Suggests who should pay next based on contribution patterns
- Recommends optimal split types for group health
- Settlement optimization to minimize transactions

### Analytics Dashboard
- Spending trends and expense velocity
- Contribution imbalance visualization
- Fairness score trendline
- AI-generated summary cards

### Payment Integration
- HyperSwitch payment gateway for automated settlements
- UPI deep link generation for manual settlements
- Webhook-verified payment confirmation
- Atomic balance updates via MongoDB transactions
- Idempotent payment reconciliation

---

## 🧠 How It Works

### 1. Problem
Traditional split apps assume everyone should pay equally. Real life is different:
- incomes are different
- usage is different
- effort and indirect contributions are different

### 2. Fairness Engine
Instead of forcing equal splits, SplitChill computes contextual shares using:
- income factor
- participation level
- prior contribution ratio
- payment consistency

### 3. AI Layer
When users select "AI-recommended" split, the backend sends group context to Groq LLMs which analyze history and return optimized share allocations with explanations. If AI is unavailable, the fairness engine provides deterministic fallback.

### 4. OCR Pipeline
Users can upload receipt images. The backend runs OCRSpace (or Tesseract.js fallback) to extract text, then parses merchant, date, total, and line items using pattern matching.

---

## 🏗️ Tech Stack

### Frontend
- React
- Tailwind CSS
- Chart.js
- Socket.io Client

### Backend
- Node.js + Express
- Mongoose (MongoDB)
- Socket.io
- Multer (file uploads)

### AI & OCR
- Groq API (LLM inference)
- OCRSpace API (cloud OCR)
- Tesseract.js (local OCR fallback)

### Payments
- HyperSwitch (payment gateway)
- UPI deep links

### Database
- MongoDB (with replica set for transactions)

### DevOps
- Docker Compose
- Render.yaml

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (local, Docker, or Atlas)

### 1) Clone the repository
~~~bash
git clone https://github.com/singhharshitt/SplitChill.git
cd SplitChill
~~~

### 2) Backend setup
~~~bash
cd server
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
~~~

### 3) Frontend setup
~~~bash
cd client
npm install
npm run dev
~~~

### 4) Environment variables
~~~env
# Required
DB_URI=mongodb+srv://...
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret

# AI (Groq)
groq=gsk_your_groq_api_key

# OCR
OCRSPACE=your_ocrspace_key

# Payments
HyperID=your_hyperswitch_api_key
HYPERSWITCH_BASE_URL=https://api.hyperswitch.io

# Optional
Mistral=your_mistral_key
REDIS_URL=redis://127.0.0.1:6379
~~~

---

## 🐳 Docker Setup

~~~bash
docker compose up --build
~~~

Services: client, server, mongo (replica set), redis.

---

## 🔌 API Endpoints

### Health
- `GET /api/health` — service status + MongoDB state
- `GET /api/health/ready` — readiness probe (503 when DB is down)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh` — httpOnly cookie-based
- `POST /api/auth/logout`

### Groups
- `GET /api/groups`
- `POST /api/groups`
- `GET /api/groups/:id`
- `POST /api/groups/:id/add-member`

### Expenses
- `POST /api/groups/:id/expenses`
- `GET /api/groups/:id/expenses`

### AI & Fairness
- `GET /api/groups/:id/fairness` — score + AI explanation
- `POST /api/groups/:id/recommend-split` — AI-powered recommendation

### OCR
- `POST /api/groups/:id/scan-receipt` — upload receipt image

### Analytics & Predictions
- `GET /api/groups/:id/analytics` — data + AI summary
- `GET /api/groups/:id/suggestions` — engine + AI predictions

### Chat
- `GET /api/groups/:id/chat/messages`
- `POST /api/groups/:id/chat/messages`

### Transactions & Payments
- `POST /api/settle`
- `PATCH /api/transactions/:id/confirm`
- `GET /api/transactions`

---

## 🧪 Future Enhancements

- Advanced ML fairness model with explainable outputs
- Native mobile app (React Native)
- Multi-currency support
- Role-based group governance
- Read receipts for chat

---

## 👨‍💻 Author

Harshit Singh

- GitHub: https://github.com/singhharshitt
- Project: SplitChill

If you found this project useful, consider starring the repository.
