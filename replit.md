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
| `invitations` | Wedding invitation data (slug, names, dates, venue, media, userId, themeSlug) |
| `love_story_items` | Timeline entries per invitation |
| `rsvp_entries` | Guest attendance confirmations |
| `guestbook_entries` | Guest messages/wishes |
| `users` | Customer accounts — email only, auth via OTP |
| `email_verifications` | Short-lived 6-digit OTP codes for passwordless login |
| `pricing_plans` | Subscription plan definitions (Gratis/Premium/Pro) |
| `user_subscriptions` | Active plan per user |
| `orders` | Payment orders (paymentStatus, orderStatus, adminNote fields) |
| `payment_confirmations` | Transfer proof upload data (base64 image, sender info) |
| `bank_settings` | Admin-managed bank account for transfers |
| `templates` | 4 themed drag & drop wedding templates |
| `guests` | Per-invitation guest list with guestCode for personalized links |
| `contact_messages` | Public contact form submissions |

### Seeded Data
- Default admin: `admin@wedhub.com` / `admin123`
- Plans: Mulai Gratis (Rp 0, 1 inv, 3 photos), Premium (Rp 99.000), Pro (Rp 199.000)
- Bank: BCA 1234567890, Wed Invitation Hub
- 4 default templates seeded on startup

## Pages & Routes

### Frontend (Wouter)
**Public:**
- `/` → `landing.tsx` — Marketing landing page
- `/invite/:slug` → `invite.tsx` — Public invitation page (RSVP + Ucapan + ?guest=CODE or ?to=NAME params)
- `/invitation/:slug` → `invitation.tsx` — Legacy backward-compat page
- `/pricing` → `pricing.tsx` — Public pricing/plan selection page
- `/demo/:slug` → `demo.tsx` — Template live demo preview with sample data
- `/privacy` → `privacy.tsx` — Privacy policy page
- `/terms` → `terms.tsx` — Terms & conditions page
- `/contact` → `contact.tsx` — Contact form page

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
- `/dashboard/orders` → section="orders" — Order history with Invoice links
- `/dashboard/guests` → `dashboard/guests.tsx` — Guest management (add, import CSV, WhatsApp share, check-in)
- `/dashboard/invoice/:id` → `dashboard/invoice.tsx` — Printable invoice for paid orders

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
- `/admin/orders` → Approve/reject payments, view proofs, set adminNote + orderStatus
- `/admin/bank-settings` → Edit bank account info
- `/admin/templates` → Template list (4 themed templates)
- `/admin/templates/:id/builder` → Drag & drop Template Builder (3-panel: palette / canvas / properties)
- `/admin/contact-messages` → View public contact form submissions

### Backend API

**Public (no auth):**
- `GET /api/invitations/:slug` — Invitation data
- `POST /api/public/invitations/:slug/rsvp` — Submit RSVP
- `POST /api/public/invitations/:slug/wishes` — Submit ucapan
- `GET /api/landing` — Public hero data
- `GET /api/pricing` — All active pricing plans
- `GET /api/bank-settings` — Bank info for transfer page
- `GET /api/templates/:slug` — Public template by slug (for demo page)
- `GET /api/public/guests/:code` — Guest info by guestCode (for personalized invites)
- `POST /api/contact` — Submit contact form message

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
- `POST /api/orders/:id/upload-proof` — Upload transfer proof (triggers email notification)
- `GET /api/orders/:id/invoice` — Invoice data for paid order

**Guest Management (`server/guestRoutes.ts`):**
- `GET /api/guests?invitationId=X` — Guest list (auth user, own invitation only)
- `POST /api/guests` — Create guest (auto guestCode)
- `PATCH /api/guests/:id` — Update guest
- `DELETE /api/guests/:id` — Delete guest
- `POST /api/guests/import` — Bulk import from CSV data array
- `POST /api/guests/:id/checkin` — Mark guest checked in

