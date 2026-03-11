# WedSaas — Digital Wedding Invitation Platform

## Overview
A full-stack SaaS platform for digital wedding invitations in Indonesian. Built with React, TypeScript, Express.js, TailwindCSS, Shadcn UI, Drizzle ORM, and PostgreSQL.

## Architecture
- **Frontend**: React + Vite (`client/`)
- **Backend**: Express.js (`server/`)
- **Database**: PostgreSQL via Drizzle ORM (`drizzle-orm/node-postgres` + `pg.Pool`)
- **Styling**: TailwindCSS + Shadcn UI
- **Fonts**: Plus Jakarta Sans (body), Playfair Display (serif/wedding)
- **Language**: Indonesian throughout all UI

## Database Schema (`shared/schema.ts`)

| Table | Purpose |
|---|---|
| `admins` | Super-admin accounts (email + bcrypt password hash) |
| `landing_settings` | Key-value store for editable landing page content |
| `invitations` | Wedding invitation data (slug, names, dates, venue, media) |
| `love_story_items` | Timeline entries per invitation |
| `rsvp_entries` | Guest attendance confirmations |
| `guestbook_entries` | Guest messages/wishes |
| `users` | Customer accounts — email only, auth via OTP |
| `email_verifications` | Short-lived 6-digit OTP codes for passwordless login |
| `pricing_plans` | Subscription plan definitions (Gratis/Premium/Pro) |
| `user_subscriptions` | Active plan per user |
| `orders` | Payment orders (status: pending/waiting_confirmation/paid/rejected/cancelled) |
| `payment_confirmations` | Transfer proof upload data (base64 image, sender info) |
| `bank_settings` | Admin-managed bank account for transfers |

### Seeded Data
- Default admin: `admin@wedhub.com` / `admin123`
- Plans: Mulai Gratis (Rp 0, 1 inv, 3 photos), Premium (Rp 99.000), Pro (Rp 199.000)
- Bank: BCA 1234567890, Wed Invitation Hub

## Pages & Routes

### Frontend (Wouter)
**Public:**
- `/` → `landing.tsx` — Marketing landing page
- `/invite/:slug` → `invite.tsx` — Public invitation page (RSVP + Ucapan)
- `/invitation/:slug` → `invitation.tsx` — Legacy backward-compat page
- `/pricing` → `pricing.tsx` — Public pricing/plan selection page

**Customer Auth:**
- `/login`, `/register` → `auth-login.tsx` — OTP email login/register

**Customer Dashboard:**
- `/dashboard` → `dashboard.tsx` section="home"
- `/dashboard/invitations` → section="invitations"
- `/dashboard/new` → section="new"
- `/dashboard/rsvp` → section="rsvp"
- `/dashboard/wishes` → section="wishes"
- `/dashboard/settings` → section="settings"
- `/dashboard/billing` → section="billing" — Active plan, transfer instructions, upload proof
- `/dashboard/orders` → section="orders" — Order history

**Admin:**
- `/admin/login` → Admin auth
- `/admin` → Dashboard (stats)
- `/admin/invitations` → CRUD invitations
- `/admin/new` → Create invitation
- `/admin/:id/edit` → Edit invitation
- `/admin/rsvp` → View RSVPs
- `/admin/wishes` → View ucapan
- `/admin/landing` → Edit hero content
- `/admin/pricing` → Edit plan prices and limits
- `/admin/orders` → Approve/reject payments, view transfer proofs
- `/admin/bank-settings` → Edit bank account info

### Backend API

**Public (no auth):**
- `GET /api/invitations/:slug` — Invitation data
- `POST /api/public/invitations/:slug/rsvp` — Submit RSVP
- `POST /api/public/invitations/:slug/wishes` — Submit ucapan
- `GET /api/landing` — Public hero data
- `GET /api/pricing` — All active pricing plans
- `GET /api/bank-settings` — Bank info for transfer page

**Customer Auth (`server/userAuth.ts`):**
- `POST /api/auth/request-code` — Generate & send OTP (rate limited: 5/10min)
- `POST /api/auth/verify-code` — Verify OTP → login/register
- `GET /api/auth/me` — Current customer session
- `POST /api/auth/logout` — Destroy session

**Customer Billing (`server/billingRoutes.ts`):**
- `GET /api/subscription/me` — Active subscription + plan
- `POST /api/subscriptions/start-free` — Activate free plan
- `POST /api/orders` — Create paid plan order
- `GET /api/orders/me` — My order history
- `POST /api/orders/:id/upload-proof` — Upload transfer proof (base64 image)

**Admin (`server/routes.ts` + `server/adminBillingRoutes.ts`):**
- Standard CRUD for invitations, RSVP, wishes, landing
- `GET /api/admin/pricing` — All plans
- `PATCH /api/admin/pricing/:id` — Update plan price/limits
- `GET /api/admin/orders` — All orders with user+plan+confirmation data
- `PATCH /api/admin/orders/:id/approve` — Approve payment → activate subscription
- `PATCH /api/admin/orders/:id/reject` — Reject payment
- `GET /api/admin/bank-settings` — Bank account info
- `PATCH /api/admin/bank-settings` — Update bank info

## Key Implementation Notes

### Subscription System
- New users auto-assigned free plan on first OTP verification
- planHelpers.ts: `getUserActivePlan()`, `canCreateInvitation()`, `canUseMusic()` etc.
- `maxInvitations === 999` = unlimited; `maxGalleryPhotos === 999` = unlimited
- Order numbers: `WS-YYYYMMDD-RANDOM6`

### Payment Flow (Manual Bank Transfer)
1. User visits `/pricing` → clicks plan → creates order (`POST /api/orders`)
2. User sees bank transfer info on `/dashboard/billing`
3. User uploads transfer proof (base64 data URL stored in DB)
4. Admin sees order on `/admin/orders` → approve/reject
5. On approve: subscription activated, order marked paid

### Customer Auth (OTP)
- Flow: email → 6-digit OTP (5 min expiry) → login/register
- Rate limit: max 5 OTP requests per email per 10 minutes
- OTP single-use; email via Resend (`RESEND_API_KEY` env) or server console log

### Auth Sessions
- Admin: `adminId` in session; Customer: `userId` in session — coexist via TS module augmentation
- `SESSION_SECRET` env var required in production

## Development
- Run: `npm run dev` (workflow: "Start application")
- DB sync: `npm run db:push`
- Default admin: `admin@wedhub.com` / `admin123`
- Email: set `RESEND_API_KEY` env var; else OTP shown in server console
