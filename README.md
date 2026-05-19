# SplitChill 💸
### Because Equal ≠ Fair

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-0ea5e9?style=for-the-badge)](#-tech-stack)
[![Backend](https://img.shields.io/badge/Backend-Node.js%2020%20%2B%20Express-16a34a?style=for-the-badge)](#-tech-stack)
[![Database](https://img.shields.io/badge/Database-MongoDB%209-10b981?style=for-the-badge)](#-tech-stack)
[![AI](https://img.shields.io/badge/AI-Groq%20LLMs-8b5cf6?style=for-the-badge)](#-ai-integration)
[![Real-time](https://img.shields.io/badge/Real--time-Socket.io%20%2B%20Redis-ec4899?style=for-the-badge)](#-real-time-collaboration)
[![OCR](https://img.shields.io/badge/OCR-OCRSpace%20%2B%20Tesseract-f59e0b?style=for-the-badge)](#-ocr-receipt-scanning)

SplitChill is a fairness-powered expense splitting platform that goes beyond equal splits. It combines a real-time fairness engine, AI-powered recommendations via Groq LLMs, OCR receipt scanning, and integrated payment processing to make group finance truly equitable.

---

## 🚀 Features

### Core Expense Splitting
- **Equal split** — divide evenly among participants
- **Income-based split** — weighted by income level
- **Usage-based split** — weighted by consumption
- **AI-recommended split** — Groq LLM analyzes group context and recommends optimal shares
- **Custom split** — manual allocation per participant

### Fairness Engine
- Dynamic Fairness Score (0-100) for every group
- Tracks payment behavior, usage patterns, and settlement delays
- Contextual share computation using income, participation, and contribution history
- AI-powered fairness explanations via Groq Qwen 3 32B
- Deterministic fallback when AI is unavailable

### AI Integration (Groq)
AI models are routed by task with automatic fallback:

- **Split Recommendations** — Llama 4 Maverick (17B) analyzes income, history, and balance to recommend shares
- **Fairness Explanations** — Qwen 3 32B generates human-readable fairness assessments
- **Predictive Suggestions** — Llama 4 Scout (17B) predicts next expenses and suggests who should pay
- **Analytics Summaries** — Llama 3.3 70B generates natural-language dashboard insights
- **App Assistant** — Llama 3.3 70B powers in-app chatbot assistance

Features:
- Structured prompt templates with JSON output parsing
- Automatic fallback chain if primary model is unavailable
- Rate-limited inference to protect quota

### OCR Receipt Scanning
- Upload receipt images (JPEG, PNG, WebP, PDF)
- **OCRSpace** cloud API for primary extraction
- **Tesseract.js** local fallback when cloud is unavailable
- Automatic field extraction: merchant, date, total, line items
- Confidence scoring and manual correction support

### Real-Time Collaboration
- **Socket.io authenticated connections** with Redis adapter for scaling
- **Live chat** between group members with message persistence
- **Typing indicators** and online/offline presence tracking
- **Instant message delivery** with reconnect recovery and message backfill
- **Real-time balance & fairness updates** propagated to all group members
- **Presence-aware features** — know who's online in your group

### Predictive Suggestions
- Suggests who should pay next based on contribution patterns
- Recommends optimal split types for improving group fairness
- Settlement optimization to minimize transactions
- Data-driven insights powered by group history

### Analytics Dashboard
- Spending trends and expense velocity
- Contribution imbalance visualization
- Fairness score trendline
- AI-generated natural language summary cards
- Real-time updates as expenses are added/settled

### Payment Integration
- **HyperSwitch payment gateway** for automated settlements
- **UPI deep link generation** for manual settlements via mobile payment apps
- **Webhook-verified payment confirmation** for security
- **Atomic balance updates** via MongoDB transactions
- **Idempotent payment reconciliation** to prevent duplicate charges
- **Background payment reconciliation job** for reliability

### SMS Notifications
- **TextBee SMS gateway integration** for real-time payment updates
- Automatic SMS notifications on transaction events
- Configurable retry policy with exponential backoff
- Audit logging for all SMS delivery attempts

### Group Management
- Create and manage groups with custom member roles
- Invite members with OTP verification
- Group-specific fairness settings
- Member contribution tracking and analytics
- Group chat history and audit logs

### Security
- JWT-based authentication with refresh tokens
- httpOnly cookie support for token storage
- Bcrypt password hashing (10 salt rounds)
- Rate limiting (300 requests per 15 minutes by default)
- CORS validation with configurable origins
- Helmet security headers
- Request/response logging with correlation IDs
- Webhook signature verification

---

## 🧠 How It Works

### 1. Problem
Traditional split apps assume everyone should pay equally. Real life is different:
- Incomes vary
- Usage patterns differ
- Effort and indirect contributions are unequal
- Settlement fairness depends on context

### 2. Fairness Engine
Instead of forcing equal splits, SplitChill computes contextual shares using:
- **Income factor** — users earn different amounts
- **Participation level** — some contribute more to group decisions
- **Prior contribution ratio** — historical payment patterns
- **Payment consistency** — reliability and punctuality

### 3. AI Layer
When users select "AI-recommended" split:
1. Backend sends group context (members, history, income, patterns) to Groq
2. The appropriate LLM analyzes the data and recommends optimal share allocations
3. Rationale and fairness explanation are returned alongside recommendations
4. If AI is unavailable, the fairness engine provides a deterministic fallback

### 4. OCR Pipeline
Receipt scanning works in this order:
1. User uploads receipt image via `/api/groups/:id/scan-receipt`
2. Backend attempts extraction via **OCRSpace cloud API** first
3. If cloud fails, **Tesseract.js** is used for local extraction
4. Extracted text is parsed via regex to identify merchant, date, total, and line items
5. Results are returned with confidence scores for user review/correction

### 5. Real-Time Sync
- **Socket.io** maintains authenticated WebSocket connections per group
- **Redis adapter** broadcasts messages across multiple server instances
- Changes (new expenses, payments, fairness updates) are pushed to all connected members
- Chat messages are persisted in MongoDB and backfilled on reconnect
- Presence data is tracked in Redis with automatic cleanup on disconnect

---

## 🏗️ Tech Stack

### Frontend
- **React 19** — UI framework
- **Vite 7** — bundler and dev server
- **Tailwind CSS 4** — utility-first styling
- **Framer Motion** — smooth animations
- **Chart.js** — data visualization
- **React Router 7** — client-side routing
- **Socket.io Client 4** — real-time communication
- **Axios** — HTTP client
- **Lucide React** — icon library

### Backend
- **Node.js 20 LTS** — runtime
- **Express 5** — web framework
- **MongoDB 9** with **Mongoose 9** — document database
- **Socket.io 4** — real-time WebSocket server
- **Redis 7** — caching, session store, Socket.io adapter
- **Multer 2** — multipart file upload handling
- **JWT** — token-based authentication
- **Bcryptjs 3** — password hashing
- **Helmet 8** — security headers
- **Express Rate Limit 8** — request throttling
- **Tesseract.js 7** — local OCR fallback
- **Zod 4** — schema validation

### AI & OCR
- **Groq API** — high-speed LLM inference
  - Llama 4 Maverick (17B)
  - Qwen 3 32B
  - Llama 4 Scout (17B)
  - Llama 3.3 70B
- **OCRSpace API** — cloud-based optical character recognition
- **Tesseract.js 7** — local fallback OCR engine

### Payments & SMS
- **HyperSwitch** — payment gateway for automated settlements
- **TextBee** — SMS gateway for notifications

### DevOps & Infrastructure
- **Docker** — containerization
- **Docker Compose** — multi-container orchestration
- **Nginx 1.27** — reverse proxy and static file serving (frontend production)
- **Jenkins** — CI/CD pipeline
- **Render.yaml** — PaaS deployment blueprint
- **Prometheus** — metrics collection (monitoring setup available)
- **Grafana** — metrics visualization (monitoring setup available)
- **cAdvisor** — container resource monitoring

---

## 🚢 DevOps & Release Setup

This project includes production-grade DevOps infrastructure:

### Build & Deployment
- **Docker** — production-ready multi-stage builds for backend and frontend
  - Backend: Alpine Node.js 20 with optimized dependencies
  - Frontend: Vite build → Nginx 1.27 serving
- **Docker Compose** — full local development stack with health checks
- **MongoDB replica set** — enables atomic transactions locally and in production
- **Redis** — Socket.io adapter for scaling across multiple server instances
- **Health & readiness checks** — Kubernetes-ready probes
- **Jenkins CI/CD** — validates PRs, runs tests, builds images
- **Render.yaml** — production deployment blueprint for PaaS

### Docker Compose Environments
- `docker-compose.yml` — local development (hot reload enabled)
- `docker-compose.prod.yml` — production-like local testing
- `docker-compose.monitoring.yml` — Prometheus + Grafana + cAdvisor monitoring stack

### Validated Configuration
- Backend API listens on port `5000` (mapped to `5001` on host)
- Frontend dev server runs on port `5173`
- MongoDB replica set initialized automatically on first start
- Redis persistence enabled with AOF (Append-Only File)
- All services have startup health checks and dependency ordering

### What's in the Box

| Component | Purpose | Config |
|-----------|---------|--------|
| MongoDB | Document store with replica set | `docker-compose.yml` |
| Redis | Cache, sessions, Socket.io adapter | `docker-compose.yml` |
| Node.js Server | REST API + WebSocket server | `server/Dockerfile`, `server/index.js` |
| Vite Client | React dev server or Nginx serving | `client/Dockerfile`, `client/nginx.conf` |
| Jenkins | CI/CD pipeline | `Jenkinsfile`, `docker/jenkins/` |
| Prometheus | Metrics collection | `monitoring/docker-compose.monitoring.yml` |
| Grafana | Dashboards | `monitoring/docker-compose.monitoring.yml` |
| cAdvisor | Container metrics | `monitoring/docker-compose.monitoring.yml` |

---

## ⚙️ Quick Start

### Prerequisites
- **Node.js 20 LTS** or later
- **npm 9** or later
- **Docker & Docker Compose** (for containerized setup)
- **MongoDB 7+** (if running without Docker)
- **Redis 7** (if running without Docker)

### Option 1: Quickest Start (Docker)
~~~bash
git clone https://github.com/singhharshitt/SplitChill.git
cd SplitChill

# Copy environment files
cp .env.example .env

# Start the entire stack (MongoDB, Redis, API, Client)
docker compose up --build

# Access the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:5001/api
# Health check: http://localhost:5001/api/health
~~~

### Option 2: Local Development (Manual Setup)

#### Backend Setup
~~~bash
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys (optional for demo)
# Required: JWT_SECRET, JWT_REFRESH_SECRET
# Optional: GROQ_API_KEY, OCRSPACE_API_KEY, HYPERSWITCH_API_KEY, TEXTBEE_API_KEY

# Start development server (requires MongoDB and Redis running)
npm run dev

# Server will be available at http://localhost:5000
~~~

#### Frontend Setup
~~~bash
cd client

# Install dependencies
npm install

# Create environment file (optional, uses defaults)
cp .env.example .env

# Start dev server
npm run dev

# Frontend will be available at http://localhost:5173
~~~

### Option 3: Production Build (Docker)
~~~bash
# Build and run production images
docker compose -f docker-compose.prod.yml up --build -d

# Images use optimized production targets with minified code
~~~

---

## 📋 Environment Configuration

Create `.env` files in root, `server/`, and `client/` directories. See `.env.example` files for reference.

### Root `.env` (Docker Compose)
~~~env
# Ports
CLIENT_PORT=5173
SERVER_PORT=5001
MONGO_PORT=27017
REDIS_PORT=6379

# Frontend URLs
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001

# Backend URLs
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://mongo:27017/splitchill?replicaSet=rs0
REDIS_URL=redis://redis:6379
SOCKET_REDIS_URL=redis://redis:6379

# Secrets (change in non-dev)
JWT_SECRET=replace-with-32-plus-char-secret
JWT_REFRESH_SECRET=replace-with-another-32-plus-char-secret

# Integrations (optional)
GROQ_API_KEY=gsk_your_groq_key
OCRSPACE_API_KEY=your_ocrspace_key
HYPERSWITCH_API_KEY=your_hyperswitch_key
TEXTBEE_API_KEY=your_textbee_key

# Demo mode
DEMO_AUTH_ENABLED=true
~~~

### Server-Specific `.env`
~~~env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/splitchill?replicaSet=rs0
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Optional: AI, OCR, Payments, SMS
GROQ_API_KEY=gsk_...
OCRSPACE_API_KEY=...
HYPERSWITCH_API_KEY=...
HYPERSWITCH_WEBHOOK_SECRET=...
TEXTBEE_API_KEY=...
TEXTBEE_DEVICE_ID=...
~~~

### Client-Specific `.env`
~~~env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
~~~

---

## 🔌 API Endpoints

### Authentication (Unauthenticated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/logout` | Logout (clear cookies) |

### Groups (Authenticated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups` | Create new group |
| GET | `/api/groups/:id` | Get group details |
| PATCH | `/api/groups/:id` | Update group |
| POST | `/api/groups/:id/add-member` | Invite member (OTP) |
| GET | `/api/groups/:id/members` | List group members |

### Expenses (Authenticated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/groups/:id/expenses` | Create expense |
| GET | `/api/groups/:id/expenses` | List group expenses |
| PATCH | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Fairness & AI (Authenticated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/groups/:id/fairness` | Get fairness score + AI explanation |
| POST | `/api/groups/:id/recommend-split` | AI split recommendation |
| POST | `/api/ai/chat` | Chat with AI assistant |

### OCR & Receipts (Authenticated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/groups/:id/scan-receipt` | Upload receipt image for OCR |

### Analytics & Predictions (Authenticated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/groups/:id/analytics` | Get analytics data + AI summary |
| GET | `/api/groups/:id/suggestions` | Get predictive suggestions |

### Payments (Authenticated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/payments/initiate` | Initiate payment via HyperSwitch |
| POST | `/api/payments/upi-link` | Generate UPI payment link |
| GET | `/api/transactions` | List all transactions |
| PATCH | `/api/transactions/:id/confirm` | Confirm payment completion |

### Webhooks (Unauthenticated, Signature Verified)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/webhooks/hyperswitch` | HyperSwitch payment updates |
| POST | `/api/webhooks/textbee` | TextBee SMS delivery receipts |

### Health & Status (Unauthenticated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Service status + MongoDB connection |
| GET | `/api/health/ready` | Readiness probe (503 if DB unavailable) |

### Real-Time Chat (Socket.io)
Connect to `http://localhost:5001` with authentication token.

**Events:**
- `chat:message` — send/receive chat messages
- `chat:typing` — typing indicator
- `user:online` — user joined group
- `user:offline` — user left group
- `balance:update` — balance changed
- `fairness:update` — fairness score changed

---

## 🏗️ Project Structure

```
SplitChill/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   ├── pages/                   # Page components (Dashboard, Split, Analytics, etc.)
│   │   ├── context/                 # React Context (Auth, Chat, Live Data)
│   │   ├── hooks/                   # Custom hooks (usePagination, etc.)
│   │   ├── api/                     # API client (client.js, payments.js, socket.js)
│   │   ├── lib/                     # Utilities (currency, filters, transforms)
│   │   ├── services/                # Business logic
│   │   └── sections/                # Feature sections
│   ├── Dockerfile                   # Multi-stage build (dev + Nginx production)
│   ├── nginx.conf                   # SPA routing config
│   ├── vite.config.js               # Vite configuration
│   └── package.json
│
├── server/                          # Node.js + Express backend
│   ├── src/
│   │   ├── config/                  # Configuration (DB, env validation)
│   │   ├── controllers/             # Route handlers
│   │   ├── models/                  # MongoDB schemas
│   │   ├── routes/                  # API route definitions
│   │   ├── services/                # Business logic
│   │   │   ├── ai.service.js        # Groq LLM integration
│   │   │   ├── fairness.service.js  # Fairness scoring
│   │   │   ├── ocr.service.js       # OCR pipeline
│   │   │   ├── payment.service.js   # HyperSwitch integration
│   │   │   ├── sms.service.js       # TextBee SMS
│   │   │   ├── chat.service.js      # Message persistence
│   │   │   └── ...
│   │   ├── socket/                  # Socket.io event handlers
│   │   ├── middleware/              # Express middleware
│   │   ├── jobs/                    # Background jobs
│   │   │   ├── paymentReconciliation.job.js
│   │   │   └── smsRetry.job.js
│   │   └── utils/                   # Helpers and utilities
│   ├── tests/                       # Test files
│   ├── Dockerfile                   # Multi-stage build (dev + production)
│   ├── index.js                     # Server entry point
│   └── package.json
│
├── docker/                          # Docker build artifacts
│   ├── jenkins/                     # Jenkins image configuration
│   └── jenkins-dind/                # Docker-in-Docker setup
│
├── monitoring/                      # Monitoring stack (optional)
│   ├── docker-compose.monitoring.yml # Prometheus, Grafana, cAdvisor
│   ├── prometheus/prometheus.yml    # Metrics scrape config
│   └── grafana/                     # Dashboard provisioning
│
├── docker-compose.yml               # Local development (hot reload)
├── docker-compose.prod.yml          # Production-like local testing
├── docker-compose.hyperswitch.yml   # HyperSwitch dev environment
├── docker-compose.jenkins.yml       # Jenkins runner
│
├── Jenkinsfile                      # CI/CD pipeline
├── render.yaml                      # Render PaaS deployment
├── .env.example                     # Root environment template
├── DEVOPS.md                        # DevOps guide
├── README.md                        # This file
└── ...
```

---

## 🧪 Testing

### Backend Unit Tests
~~~bash
cd server
npm test
~~~

Tests are located in `server/tests/` and cover:
- Payment infrastructure and transaction atomicity
- Real-time deduplication logic
- Job execution (reconciliation, SMS retry)

### Manual API Testing
Use the REST Client extension or Postman with the API endpoints documented above.

### Demo Mode
Set `DEMO_AUTH_ENABLED=true` to skip authentication:
~~~bash
# Works without valid JWT
curl http://localhost:5001/api/groups
~~~

---

## 🚀 Production Deployment

### Render PaaS
1. Connect this repository to Render
2. Create a new Blueprint from `render.yaml`
3. Configure environment variables in Render dashboard
4. Deploy — Render will build and host automatically

### Docker Swarm / Kubernetes
1. Build images: `docker compose build`
2. Push to registry: `docker push splitchill/server:latest`
3. Deploy with orchestrator using health checks from `/api/health/ready`

### Custom VPS
1. Clone repo to server
2. Install Docker & Docker Compose
3. Configure `.env` with production secrets
4. Run: `docker compose -f docker-compose.prod.yml up -d`
5. Set up reverse proxy (Nginx/HAProxy) for SSL

### Environment Variables for Production
~~~env
NODE_ENV=production
JWT_SECRET=<strong-random-string-32+-chars>
JWT_REFRESH_SECRET=<another-strong-random-string>
CLIENT_URL=https://your-frontend.com
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/splitchill
REDIS_URL=redis://redis:6379
GROQ_API_KEY=<your-groq-api-key>
HYPERSWITCH_API_KEY=<your-hyperswitch-key>
HYPERSWITCH_WEBHOOK_SECRET=<your-webhook-secret>
TEXTBEE_API_KEY=<your-textbee-key>
TEXTBEE_DEVICE_ID=<your-device-id>
OCRSPACE_API_KEY=<your-ocrspace-key>
~~~

---

## 🐛 Background Jobs

### Payment Reconciliation
- **File:** `server/src/jobs/paymentReconciliation.job.js`
- **Purpose:** Periodically syncs payment status from HyperSwitch webhooks
- **Runs:** Every 5 minutes (configurable)
- **Handles:** Retries failed syncs, prevents duplicate charges

### SMS Retry
- **File:** `server/src/jobs/smsRetry.job.js`
- **Purpose:** Retries failed SMS deliveries with exponential backoff
- **Runs:** Every 10 minutes (configurable)
- **Handles:** TextBee API failures, network timeouts

Both jobs are started automatically when the server boots (see `index.js`).

---

## 📊 Monitoring (Optional)

A complete monitoring stack is available:

~~~bash
docker compose -f monitoring/docker-compose.monitoring.yml up -d
~~~

This brings up:
- **Prometheus** — metrics scraper (http://localhost:9090)
- **Grafana** — dashboards (http://localhost:3000, admin/admin)
- **cAdvisor** — container metrics (http://localhost:8081)

Configure Prometheus to scrape your backend's `/metrics` endpoint.

---

## 🔒 Security Considerations

### In Development
- Demo auth enabled by default (`DEMO_AUTH_ENABLED=true`)
- Weak default secrets — **change before production**
- Rate limits set to 300 requests/15 min
- CORS allows localhost origins

### In Production
- ✅ Set `DEMO_AUTH_ENABLED=false`
- ✅ Use strong, unique JWT secrets (32+ random characters)
- ✅ Enable HTTPS everywhere
- ✅ Set `CLIENT_URL` to exact frontend domain
- ✅ Increase rate limits if needed (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`)
- ✅ Verify webhook signatures from HyperSwitch and TextBee
- ✅ Rotate secrets regularly
- ✅ Monitor logs for suspicious activity
- ✅ Keep dependencies updated

---

## 📖 Additional Resources

- **DevOps Guide:** See [DEVOPS.md](DEVOPS.md) for detailed infrastructure setup
- **Pagination Guide:** See [PAGINATION_IMPLEMENTATION_GUIDE.md](PAGINATION_IMPLEMENTATION_GUIDE.md) for data pagination
- **Payment SMS Architecture:** See [PAYMENT_SMS_ARCHITECTURE.md](PAYMENT_SMS_ARCHITECTURE.md) for SMS integration details
- **API Specification:** See [API_SPECIFICATION_PAGINATED.md](API_SPECIFICATION_PAGINATED.md) for complete API schema

---

## 🎯 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source. See LICENSE for details.

---

## 👨‍💻 Author

**Harshit Singh**

- GitHub: https://github.com/singhharshitt
- Project: SplitChill (Fairness-powered expense splitting)

If you found this project useful, consider starring the repository ⭐
