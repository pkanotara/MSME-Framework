# ChatServe (FoodieHub)

> **ChatServe is a multi-tenant WhatsApp-based food ordering SaaS platform.** Restaurant owners sign up by chatting on WhatsApp, the platform walks them through setup via a conversational bot, connects their WhatsApp Business number via Meta's OAuth flow, and then their customers can chat with their restaurant's own WhatsApp number to browse the menu and place orders — all managed from a web dashboard.

---

## Table of Contents

1. [What ChatServe Does](#what-chatserve-does)
2. [Platform Architecture](#platform-architecture)
3. [The 9 Core Components](#the-9-core-components)
   - [1. Onboarding Bot](#1--onboarding-bot)
   - [2. Meta Embedded Signup](#2--meta-embedded-signup)
   - [3. Customer Ordering Chatbot](#3--customer-ordering-chatbot)
   - [4. Webhook Handler](#4--webhook-handler)
   - [5. Restaurant Owner Dashboard](#5--restaurant-owner-dashboard)
   - [6. Admin Dashboard](#6--admin-dashboard)
   - [7. Authentication & Security](#7--authentication--security)
   - [8. File Storage](#8--file-storage)
   - [9. Tech Stack](#9--tech-stack)
4. [Project Structure](#project-structure)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [Roles & Permissions](#roles--permissions)
8. [Prerequisites](#prerequisites)
9. [Installation & Setup](#installation--setup)
10. [Environment Variables](#environment-variables)
11. [Meta WhatsApp App Setup](#meta-whatsapp-app-setup)
12. [Running the Application](#running-the-application)
13. [Production Deployment](#production-deployment)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)

---

## What ChatServe Does

ChatServe is a **SaaS platform** with three distinct actors:

| Actor | Role |
|---|---|
| **Platform Admin** | Full control over all restaurants, onboarding sessions, orders, broadcasts, and platform configuration |
| **Restaurant Owner** | Onboards via WhatsApp chat, connects their WhatsApp Business number, manages their menu and orders from a dashboard |
| **End Customer (Diner)** | Texts the restaurant's WhatsApp number to browse the menu, add items to cart, and place orders |

---

## Platform Architecture

### Diner Ordering Flow

```
Diner sends "hi" → Restaurant's WhatsApp number
                    ↓  (restaurant chatbot)
         Browses menu categories
                    ↓
         Browses items, adds to cart
                    ↓
         Reviews cart → Checkout → Order placed
                    ↓
         Restaurant owner gets notified → manages from dashboard
```

### Restaurant Owner Onboarding Flow

```
Restaurant Owner messages Main Platform Bot
                    ↓  (onboarding chatbot)
         Provides name, restaurant info, menu, logo
                    ↓
         Gets sent a Meta Embedded Signup link
                    ↓
         Completes Facebook / Meta verification
                    ↓
         Platform auto-configures their WhatsApp Business number
                    ↓
         Their chatbot is live. Dashboard credentials sent via WhatsApp.
```

---

## The 9 Core Components

### 1. 🤖 Onboarding Bot

**File:** `backend/services/onboardingBotService.js`

A restaurant owner texts the platform's **main WhatsApp number**. A multi-step conversational bot walks them through the following steps:

| Step | Data Collected |
|---|---|
| 1 | `owner_name` — Owner's full name |
| 2 | `restaurant_name` — Restaurant name |
| 3 | `restaurant_whatsapp_number` — Number customers will text to order (validated + deduplicated) |
| 4 | `email` — For dashboard login |
| 5 | `address` — Restaurant address |
| 6 | `description` — Short business description |
| 7 | `working_hours` — Opening hours |
| 8 | `food_categories` — e.g., "North Indian, Chinese, Beverages" |
| 9+ | `menu_item_*` — Name, description, price, category, optional photo (repeated per item) |
| Last | `logo` — Restaurant logo photo (uploaded to Cloudinary) |

**On completion (`finalizeOnboarding`):**

- Creates a `RestaurantOwner` account with an auto-generated temporary password
- Creates a `Restaurant` record in MongoDB
- Creates a `WhatsAppConfig` record linking the target phone number
- Creates `MenuCategory` + `MenuItem` records from the collected menu
- Generates and sends an onboarding link (`/onboard/:restaurantId`)
- Sends dashboard login credentials to the owner via WhatsApp

**Returning owners** receive a menu to add another restaurant or go to their existing dashboard.

---

### 2. 🔗 Meta Embedded Signup

**Files:** `backend/routes/embeddedSignup.js`, `backend/services/embeddedSignupService.js`

After onboarding, the owner visits the onboarding link and clicks **"Start WhatsApp Business Setup"**. This redirects them to Meta's OAuth dialog where they:

1. Log into Facebook
2. Select or create a Meta Business Account
3. Verify the phone number they want to use for their restaurant

Meta then redirects back to `GET /api/embedded-signup/callback`, which:

1. Exchanges the OAuth code for a short-lived token → long-lived token
2. Discovers their **WhatsApp Business Account (WABA) ID** via 3 fallback methods
3. Fetches the **Phone Number ID** under that WABA
4. Saves all credentials to `WhatsAppConfig` in MongoDB
5. Subscribes the restaurant's number to the webhook
6. Registers the phone number with Meta Cloud API
7. Auto-configures the **WhatsApp Business Profile** (name, description, address, logo, hours)
8. Enables the restaurant's chatbot
9. Marks the restaurant as **active**
10. Sends a congratulations message to the owner via WhatsApp

**Admin manual activation:** Admins can bypass Meta Embedded Signup by directly providing `wabaId`, `phoneNumberId`, and `accessToken`.

---

### 3. 🍽️ Customer Ordering Chatbot

**File:** `backend/services/restaurantBotService.js`

Each restaurant gets its **own WhatsApp Business number**. When a customer texts that number:

1. The webhook routes the message to that restaurant's bot
2. The bot guides the customer through:

```
Greeting → Browse categories → Browse items → Add to cart
         → Cart review → Checkout → Order placed
```

**Global commands available at any step:**

| Command | Action |
|---|---|
| `menu` | Show all categories |
| `cart` | View current cart |
| `cancel` | Cancel current order |
| `track` | Track order status |
| `help` | Show help message |

> **Note:** The customer ordering chatbot is currently in active development.

---

### 4. 📡 Webhook Handler

**File:** `backend/routes/webhook.js`

Receives **all incoming WhatsApp messages** from Meta Cloud API and routes them:

- If `phone_number_id` = main platform number → **Onboarding Bot**
- If `phone_number_id` = any restaurant's configured number → **that restaurant's Ordering Bot**

**Security:** Verifies Meta's `HMAC-SHA256` signature on every incoming webhook request in production.

---

### 5. 🖥️ Restaurant Owner Dashboard

**Frontend:** `frontend/src/pages/restaurant/`

| Page | Functionality |
|---|---|
| **Dashboard** (`Dashboard.jsx`) | Overview stats — orders, revenue, customers |
| **WhatsApp** (`WhatsApp.jsx`) | Connection status, WABA ID, Phone Number ID, toggle bot on/off, retry Meta Embedded Signup |
| **Menu** (`Menu.jsx`) | Manage menu categories and items (add, edit, delete) |
| **Orders** (`Orders.jsx`) | View and manage incoming customer orders |
| **Profile** (`Profile.jsx`) | Edit restaurant name, description, address, working hours, logo |
| **Customers** (`Customers.jsx`) | View customer list |

---

### 6. 🛠️ Admin Dashboard

**Frontend:** `frontend/src/pages/admin/`  
**Backend:** `backend/routes/admin.js`

| Feature | Description |
|---|---|
| **Restaurants** | List all restaurants; filter by status (active/pending/inactive); search by name |
| **Restaurant Detail** | View WABA ID, Phone Number ID, signup status, owner info |
| **Onboarding Sessions** | Monitor all WhatsApp onboarding conversations in real time |
| **Orders** | Platform-wide order management |
| **Broadcast** | Send a WhatsApp message to all (or specific) restaurant owners at once |
| **Manual Activate** | Bypass Meta Embedded Signup; enter WABA ID/Phone Number ID directly |
| **Refresh Profile** | Re-push restaurant data to WhatsApp Business Profile |
| **Test Send** | Send a test WhatsApp message from a restaurant's number |
| **Activity Logs** | Full audit trail of all platform actions |
| **WhatsApp Configs** | Inspect raw `WhatsAppConfig` records |

---

### 7. 🔐 Authentication & Security

**Files:** `backend/routes/auth.js`, `backend/middleware/auth.js`, `backend/utils/jwt.js`

| Feature | Detail |
|---|---|
| **Auth mechanism** | JWT-based with access token + refresh token |
| **Roles** | `super_admin` (full platform control), `restaurant_owner` (own restaurant only) |
| **Webhook security** | HMAC-SHA256 signature verification on all incoming Meta webhooks |
| **HTTP security headers** | Helmet.js |
| **Rate limiting** | 200 requests per 15 minutes per IP |
| **CORS** | Locked to `FRONTEND_URL` environment variable |
| **Token storage** | `accessToken` stored in MongoDB with `select: false` |

---

### 8. 📁 File Storage

**File:** `backend/config/cloudinary.js`

All images follow this pipeline:

```
Owner/Customer sends image via WhatsApp
        ↓
Backend downloads image from Meta CDN
        ↓
Uploads to Cloudinary
        ↓
Cloudinary URL saved to MongoDB
```

This applies to:
- **Restaurant logos** — sent during onboarding bot flow
- **Menu item images** — sent per item during onboarding

---

### 9. ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express 4.19.2 |
| **Database** | MongoDB 8.4.3 + Mongoose |
| **Frontend** | React 18.3.1 + Vite 5.3.2 + Tailwind CSS 3.4.4 |
| **Authentication** | JWT — access token + refresh token (`jsonwebtoken`) |
| **WhatsApp API** | Meta WhatsApp Cloud API v19 |
| **File Storage** | Cloudinary |
| **Async Jobs** | BullMQ + Redis (ioredis 5.4.1) |
| **Logging** | Winston 3.13.0 + Morgan |
| **HTTP Client** | Axios 1.7.2 |
| **Security** | Helmet 7.1.0, bcryptjs 2.4.3, express-rate-limit 7.3.1 |
| **Validation** | express-validator 7.1.0 |
| **File Upload** | Multer + multer-storage-cloudinary |
| **Frontend Routing** | React Router DOM 6.24.0 |
| **Frontend Data** | TanStack React Query 5.45.1 |
| **Frontend Charts** | Recharts 2.12.7 |
| **Frontend Toasts** | react-hot-toast 2.4.1 |
| **Frontend Icons** | lucide-react 0.400.0 |
| **Frontend Dates** | date-fns 3.6.0 |

---

## Project Structure

```
ChatServe/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js          # Cloudinary SDK configuration
│   │   ├── db.js                  # MongoDB connection
│   │   └── redis.js               # Redis / BullMQ connection
│   ├── controllers/
│   │   └── authController.js      # Login, logout, refresh token logic
│   ├── middleware/
│   │   ├── auth.js                # JWT verification, role-based guards
│   │   ├── errorHandler.js        # Global error handler
│   │   └── upload.js              # Multer + Cloudinary upload middleware
│   ├── models/
│   │   ├── Admin.js               # Platform admin account
│   │   ├── Customer.js            # Diner/customer record
│   │   ├── Logs.js                # Activity audit log
│   │   ├── Menu.js                # MenuCategory + MenuItem schemas
│   │   ├── OnboardingSession.js   # WhatsApp onboarding conversation state
│   │   ├── Order.js               # Customer order record
│   │   ├── Restaurant.js          # Restaurant profile
│   │   ├── RestaurantOwner.js     # Restaurant owner account
│   │   └── WhatsAppConfig.js      # WABA ID, Phone Number ID, tokens
│   ├── routes/
│   │   ├── admin.js               # Admin-only API endpoints
│   │   ├── analytics.js           # Analytics endpoints
│   │   ├── auth.js                # Login, logout, refresh
│   │   ├── embeddedSignup.js      # Meta OAuth callback + manual activation
│   │   ├── menu.js                # Menu category/item CRUD
│   │   ├── onboarding.js          # Onboarding link page data
│   │   ├── order.js               # Order management
│   │   ├── restaurant.js          # Restaurant profile management
│   │   ├── upload.js              # Image upload endpoint
│   │   └── webhook.js             # Meta WhatsApp webhook receiver
│   ├── services/
│   │   ├── embeddedSignupService.js   # OAuth token exchange, WABA discovery
│   │   ├── notificationService.js     # Order notification logic
│   │   ├── onboardingBotService.js    # Conversational onboarding bot logic
│   │   ├── restaurantBotService.js    # Customer ordering chatbot logic
│   │   ├── whatsappProfileService.js  # Push profile to WhatsApp Business API
│   │   └── whatsappService.js         # WhatsApp message send helpers
│   ├── utils/
│   │   ├── helpers.js             # General utility functions
│   │   ├── jwt.js                 # Token generation and verification
│   │   ├── logger.js              # Winston logger setup
│   │   ├── phoneUtils.js          # Phone number formatting/validation
│   │   └── seed.js                # Database seeding script
│   ├── server.js                  # Express app entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── common/
    │   │       └── StatCard.jsx   # Reusable stat card component
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state (user, tokens, logout)
    │   ├── layouts/
    │   │   ├── AdminLayout.jsx    # Admin sidebar + nav wrapper
    │   │   └── RestaurantLayout.jsx # Restaurant sidebar + nav wrapper
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── Broadcast.jsx       # Send WhatsApp broadcast messages
    │   │   │   ├── Dashboard.jsx       # Admin overview stats
    │   │   │   ├── Onboarding.jsx      # Monitor onboarding sessions
    │   │   │   ├── Orders.jsx          # Platform-wide orders
    │   │   │   ├── RestaurantDetail.jsx # Single restaurant detail + actions
    │   │   │   └── Restaurants.jsx     # Restaurant list + filter/search
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx       # Login form
    │   │   │   ├── OnboardError.jsx    # Onboarding error page
    │   │   │   ├── OnboardPage.jsx     # Meta Embedded Signup trigger page
    │   │   │   └── OnboardSuccess.jsx  # Post-signup success page
    │   │   └── restaurant/
    │   │       ├── Customers.jsx       # Customer list
    │   │       ├── Dashboard.jsx       # Restaurant stats overview
    │   │       ├── Menu.jsx            # Menu category/item management
    │   │       ├── Orders.jsx          # Incoming orders management
    │   │       ├── Profile.jsx         # Edit restaurant profile
    │   │       └── WhatsApp.jsx        # WhatsApp connection management
    │   ├── services/
    │   │   └── api.js             # Axios instance + all API call functions
    │   ├── App.jsx                # Route definitions
    │   ├── index.css              # Tailwind base styles
    │   └── main.jsx               # React entry point
    └── package.json
```

---

## Database Models

| Model | Purpose |
|---|---|
| `Admin` | Platform super admin accounts |
| `RestaurantOwner` | Restaurant owner accounts (email, hashed password, linked restaurant) |
| `Restaurant` | Restaurant profile (name, address, description, working hours, status) |
| `WhatsAppConfig` | WABA ID, Phone Number ID, access token, webhook subscription status, bot enabled flag |
| `OnboardingSession` | Tracks multi-step WhatsApp onboarding conversation state per phone number |
| `Menu` | `MenuCategory` and `MenuItem` schemas (name, description, price, image, category) |
| `Order` | Customer orders (items, total, status, restaurant reference, customer reference) |
| `Customer` | Diner records (name, phone number, linked restaurant) |
| `Logs` | Full audit log of all platform actions |

---

## API Endpoints

### Authentication — `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login (admin or restaurant owner) |
| `POST` | `/api/auth/logout` | Authenticated | Logout and invalidate refresh token |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token for new access token |

### Webhook — `/api/webhook`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/webhook` | Public | Meta webhook verification challenge |
| `POST` | `/api/webhook` | Meta (HMAC-signed) | Receive incoming WhatsApp messages |

### Meta Embedded Signup — `/api/embedded-signup`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/embedded-signup/callback` | Public (OAuth redirect) | Exchange OAuth code, configure WhatsApp |
| `POST` | `/api/embedded-signup/manual-activate` | Admin | Manually activate with WABA/Phone IDs |

### Onboarding — `/api/onboarding`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/onboarding/:restaurantId` | Public | Get restaurant data for onboarding page |

### Restaurant — `/api/restaurant`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/restaurant/me` | Restaurant Owner | Get own restaurant profile |
| `PUT` | `/api/restaurant/me` | Restaurant Owner | Update restaurant profile |
| `GET` | `/api/restaurant/whatsapp` | Restaurant Owner | Get WhatsApp connection status |
| `POST` | `/api/restaurant/whatsapp/toggle-bot` | Restaurant Owner | Enable/disable chatbot |

### Menu — `/api/menu`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/menu/categories` | Restaurant Owner | Get all menu categories |
| `POST` | `/api/menu/categories` | Restaurant Owner | Create category |
| `PUT` | `/api/menu/categories/:id` | Restaurant Owner | Update category |
| `DELETE` | `/api/menu/categories/:id` | Restaurant Owner | Delete category |
| `GET` | `/api/menu/items` | Restaurant Owner | Get all menu items |
| `POST` | `/api/menu/items` | Restaurant Owner | Create menu item |
| `PUT` | `/api/menu/items/:id` | Restaurant Owner | Update menu item |
| `DELETE` | `/api/menu/items/:id` | Restaurant Owner | Delete menu item |

### Orders — `/api/orders`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/orders` | Restaurant Owner | Get restaurant's orders |
| `GET` | `/api/orders/:id` | Restaurant Owner | Get order detail |
| `PUT` | `/api/orders/:id/status` | Restaurant Owner | Update order status |

### Admin — `/api/admin`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/restaurants` | Admin | List all restaurants (filter, search) |
| `GET` | `/api/admin/restaurants/:id` | Admin | Restaurant detail |
| `GET` | `/api/admin/onboarding-sessions` | Admin | List all onboarding sessions |
| `GET` | `/api/admin/orders` | Admin | Platform-wide orders |
| `POST` | `/api/admin/broadcast` | Admin | Send WhatsApp broadcast |
| `POST` | `/api/admin/restaurants/:id/refresh-profile` | Admin | Re-push profile to WhatsApp |
| `POST` | `/api/admin/restaurants/:id/test-send` | Admin | Send test WhatsApp message |
| `GET` | `/api/admin/logs` | Admin | Activity logs |
| `GET` | `/api/admin/whatsapp-configs` | Admin | Inspect WhatsApp configs |

### Analytics — `/api/analytics`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/analytics/overview` | Restaurant Owner / Admin | Overview stats |
| `GET` | `/api/analytics/orders` | Restaurant Owner / Admin | Order analytics |

### Upload — `/api/upload`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/upload/image` | Authenticated | Upload image to Cloudinary |

---

## Roles & Permissions

| Capability | `super_admin` | `restaurant_owner` |
|---|---|---|
| View all restaurants | ✅ | ❌ |
| View own restaurant | ✅ | ✅ |
| Edit own restaurant | ✅ | ✅ |
| Manage own menu | ✅ | ✅ |
| View own orders | ✅ | ✅ |
| Platform-wide orders | ✅ | ❌ |
| Monitor onboarding sessions | ✅ | ❌ |
| Send broadcast messages | ✅ | ❌ |
| Manually activate restaurant | ✅ | ❌ |
| View activity logs | ✅ | ❌ |
| Inspect WhatsApp configs | ✅ | ❌ |
| Toggle own chatbot | ✅ | ✅ |

---

## Prerequisites

Before you begin, make sure you have the following:

- **Node.js** 18+ and **npm**
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Redis** (local or managed, e.g., [Upstash](https://upstash.com/))
- **Meta Developer Account** with a WhatsApp Business App configured
- **Cloudinary** account for image storage
- **ngrok** (or similar) for exposing localhost during development

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/pkanotara/ChatServe.git
cd ChatServe
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure environment variables

Copy the example below and create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env  # if example exists, otherwise create manually
```

See the [Environment Variables](#environment-variables) section for all required values.

### 5. Seed the database (optional)

Creates an initial super admin account:

```bash
cd backend
npm run seed
```

---

## Environment Variables

Create `backend/.env` with the following variables:

```env
# ── Server ─────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# ── MongoDB ────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/chatserve

# ── Redis ──────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── JWT ────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Meta WhatsApp Cloud API ─────────────────────────────────────
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_webhook_verify_token
META_MAIN_PHONE_NUMBER_ID=your_main_platform_phone_number_id
META_API_VERSION=v19.0
META_WEBHOOK_SECRET=your_hmac_webhook_secret

# ── Cloudinary ─────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Meta WhatsApp App Setup

1. Go to [developers.facebook.com](https://developers.facebook.com/) and create a new app (type: **Business**).
2. Add the **WhatsApp** product to your app.
3. Under **WhatsApp > API Setup**, note your:
   - `Phone Number ID` (this is your `META_MAIN_PHONE_NUMBER_ID`)
   - `WhatsApp Business Account ID`
4. Generate a **System User Access Token** with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
5. **Configure Webhook:**
   - Expose your backend: `ngrok http 5000`
   - Set Webhook URL to: `https://<your-ngrok-url>/api/webhook`
   - Set Verify Token to the value of `META_VERIFY_TOKEN` in your `.env`
   - Subscribe to the `messages` webhook field
6. **Configure Embedded Signup (OAuth):**
   - Under **App Settings > Advanced**, enable **Business Login**
   - Add `https://<your-backend-url>/api/embedded-signup/callback` as a valid OAuth redirect URI
   - Note your `App ID` and `App Secret` for the `.env` file

---

## Running the Application

### Development

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App starts on http://localhost:3000
```

**Terminal 3 — Expose webhook (for Meta):**
```bash
ngrok http 5000
# Copy the HTTPS URL and set it as your webhook in Meta Developer Console
```

### Production

**Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx, Vercel, or your preferred static host
```

---

## Production Deployment

### Backend (e.g., Railway, Render, AWS EC2)

- Set all environment variables from the [Environment Variables](#environment-variables) section
- Set `NODE_ENV=production`
- Ensure your MongoDB and Redis instances are accessible from the backend server
- Set `FRONTEND_URL` to your production frontend URL

### Frontend (e.g., Vercel, Netlify)

- Set `VITE_API_URL` to your production backend URL (used in `frontend/src/services/api.js`)
- Run `npm run build` and deploy the `dist/` folder

### WhatsApp Webhook

- Update the webhook URL in your Meta app to your production backend URL
- Ensure your backend domain serves HTTPS (required by Meta)

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Webhook verification fails | Check that `META_VERIFY_TOKEN` in `.env` matches the verify token set in Meta Developer Console |
| HMAC signature mismatch | Ensure the raw body parser is active for `/api/webhook` (already configured in `server.js`) |
| OAuth callback error | Verify the redirect URI in Meta App Settings matches your backend URL exactly |
| WABA ID not found | The embedded signup service tries 3 fallback methods; check that the Meta System User has correct permissions |
| Redis connection error | Confirm Redis is running and `REDIS_URL` is correct |
| Image upload fails | Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set correctly |
| CORS error | Set `FRONTEND_URL` in `.env` to your exact frontend origin (including protocol and port) |
| Rate limit hit | Default is 200 requests per 15 minutes per IP; adjust in `server.js` if needed |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).