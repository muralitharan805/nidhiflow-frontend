# 💰 NidhiFlow — Personal Finance & Net Worth Intelligence Engine

> **NidhiFlow** is a full-stack personal finance management SPA built on **Angular 21** (Signals + Zoneless) + **NestJS** (Prisma + PostgreSQL) with a mathematically rigorous **double-entry accounting engine**, **EMI amortization scheduler**, **7-dimensional multi-year inflation forecasting simulator**, and a fully lazy-loaded reactive frontend.

---

## ✨ Core Architecture

### 1. Double-Entry Bookkeeping Engine

Every financial transaction follows the strict double-entry principle:

$$\sum \text{Debits} = \sum \text{Credits}$$

The NestJS backend rejects any unbalanced journal entry with `400 Bad Request`.

### 2. The Accounting Equation

Net Worth is derived from The Accounting Equation:

$$\text{Net Worth} = \sum \text{Assets} - \sum \text{Liabilities}$$

### 3. EMI Amortization Formula

Monthly EMI is calculated using:

$$M = P \frac{r(1+r)^n}{(1+r)^n - 1}$$

Where:
- `P` = Principal loan amount
- `r` = Monthly interest rate (Annual Rate / 12)
- `n` = Total tenure in months

### 4. 7-Dimensional Forecasting Simulator

Annual expense projection per category with inflation compounding:

$$E_{k, t} = E_{k, 0} \times (1 + i_k)^t$$

Income projection with annual growth rate:

$$I_t = I_0 \times (1 + g)^t$$

**Deficit Crossover Year** detected when:

$$I_t < E_t + \text{EMI}_t$$

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Angular 21 (Standalone, Zoneless, Signals) |
| **UI Library** | Angular Material 3 (M3 design tokens) |
| **State Management** | Signals (`signal()`, `computed()`, `linkedSignal()`) |
| **Backend Framework** | NestJS (TypeScript, Strict mode) |
| **ORM** | Prisma Client (PostgreSQL) |
| **Database** | PostgreSQL 16 with `pgvector` extension |
| **Authentication** | JWT (access tokens) via `@nestjs/jwt` |
| **API Documentation** | Swagger (`@nestjs/swagger`) |
| **Package Manager** | `pnpm` |
| **Testing** | Vitest (Frontend) / Jest (Backend) |
| **Deployment** | Cloudflare Pages (SSR via Wrangler) |

---

## 📁 Frontend Architecture

```
src/app/
├── core/
│   ├── services/           # ApiService, AuthService, LedgerService, AmortizationService, ForecastingService
│   ├── interceptors/       # auth, error, loading, cache, api-prefix
│   ├── guards/             # authGuard, guestGuard, roleGuard
│   └── strategies/         # AppTitleStrategy
├── features/
│   ├── dashboard/          # Net Worth overview cards
│   ├── ledger/             # Chart of Accounts + Journal Entry form (Σ D = Σ C)
│   ├── amortization/       # EMI loan creation + payoff countdown
│   ├── forecasting/        # What-If scenario simulator + deficit crossover
│   └── auth/               # Login / Register page
└── shared/
    ├── layouts/            # MainLayoutComponent, AuthLayoutComponent
    ├── components/toast-notification/
    └── components/loading-spinner/
```

---

## 📁 Backend Architecture

```
src/
├── core/
│   ├── database/           # PrismaService
│   ├── interceptors/       # LoggingInterceptor, CacheInterceptor
│   └── filters/            # GlobalExceptionFilter
├── features/
│   ├── auth/               # JWT login/register
│   ├── ledger/             # Chart of Accounts + Journal Entry engine
│   ├── amortization/       # EMI calculator + schedule generator
│   └── forecasting/        # 7-dimensional scenario simulator
└── prisma/
    ├── schema.prisma        # Multi-schema Prisma: auth + finance
    └── seed.ts              # Seed default Chart of Accounts
```

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 20+
- pnpm 11+
- PostgreSQL 16 with `vector` extension enabled
- Docker (optional, for database)

### 1. Database Setup

```bash
# Start PostgreSQL with pgvector via Docker
docker run -d --name nidhiflow-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nidhiflow \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Enable vector extension
docker exec -it nidhiflow-db psql -U postgres -d nidhiflow -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 2. Backend Setup

```bash
cd nidhi-flow-backend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, PORT=3000

# Run Prisma migrations
pnpm prisma migrate deploy

# Seed Chart of Accounts
pnpm prisma db seed

# Start development server
pnpm start:dev
```

Backend available at: `http://localhost:3000`  
Swagger docs: `http://localhost:3000/api`

### 3. Frontend Setup

```bash
cd nidhiFlow-frontend

# Install dependencies
pnpm install

# Start development server (proxied to backend)
pnpm start
```

Frontend available at: `http://localhost:4200`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user |
| `POST` | `/api/v1/auth/register` | Register new account |
| `GET` | `/api/v1/ledger/net-worth` | Fetch current Net Worth summary |
| `GET` | `/api/v1/ledger/accounts` | Fetch Chart of Accounts |
| `POST` | `/api/v1/ledger/entries` | Post balanced journal entry |
| `POST` | `/api/v1/amortization/loans` | Create loan + generate schedule |
| `POST` | `/api/v1/amortization/loans/:id/prepayment` | Simulate prepayment |
| `POST` | `/api/v1/forecasting/simulate` | Run What-If scenario simulation |

---

## 🏦 Financial Features

| Feature | Description |
|---|---|
| **Chart of Accounts** | 5-type hierarchy: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE |
| **Journal Entries** | Live balance indicator — rejects unless Σ Debits = Σ Credits |
| **Net Worth Dashboard** | Real-time Assets − Liabilities calculation |
| **EMI Amortization** | Full repayment schedule with payoff countdown |
| **Forecasting Simulator** | Category-wise inflation rates, salary growth, crossover detection |
| **Immutable Ledger** | Posted entries can only be reversed, never edited |

---

## 📜 License

MIT © Murali — NidhiFlow Personal Finance Engine
