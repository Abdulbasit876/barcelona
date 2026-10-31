# Barcelona Taxi Transfer — Admin Dashboard & Driver Portal

## Overview

A complete, production-ready **Admin Dashboard** and **Driver Portal** for Barcelona Taxi Transfer, built inside the `admin/` directory — fully isolated from the customer-facing website.

---

## Directory Structure

```
admin/
├── api/                        # NestJS Backend (Port 4001)
│   ├── src/
│   │   ├── app.module.ts       # Root module
│   │   ├── main.ts             # Bootstrap with Swagger
│   │   ├── common/
│   │   │   ├── guards/         # AdminGuard, DriverGuard (JWT + Supabase Auth)
│   │   │   ├── decorators/     # @CurrentUser()
│   │   │   ├── dto/            # Pagination, shared DTOs
│   │   │   └── services/       # SupabaseService (shared client)
│   │   └── modules/
│   │       ├── auth/           # Admin login, reset, create-admin, list admins
│   │       ├── bookings/       # CRUD, search, filters, CSV export, manual create
│   │       ├── approvals/      # Pending queue, approve, revise fare, reject
│   │       ├── drivers/        # Fleet CRUD with category assignment
│   │       ├── dispatch/       # Manual assign, auto-assign, rules, live board
│   │       ├── driver-portal/  # Mobile: login, my-rides, status updates, GPS, waiting time
│   │       ├── financials/     # Revenue trends, category perf., driver earnings
│   │       ├── settings/       # Deposit %, pricing rules, dispatch mode
│   │       └── notifications/  # Web Push subscribe, in-app alerts, test push
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.build.json
│
├── web/                        # Next.js Admin Dashboard (Port 3001)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout with Sidebar
│   │   │   ├── page.tsx        # Executive Overview Dashboard
│   │   │   ├── login/          # Secure admin login + password reset
│   │   │   ├── bookings/       # Full booking table, search, filters, CSV export
│   │   │   ├── approvals/      # Approve / Revise / Reject pending bookings
│   │   │   ├── drivers/        # Fleet management with driver cards
│   │   │   ├── dispatch/       # Live dispatch board + assignment rules
│   │   │   ├── financials/     # Revenue charts, category perf., driver earnings
│   │   │   ├── settings/       # Deposit %, pricing config, dispatch mode
│   │   │   ├── notifications/  # Push notification setup + alert log
│   │   │   └── driver/         # Mobile Driver Portal (all-in-one)
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Header (with push bell + create button)
│   │   │   ├── dashboard/      # StatCard, RevenueChart
│   │   │   └── bookings/       # CreateBookingModal (with deposit preview)
│   │   └── lib/
│   │       ├── api.ts          # Full typed API client for all endpoints
│   │       └── push.ts         # Web Push registration, VAPID, chime sound
│   ├── public/
│   │   └── sw.js               # Push Notification Service Worker
│   └── ...config files
│
├── supabase/
│   └── migrations/
│       └── 002_admin_and_driver_portal_schema.sql
│
├── .env.example                # All required environment variables
├── package.json                # Root scripts
└── README.md                   # This file
```

---

## Setup Instructions

### 1. Database Migration

Run the SQL migration in your Supabase project:

1. Open your Supabase project → **SQL Editor**
2. Paste the contents of `admin/supabase/migrations/002_admin_and_driver_portal_schema.sql`
3. Click **Run**

This adds:
- `admin_users` table with role-based access
- Extended `bookings` fields (deposit, approval_status, etc.)
- Extended `drivers` fields (user_id, categories, status, license)
- `system_settings` table (deposit %, pricing rules, dispatch config)
- `driver_assignment_rules` for category-based auto-dispatch
- `push_subscriptions` for Web Push (phone alerts)
- `notifications` for in-app alert center

---

### 2. Environment Variables

Copy `.env.example` to `.env` inside `admin/api/`:

```bash
cp admin/.env.example admin/api/.env
```

Fill in:
- `SUPABASE_URL` — Same as customer website
- `SUPABASE_SERVICE_ROLE_KEY` — From Supabase project settings
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — Generate with: `npx web-push generate-vapid-keys`
- `STRIPE_SECRET_KEY` — Same as customer website

For the Next.js web:
```bash
cp admin/.env.example admin/web/.env.local
```

---

### 3. Running the Admin API

```bash
# From the root BARCELONA folder
npm --prefix admin/api run start:dev
```

API runs on: **http://localhost:4001**  
Swagger docs: **http://localhost:4001/api/docs**

---

### 4. Running the Admin Dashboard

```bash
npm --prefix admin/web run dev
```

Dashboard runs on: **http://localhost:3001**

---

### 5. First Login

