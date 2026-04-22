# SplitChill 💸
### Because Equal ≠ Fair

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-0ea5e9?style=for-the-badge)](#-tech-stack)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-16a34a?style=for-the-badge)](#-tech-stack)
[![Database](https://img.shields.io/badge/Database-MongoDB-10b981?style=for-the-badge)](#-tech-stack)
[![DevOps](https://img.shields.io/badge/DevOps-Docker%20%2B%20AWS%20EC2-2563eb?style=for-the-badge)](#-deployment)

SplitChill is an AI-powered expense splitting platform designed to solve a real problem that most split apps ignore: fairness.

Most tools optimize for equal splits. SplitChill optimizes for context-aware fairness using income sensitivity, participation behavior, contribution history, and predictive intelligence.

---

## Why This Project Stands Out

- Moves from static equal-split logic to intelligent fairness-based distribution.
- Blends product thinking with data-driven decisioning (fairness score + predictive suggestions).
- Built with full-stack + DevOps mindset: UI analytics, service APIs, containerization, and cloud deployment path.
- Designed to be both user-friendly for daily groups and technically strong for interviews and production roadmaps.

---

## 🚀 Features

- Smart Expense Splitting
  - Equal split
  - Income-based split
  - Usage-based split
  - AI-recommended split
- Fairness Engine (core innovation)
  - Fairness Score from 0 to 100
  - Tracks payment behavior, usage, and settlement delay
- Predictive Suggestions
  - Suggests who should pay next
  - Recommends balancing actions for healthier group dynamics
- Analytics Dashboard
  - Spending trends
  - Contribution imbalance insights
  - Group fairness trendline
- Conflict Detection
  - Detects early imbalance signals
  - Nudges users before disputes happen
- Group Management
  - Create groups (trip, rent, events)
  - Add participants and roles
  - Track shared expenses in one timeline

---

## 🧠 How It Works

### 1. Problem
Traditional split apps assume everyone should pay equally. Real life is different:
- incomes are different,
- usage is different,
- effort and indirect contributions are different.

### 2. Core Fairness Idea
Instead of forcing equal split, SplitChill computes a contextual share.

Basic weighted share formula:

$$
\text{User Share} = \text{Total Expense} \times \frac{\text{User Weight}}{\sum \text{All User Weights}}
$$

Where user weight can include:
- income factor,
- participation level,
- prior contribution ratio,
- payment consistency.

### 3. Fairness Score
Each user/group gets a dynamic fairness score (0-100):
- starts at baseline,
- increases with balanced contributions,
- decreases with repeated underpayment or delays.

### 4. Predictive Layer
The system analyzes recent history to suggest:
- who should pay next,
- what split option best restores balance.

---

## 🏗️ Tech Stack

### Frontend
- React
- Tailwind CSS
- Chart.js
- React Router

### Backend
- Node.js
- Express.js
- Mongoose

### Database
- MongoDB

### DevOps & Delivery
- Docker
- AWS EC2
- GitHub Actions (CI/CD)

---

## 📁 Folder Structure

~~~text
SplitChill/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── package.json
│   └── package-lock.json
├── docker/
├── docker-compose.yml
├── .gitignore
└── README.md
~~~

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (local or cloud URI)
- Git

### 1) Clone the repository
~~~bash
git clone https://github.com/singhharshitt/SplitChill.git
cd SplitChill
~~~

### 2) Frontend setup
~~~bash
cd client
npm install
npm run dev
~~~
Frontend will run on Vite default URL:
- http://localhost:5173

### 3) Backend setup
Current repo snapshot has backend dependencies configured, and API implementation can be added under server.

~~~bash
cd server
npm install
~~~

Recommended next scripts for server package.json:
~~~json
{
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js"
  }
}
~~~

### 4) Environment variables (example)
Create env files for local development:

~~~env
# server/.env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/splitchill
CLIENT_URL=http://localhost:5173
~~~

~~~env
# client/.env
VITE_API_URL=http://localhost:5000/api
~~~

---

## 🐳 Docker Setup

The repository includes docker scaffolding. A typical local run flow:

~~~bash
docker compose up --build
~~~

Expected services in production-ready compose:
- client (React app)
- server (Node/Express API)
- mongo (MongoDB container)

Stop containers:

~~~bash
docker compose down
~~~

---

## ☁️ Deployment (AWS EC2)

### Quick EC2 flow
1. Launch Ubuntu EC2 instance.
2. Open ports 22, 80, 443 (and 5173/5000 only if needed for testing).
3. Install Docker and Docker Compose plugin.
4. Clone repository on EC2.
5. Add production env values.
6. Run:

~~~bash
docker compose up -d --build
~~~

7. Configure Nginx reverse proxy and TLS (LetsEncrypt) for production domain.

### CI/CD with GitHub Actions
Typical pipeline:
- On push to main: test, build images, deploy to EC2 via SSH.
- Keep secrets in GitHub Actions secrets (EC2_HOST, EC2_KEY, etc.).

---

## 🔌 API Endpoints

Below are baseline v1 endpoint examples for SplitChill backend:

### Health
- GET /api/health

~~~json
{
  "status": "ok",
  "service": "SplitChill API"
}
~~~

### Groups
- POST /api/groups
- GET /api/groups/:groupId

### Expenses
- POST /api/groups/:groupId/expenses
- GET /api/groups/:groupId/expenses

### Fairness
- GET /api/groups/:groupId/fairness-score
- POST /api/groups/:groupId/recommend-split

### Predictions
- GET /api/groups/:groupId/suggest-next-payer

Example create expense request:

~~~json
{
  "title": "Dinner",
  "amount": 2400,
  "paidBy": "user_123",
  "participants": ["user_123", "user_456", "user_789"],
  "splitType": "ai-recommended"
}
~~~

---

## 📊 Screenshots / UI Preview

Add your UI images here for better portfolio impact:

~~~text
/docs/screenshots/
  dashboard.png
  group-details.png
  fairness-analytics.png
  add-expense-flow.png
~~~

Suggested markdown blocks:

~~~md
![Dashboard](docs/screenshots/dashboard.png)
![Fairness Analytics](docs/screenshots/fairness-analytics.png)
~~~

---

## 🧪 Future Enhancements

- Advanced ML fairness model with explainable AI outputs.
- Real-time notifications and settlement reminders.
- UPI and payment gateway integrations.
- Native mobile app (React Native/Flutter).
- Role-based group governance and moderation.
- Multi-currency and travel-mode optimizations.
- Fraud/abuse pattern detection for shared finance groups.

---

## 🤝 Contributing

Contributions are welcome.

~~~bash
# 1. Fork the repo
# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Commit changes
git commit -m "feat: add your feature"

# 4. Push and open a pull request
git push origin feat/your-feature-name
~~~

Please keep pull requests focused, documented, and testable.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Harshit Singh

- GitHub: https://github.com/singhharshitt
- Project: SplitChill

If you found this project useful, consider starring the repository.
