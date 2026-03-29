# E-Commerce Platform

A full-stack e-commerce monorepo built with Next.js, Express, PostgreSQL, and Redis.

## Monorepo Structure

```
.
├── apps/
│   ├── api/        # Express REST API          → localhost:4000
│   ├── web/        # Next.js storefront         → localhost:3000
│   └── admin/      # Next.js admin dashboard    → localhost:3001
└── packages/
    ├── database/   # Prisma schema & client
    ├── ui/         # Shared React components
    ├── utils/      # Shared utility functions
    ├── validation/ # Shared Zod schemas
    ├── eslint-config/  # Shared ESLint config
    └── tsconfig/       # Shared TypeScript config
```

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | Next.js 15, React 19, TailwindCSS |
| Backend  | Express 4, Node.js                |
| Database | PostgreSQL + Prisma ORM           |
| Cache    | Redis                             |
| Auth     | JWT (access + refresh tokens)     |
| Monorepo | Turborepo + pnpm workspaces       |
| Language | TypeScript throughout             |
| Testing  | Vitest                            |
| CI/CD    | GitHub Actions                    |

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** 10.x — `npm install -g pnpm`
- **PostgreSQL** running locally
- **Redis** running locally

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Marto742/E-Commerce-Platform.git
cd E-Commerce-Platform
pnpm install
```

### 2. Set up environment variables

```bash
cp apps/api/.env.example          apps/api/.env
cp apps/web/.env.local.example    apps/web/.env.local
cp apps/admin/.env.local.example  apps/admin/.env.local
```

Open `apps/api/.env` and fill in the required values:

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

See [.env.example](.env.example) for a full reference of every variable across all services.

### 3. Set up the database

```bash
# Generate Prisma client
pnpm --filter @repo/database db:generate

# Run migrations
pnpm --filter api db:migrate

# (Optional) Seed with sample data
pnpm --filter @repo/database db:seed
```

### 4. Start development

```bash
pnpm dev
```

This starts all three services in parallel via Turborepo:

| Service         | URL                   |
| --------------- | --------------------- |
| API             | http://localhost:4000 |
| Web storefront  | http://localhost:3000 |
| Admin dashboard | http://localhost:3001 |

Verify the API is running: http://localhost:4000/v1/health

## Scripts

### Root (runs across all packages via Turbo)

```bash
pnpm dev           # Start all services in dev mode
pnpm build         # Build all services
pnpm lint          # Lint all packages
pnpm lint:fix      # Lint and auto-fix
pnpm type-check    # TypeScript check across all packages
pnpm test          # Run all tests
pnpm format        # Format all files with Prettier
pnpm format:check  # Check formatting without writing
pnpm clean         # Remove all build outputs
```

### API only

```bash
pnpm --filter api dev          # Dev server with hot reload
pnpm --filter api test         # Run tests
pnpm --filter api test:watch   # Watch mode
pnpm --filter api build        # Build to dist/
pnpm --filter api start        # Run production build
```

### Database

```bash
pnpm --filter api db:migrate   # Create and apply a new migration
pnpm --filter api db:push      # Push schema without migration (prototyping)
pnpm --filter api db:generate  # Regenerate Prisma client
pnpm --filter api db:studio    # Open Prisma Studio UI
pnpm --filter @repo/database db:seed  # Seed the database
```

## Environment Variables

| Variable                             | Service    | Required | Description                                            |
| ------------------------------------ | ---------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL`                       | API        | Yes      | PostgreSQL connection string                           |
| `REDIS_URL`                          | API        | Yes      | Redis connection string                                |
| `JWT_ACCESS_SECRET`                  | API        | Yes      | Min 32 chars                                           |
| `JWT_REFRESH_SECRET`                 | API        | Yes      | Min 32 chars, different from access                    |
| `JWT_ACCESS_EXPIRES_IN`              | API        | No       | Default: `15m`                                         |
| `JWT_REFRESH_EXPIRES_IN`             | API        | No       | Default: `7d`                                          |
| `CORS_ORIGIN`                        | API        | No       | Default: `http://localhost:3000,http://localhost:3001` |
| `STRIPE_SECRET_KEY`                  | API        | No       | Phase 5                                                |
| `STRIPE_WEBHOOK_SECRET`              | API        | No       | Phase 5                                                |
| `RESEND_API_KEY`                     | API        | No       | Phase 8                                                |
| `R2_ACCOUNT_ID`                      | API        | No       | Phase 9                                                |
| `NEXT_PUBLIC_API_URL`                | Web, Admin | Yes      | API base URL                                           |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Web        | No       | Phase 5                                                |

> All environment variables are validated at API startup using Zod. The server will print a clear error and exit if any required variable is missing.

## API Endpoints

| Method   | Path               | Description      | Phase   |
| -------- | ------------------ | ---------------- | ------- |
| GET      | `/v1/health`       | Health check     | ✅ Done |
| POST     | `/v1/auth/*`       | Authentication   | Phase 3 |
| GET/POST | `/v1/users/*`      | User management  | Phase 3 |
| GET/POST | `/v1/products/*`   | Product catalog  | Phase 4 |
| GET/POST | `/v1/categories/*` | Categories       | Phase 4 |
| POST     | `/v1/cart/*`       | Shopping cart    | Phase 5 |
| POST     | `/v1/checkout/*`   | Checkout flow    | Phase 5 |
| POST     | `/v1/payments/*`   | Stripe payments  | Phase 5 |
| GET/POST | `/v1/orders/*`     | Order management | Phase 6 |
| GET/POST | `/v1/admin/*`      | Admin routes     | Phase 6 |

## Data Models

Defined in `apps/api/prisma/schema.prisma`:

- **User** — auth, roles (`GUEST`, `CUSTOMER`, `ADMIN`, `SUPER_ADMIN`), status
- **RefreshToken** — JWT refresh token management
- **Address** — shipping and billing addresses
- **Category** — hierarchical product categories
- **Product** — product catalog with images and variants
- **ProductVariant** — SKU, pricing, stock, attributes
- **Cart / CartItem** — session and user carts
- **Order / OrderItem** — orders with full status lifecycle
- **Review** — product reviews
- **Coupon** — percentage and fixed-amount discount codes

## Project Phases

| Phase | Focus                                 | Status   |
| ----- | ------------------------------------- | -------- |
| 1     | Monorepo scaffold & tooling           | ✅ Done  |
| 2     | Infrastructure & developer experience | ✅ Done  |
| 3     | Authentication & user management      | Upcoming |
| 4     | Product catalog                       | Upcoming |
| 5     | Cart, checkout & Stripe payments      | Upcoming |
| 6     | Order management & admin panel        | Upcoming |
| 7     | Search & filtering                    | Upcoming |
| 8     | Email notifications (Resend)          | Upcoming |
| 9     | File uploads (Cloudflare R2)          | Upcoming |

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

1. Lint all packages
2. TypeScript type-check
3. Run tests (against a real PostgreSQL + Redis instance)
4. Build all services

See [.github/workflows/ci.yml](.github/workflows/ci.yml).
