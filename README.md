# FoodieHub Onboarding Engine

A production-ready multi-tenant WhatsApp Business onboarding platform for restaurant owners. Restaurant owners message your main WhatsApp bot, provide their business details, complete Meta Embedded Signup, and the system auto-configures their WhatsApp chatbot.

## Architecture Overview

```
Restaurant Owner → WhatsApp Bot (Main Number)
    ↓ (collects details)
MongoDB (OnboardingSession)
    ↓
Meta Embedded Signup (owner completes login + phone verify)
    ↓
Backend callback → WABA ID + Phone Number ID saved
    ↓
Chatbot initialized for restaurant's number
    ↓
Restaurant Owner Dashboard activated
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Frontend | React + Vite |
| Auth | JWT (access + refresh tokens) |
| File Storage | Cloudinary |
| WhatsApp | Meta WhatsApp Cloud API |
| Async Jobs | BullMQ + Redis |
| Styling | Tailwind CSS |

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas or local MongoDB
- Redis (for BullMQ)
- Meta Developer App with WhatsApp product
- Cloudinary account

### 1. Clone & Install

```bash
git clone <repo>
cd foodiehub

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
cp backend/.env.example backend/.env
# Fill in all values (see .env.example)
```

### 3. Seed Admin

```bash
cd backend
npm run seed
```

### 4. Start Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 5. Expose Webhook (development)

```bash
ngrok http 5000
# Set WEBHOOK_BASE_URL in .env to your ngrok URL
```

## Meta App Setup

1. Create a Meta Developer App at developers.facebook.com
2. Add WhatsApp product
3. Enable Embedded Signup (Business Login)
4. Set OAuth redirect URI to: `https://yourdomain.com/api/embedded-signup/callback`
5. Add webhook URL: `https://yourdomain.com/api/webhook`
6. Subscribe to `messages` webhook field

## Folder Structure

```
foodiehub/
├── backend/
│   ├── config/          # DB, Redis, Cloudinary config
│   ├── controllers/     # Route handlers
│   ├── jobs/            # BullMQ job processors
│   ├── middleware/      # Auth, error, rate limit
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── services/        # Business logic
│   └── utils/           # Helpers
└── frontend/
    └── src/
        ├── components/  # Reusable UI
        ├── context/     # React context (auth)
        ├── hooks/       # Custom hooks
        ├── layouts/     # Page layouts
        ├── pages/       # Route pages
        ├── services/    # API client
        └── utils/       # Helpers
```

## Roles & Access

| Role | Access |
|------|--------|
| `super_admin` | Full platform control |
| `restaurant_owner` | Own restaurant only |
| `staff` | Restricted operational access |

## API Endpoints

See [API_DOCS.md](./API_DOCS.md) for full endpoint reference.

## License
MIT
