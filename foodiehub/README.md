# FoodieHub SaaS Platform

Production-oriented SaaS scaffold for restaurant onboarding, Meta WhatsApp Embedded Signup integration, menu/order management, and webhook observability.

## Stack
- Backend: Node.js, Express, TypeScript, MongoDB, Redis, BullMQ, Axios, Zod, JWT, bcrypt, Pino
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Infra: Docker Compose

## Getting Started

### 1) Environment
```bash
cd backend
cp .env.example .env
```

### 2) Local development
```bash
# backend
cd backend
npm install
npm run dev

# frontend
cd ../frontend
npm install
npm run dev
```

### 3) Docker
```bash
cd ..
docker compose up --build
```

## API Overview
- `POST /api/auth/login`
- `POST /api/auth/register-admin`
- `POST /api/onboarding/start`
- `POST /api/onboarding/:id/details`
- `GET /api/onboarding/:id`
- `GET /api/meta/embedded-signup-link/:restaurantId`
- `GET /api/meta/callback`
- `GET /api/meta/webhook`
- `POST /api/meta/webhook`
- `POST /api/meta/setup/retry/:restaurantId`
- Restaurants CRUD at `/api/restaurants`
- Menu category/item APIs at `/api/menu`
- Orders APIs at `/api/orders`
- Webhook logs at `/api/logs/webhooks`

## Meta compliance
FoodieHub does not fake or bypass WhatsApp onboarding. It uses Embedded Signup and only automates allowed post-signup API actions.
