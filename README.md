# PaySense — AI-Powered Payment Analytics

A full-stack fintech application demonstrating real-world payment platform engineering with an AI-powered natural language query layer.

**Live Demo:** [your-railway-url.railway.app] <!-- update after deploy -->

---

## What it does

PaySense simulates a payment ledger and lets users:

- **Submit transactions** with idempotency key handling and automatic state transitions (PENDING → SETTLED | FAILED | REFUNDED)
- **View live analytics** — settled volume, failure rate, refund count, volume by transaction type
- **Query the data in plain English** via an AI chat interface backed by the Claude API ("What is my refund rate?", "Which users sent the most payments?")
- **Visualize trends** with area charts (volume over time) and bar charts (breakdown by type)

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.2 |
| Persistence | H2 in-memory (JPA / Hibernate) |
| AI | Anthropic Claude API (claude-sonnet-4) |
| Frontend | React 18, Recharts, Lucide |
| Build | Maven (backend), Vite (frontend) |
| Deployment | Railway |

---

## Architecture

```
Frontend (React + Vite)
  └── Dashboard, Transaction Table, AI Chat Panel

Backend (Spring Boot)
  ├── TransactionController  →  POST /api/v1/transactions
  │                          →  GET  /api/v1/transactions
  │                          →  GET  /api/v1/transactions/analytics
  └── AiController           →  POST /api/v1/ai/query

Service Layer
  ├── TransactionService     (idempotency, state machine, seeding)
  └── ClaudeService          (context assembly, API call, fallback)

Repository (Spring Data JPA)
  └── TransactionRepository  (custom aggregation queries)
```

Key engineering decisions:

- **Idempotency**: every transaction carries an idempotency key; duplicate POSTs return the existing record without double-processing
- **State machine**: PENDING is the entry state; settlement is simulated with a ~10% failure rate to mirror real payment network behavior
- **Graceful degradation**: the AI layer falls back to a structured summary if no API key is configured, so the app stays functional without credentials
- **CORS**: origins are environment-variable driven for clean local/prod separation

---

## Running locally

### Prerequisites

- Java 21+
- Maven 3.9+
- Node 18+

### Backend

```bash
cd backend
# optional — add your Anthropic API key for full AI features
export ANTHROPIC_API_KEY=sk-ant-...
mvn spring-boot:run
# starts on http://localhost:8080
# H2 console at http://localhost:8080/h2-console
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# starts on http://localhost:5173
# proxies /api calls to localhost:8080
```

---

## Deploying to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Add environment variables in Railway dashboard:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `CORS_ORIGINS` — your Railway frontend URL (e.g. `https://paysense.up.railway.app`)
4. Railway detects the `Procfile` and builds the JAR automatically
5. For the frontend, add a second Railway service pointing to the `frontend/` directory

---

## API reference

```
POST /api/v1/transactions
  Body: { sender, recipient, amount, currency, type, description?, idempotencyKey? }

GET  /api/v1/transactions
  Returns: all transactions ordered by createdAt desc

GET  /api/v1/transactions/analytics
  Returns: counts, volumes, and breakdown by type

POST /api/v1/ai/query
  Body: { question }
  Returns: { question, answer }

POST /api/v1/transactions/seed
  Seeds 40 demo transactions (no-op if data exists)
```

---

## Engineering concepts demonstrated

- **Idempotency** in distributed payment flows
- **Transaction state machines** (PENDING / SETTLED / FAILED / REFUNDED)
- **Service layer separation** with Spring dependency injection
- **JPA custom queries** for aggregation and analytics
- **AI context assembly** — structuring domain data as LLM context for accurate, grounded answers
- **Environment-based configuration** for multi-environment deployability
- **Graceful degradation** when external services are unavailable

---

## Author

Sanchit — Java backend engineer with experience building P2P and payments infrastructure at PayPal.

[LinkedIn](https://linkedin.com/in/yourprofile) | [GitHub](https://github.com/yourusername)
