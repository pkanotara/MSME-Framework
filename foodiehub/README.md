# FoodieHub Onboarding Engine

FoodieHub Onboarding Engine is a multi-tenant SaaS platform that semi-automates restaurant onboarding to Meta WhatsApp Cloud API using Embedded Signup, then provisions restaurant-specific ordering bots and dashboards.

## Key Product Flows

1. **Restaurant owner onboarding via WhatsApp chat**
   - Main onboarding bot collects owner and restaurant details step by step.
   - Asks the required question:
     - **"Which phone number do you want to use as your restaurant’s WhatsApp Business number?"**
   - Validates and normalizes number and checks uniqueness before onboarding.

2. **Embedded Signup (required owner interaction)**
   - Owner clicks secure signup link.
   - Owner completes Meta login, consent, business account selection/creation, and phone OTP verification.
   - Backend captures callback identifiers and stores setup metadata.

3. **Post-signup automation**
   - Stores WABA + Phone Number IDs
   - Registers webhook subscriptions using an in-process async job runner
   - Activates tenant chatbot config
   - Marks onboarding active

4. **Multi-tenant dashboarding**
   - Super Admin dashboard for platform-wide operations
   - Restaurant Owner dashboard for tenant-only operations

## Stack
- Backend: Node.js, Express, TypeScript, MongoDB, Axios, JWT, Zod, Cloudinary
- Frontend: Next.js App Router, TypeScript, Tailwind
- Async processing: in-memory job runner (no Redis required)

## Monorepo Structure

```text
foodiehub/
  backend/
  frontend/
  docs/
  docker-compose.yml
```

## Backend Modules
- Auth + RBAC
- Onboarding chat workflow
- Meta Embedded Signup integration
- Meta webhook ingestion + async job processing
- Restaurant, menu, order, analytics, upload APIs
- Admin monitoring APIs

## Local Setup (No Docker, No Redis)

### 1) Prerequisites
- Node.js 20+
- MongoDB running locally on `127.0.0.1:27017`

### 2) Environment
```bash
cd backend
cp .env.example .env
```

### 3) Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4) Run locally
```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

### 5) Optional seed data
```bash
cd backend
npm run seed
```

## Core API Surface

### Auth
- `POST /api/auth/register-admin`
- `POST /api/auth/register-restaurant-owner`
- `POST /api/auth/login`

### Onboarding
- `POST /api/onboarding/whatsapp-chat`
- `POST /api/onboarding/start`
- `POST /api/onboarding/:id/details`
- `GET /api/onboarding/:id`

### Meta
- `GET /api/meta/embedded-signup-link/:restaurantId`
- `GET /api/meta/callback`
- `GET /api/meta/webhook`
- `POST /api/meta/webhook`
- `POST /api/meta/setup/retry/:restaurantId`

### Admin
- `GET /api/admin/summary`
- `GET /api/admin/restaurants/status`
- `PATCH /api/admin/restaurants/:id/active`
- `GET /api/admin/bots/status`

### Restaurant Operations
- `GET /api/restaurants`
- `POST /api/menu/categories`
- `POST /api/menu/items`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/analytics/restaurant`
- `POST /api/upload/image-url`

## Compliance Notes
- FoodieHub does **not** bypass Meta requirements.
- WhatsApp Business account creation cannot be done invisibly by backend automation.
- Owner interaction is mandatory for login, consent, and phone verification in Embedded Signup.
- Automation is applied only to allowed post-signup API steps.