**Development (no Supabase setup yet):**
- Email: `admin@barcelonataxitransfer.com`
- Password: `admin123456`

This uses a dev bypass that returns a working session without Supabase. In production, create a real Supabase Auth account with the admin email then it will auto-seed into `admin_users`.

---

## Key Features

### 🏢 Executive Admin Dashboard
- Live KPI cards: total/today bookings, pending approvals, active rides
- Financial cards: gross booking value, payments received, outstanding balances, refunds
- Interactive revenue bar chart (7D / 14D / 30D)
- Vehicle category performance breakdown
- Recent bookings table with status, fare, deposit, and driver info
- Auto-refreshes every 30 seconds

### 📋 Booking Management
- Full table with search by reference/name/email/phone/address
- Filters: status, payment status, transfer type, vehicle category, date range, driver
- Sort + paginate
- CSV export with all booking fields
- Create manual bookings with live deposit preview
- Edit/cancel bookings with audit trail

### ✅ Approvals Queue
- Pending bookings highlighted with amber badge in sidebar
- Approve as-is, revise fare (with reason), or reject
- Revision sends reason to customer and recalculates deposit/balance
- All actions audit-logged

### 🚖 Dispatch Engine
- Live board: Unassigned → Assigned → In Progress → Completed
- Manual driver selection with conflict detection (90-minute schedule window check)
- Auto-assign button using category-based rules
- Rules: map vehicle category → specific driver with priority order (e.g., Economy → Driver A)
- Auto-refresh every 20 seconds

### 🚗 Driver Fleet
- Driver cards with status badges (Available/On Trip/Break/Offline)
- Create/edit/deactivate driver profiles
- Manage allowed vehicle categories per driver
- Active rides count display

### 💰 Financial Analytics
- Revenue & rides chart over 7/14/30 days
- Category revenue distribution table
- Driver earnings: total trips, completed, revenue, cash collected

### ⚙️ Settings
- Deposit % slider with live preview (20% default → any %)
- Pricing rules: city transfer rates, baby seat/booster prices, airport rates
- Dispatch mode: AUTO / MANUAL / HYBRID

### 🔔 Push Notifications
- Web Push (VAPID) registration for admin phone + browser
- Every new booking triggers instant push notification (regardless of type/status)
- In-app alert center with unread badge
- Test notification and test chime sound
- Service worker handles background push delivery
- Notification click opens specific booking

### 📱 Mobile Driver Portal
- Separate URL: `/driver`
- Login by phone or email + vehicle plate
- Today's rides / upcoming rides list
- Tap-to-call customer button
- Google Maps pickup + navigation links
- Status buttons: On My Way → Arrived → Passenger On Board → Completed
- Report waiting time with automatic extra-charge calculation (€0.50/min above free allowance)
- Live GPS tracking (10-second intervals logged to Supabase)
- Toggle online/break/offline availability

### 🔐 Security
- Admin routes protected by `AdminGuard` (validates Supabase JWT + `admin_users` table)
- Driver routes protected by `DriverGuard` (validates against `drivers` table)
- Drivers cannot access admin pages or endpoints
- No public registration — admin creates accounts only
- All sensitive actions logged to `audit_logs` table
- Dev bypass key for development without Supabase

---

## Generating VAPID Keys for Push Notifications

```bash
# Install web-push
npm install -g web-push

# Generate VAPID key pair
web-push generate-vapid-keys
```

Copy the output into `.env` as `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.  
Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in `admin/web/.env.local` to the public key.

---

## API Endpoints Summary

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/login, GET /auth/me, POST /auth/reset-password, POST /auth/create-admin |
| Bookings | GET/POST /bookings, GET/PATCH /bookings/:id, POST /bookings/:id/cancel, GET /bookings/export/csv |
| Approvals | GET /approvals/pending, POST /approvals/:id/approve|revise|reject |
| Drivers | GET/POST /drivers, GET/PATCH/DELETE /drivers/:id |
| Dispatch | POST /dispatch/assign|unassign|auto-assign/:id, GET /dispatch/board, CRUD /dispatch/rules |
| Driver Portal | POST /driver-portal/login, GET /driver-portal/my-rides, GET/PATCH /driver-portal/rides/:id, POST /driver-portal/location |
| Financials | GET /financials/overview|revenue-trends|category-performance|driver-earnings |
| Settings | GET /settings, PATCH /settings/deposit|pricing|dispatch |
| Notifications | POST /notifications/subscribe|test, GET /notifications, PATCH /notifications/:id/read |

Full interactive documentation: http://localhost:4001/api/docs

---

## Notes

- The customer website (`apps/web`, `apps/api`) is **completely untouched**
- All admin code lives exclusively inside `admin/`
- Same Supabase project is shared — no duplicate database
- Migration `002_*` safely extends existing tables with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