**Admin Templates (`server/adminTemplateRoutes.ts`):**
- `GET /api/admin/templates` — All templates
- `GET /api/admin/templates/:id` — Single template
- `POST /api/admin/templates` — Create template
- `PATCH /api/admin/templates/:id` — Update template (sections_config, theme_config)
- `DELETE /api/admin/templates/:id` — Delete template

**Admin (`server/routes.ts` + `server/adminBillingRoutes.ts`):**
- Standard CRUD for invitations, RSVP, wishes, landing
- `GET /api/admin/pricing` — All plans
- `PATCH /api/admin/pricing/:id` — Update plan price/limits
- `GET /api/admin/orders` — All orders with user+plan+confirmation data
- `PATCH /api/admin/orders/:id/approve` — Approve payment → activate subscription + email
- `PATCH /api/admin/orders/:id/reject` — Reject payment + email
- `PATCH /api/admin/orders/:id/review` — Mark order as "reviewing"
- `PATCH /api/admin/orders/:id/complete` — Mark order as "completed"
- `GET /api/admin/bank-settings` — Bank account info
- `PATCH /api/admin/bank-settings` — Update bank info
- `GET /api/admin/contact-messages` — All contact form submissions

## Key Implementation Notes

### Theme System & Template Builder
- **4 Themes**: `romantic-floral` (rose/pink), `luxury-gold` (gold/champagne), `minimal-modern` (charcoal/grey), `classic-elegant` (navy/blue)
- Theme presets in `client/src/lib/themes.ts` — each has colors, fonts, CSS vars, overlay colors
- Section definitions in `client/src/lib/sectionDefs.ts` — 12 sections with visibility toggles
- `invitations` table has `theme_slug` (default: `romantic-floral`) and `section_config` (JSON text)
- `templates` table stores saved builder configs with sections_config and theme_config
- Public invite page (`invite.tsx`) applies theme via `getTheme(themeSlug)` — CSS vars injected on root div, inline styles on each section
- Section visibility controlled via `isSectionVisible(id)` from `parseSectionConfig(sectionConfig)`
- Template Builder uses `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag & drop
- Admin template routes in `server/adminTemplateRoutes.ts`; 4 default templates seeded on startup
- Template Demo: `/demo/:slug` loads template by slug from public API and shows full preview with sample wedding data

### Guest Management
- `guests` table: id, invitationId, name, phone, email, guestCode (unique 8-char), maxGuest, checkinStatus, checkedInAt
- guestCode uses uppercase alphabet + digits (no ambiguous chars: I, O, 0, 1)
- Personal invitation link: `/invite/:slug?guest=GUESTCODE` — fetches guest name, pre-fills RSVP/wish forms
- Also supports legacy `?to=NAME` param for simple name personalization
- Dashboard guest page: add guests, CSV import (Name,Phone,Email,MaxGuest columns), WhatsApp share, copy link, check-in toggle, delete
- Download CSV template button for bulk import

### Payment Enhancement
- `orders` has `orderStatus` (pending/reviewing/completed) and `adminNote` (internal notes)
- Email notifications via Resend (`server/emailService.ts`): proof upload, approve, reject
- Admin orders page shows both paymentStatus and orderStatus, admin can mark "Reviewing"/"Completed"
- Invoice page `/dashboard/invoice/:id` for paid orders (printable)

### Subscription System
- New users auto-assigned free plan on first OTP verification
- planHelpers.ts: `getUserActivePlan()`, `canCreateInvitation()`, `canUseMusic()` etc.
- `maxInvitations === 999` = unlimited; `maxGalleryPhotos === 999` = unlimited
- Order numbers: `WS-YYYYMMDD-RANDOM6`

### Payment Flow (Manual Bank Transfer)
1. User visits `/pricing` → clicks plan → creates order (`POST /api/orders`)
2. User sees bank transfer info on `/dashboard/billing`
3. User uploads transfer proof → email notification sent to admin
4. Admin sees order on `/admin/orders` → approve/reject → email notification sent to user
5. On approve: subscription activated, order marked paid, invoice available

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
- Email: set `RESEND_API_KEY` env var; else OTP/notifications shown in server console
