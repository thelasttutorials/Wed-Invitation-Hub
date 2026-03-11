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

| Table | JS Name | Purpose |
|---|---|---|
| `admins` | `admins` | Super-admin accounts (email + bcrypt password hash) |
| `landing_settings` | `landingSettings` | Key-value store for editable landing page content |
| `invitations` | `invitations` | Wedding invitation data (slug, names, dates, venue, media) |
| `love_story_items` | `loveStoryItems` | Timeline entries per invitation |
| `rsvp_entries` | `rsvps` | Guest attendance confirmations (alias: `rsvpEntries`) |
| `guestbook_entries` | `wishes` | Guest messages/wishes (alias: `guestbookEntries`) |
| `users` | `users` | Customer accounts — email only, auth via OTP |
| `email_verifications` | `emailVerifications` | Short-lived 6-digit OTP codes for passwordless login |

### Notes
- `rsvpEntries` and `guestbookEntries` are exported as **aliases** for backward compatibility.
- `invitations.slug` unique constraint named `invitations_slug_key` in DB — matched via `uniqueIndex("invitations_slug_key")`.
- Default admin seeded on startup: `admin@wedhub.com` / `admin123`

## Pages & Routes

### Frontend (Wouter)
- `/` → `landing.tsx` — Marketing landing page (dynamic hero from DB)
- `/invite/:slug` → `invite.tsx` — **Canonical** public invitation page (with RSVP + Ucapan)
- `/invitation/:slug` → `invitation.tsx` — Legacy backward-compat page
- `/login` → `auth-login.tsx` — Customer OTP login/register (step 1: email, step 2: OTP)
- `/register` → `auth-login.tsx` — Alias for /login (same OTP flow)
- `/dashboard` → `dashboard.tsx` — Customer dashboard home
- `/dashboard/invitations` → `dashboard.tsx` — My invitations (coming soon)
- `/dashboard/new` → `dashboard.tsx` — Create invitation (coming soon)
- `/dashboard/rsvp` → `dashboard.tsx` — RSVP list (coming soon)
- `/dashboard/wishes` → `dashboard.tsx` — Guest wishes (coming soon)
- `/dashboard/settings` → `dashboard.tsx` — Account settings (coming soon)
- `/admin` → `dashboard.tsx` — Stats + quick links
- `/admin/invitations` → `invitations.tsx` — CRUD list
- `/admin/new` → `new-invitation.tsx` — Create form
- `/admin/:id/edit` → `edit-invitation.tsx` — Edit form
- `/admin/rsvp` → `rsvp.tsx` — View RSVP per invitation
- `/admin/wishes` → `wishes.tsx` — View ucapan per invitation
- `/admin/landing` → `landing.tsx` — Edit hero content
- `/admin/login` → `login.tsx` — Admin auth

### Backend API (`server/routes.ts`)

**Public (no auth):**
- `GET /api/invitations/:slug` — Invitation data + loveStory + rsvp + guestbook
- `POST /api/public/invitations/:slug/rsvp` — Submit RSVP (snake_case fields)
- `POST /api/public/invitations/:slug/wishes` — Submit ucapan (guest_name, message)
- `POST /api/invitations/:slug/rsvp` — Legacy RSVP endpoint (camelCase)
- `POST /api/invitations/:slug/guestbook` — Legacy wishes endpoint
- `GET /api/landing` — Public hero data
- `GET /api/landing-settings` — All settings key→value

**Customer Auth (`server/userAuth.ts`):**
- `POST /api/auth/request-code` — Generate & send OTP to email (rate limited: 5/10min)
- `POST /api/auth/verify-code` — Verify OTP → login/register user, set session
- `GET /api/auth/me` — Get current customer session
- `POST /api/auth/logout` — Destroy customer session

**Admin (requireAdmin):**
- `GET /api/invitations` — All invitations
- `GET /api/invitations/id/:id` — Single by ID + loveStory
- `POST /api/invitations` — Create (auto-slug from names)
- `PATCH /api/invitations/:id` — Update + loveStory replace
- `DELETE /api/invitations/:id` — Delete
- `GET /api/invitations/:id/rsvp` — RSVPs per invitation
- `GET /api/invitations/:id/guestbook` — Wishes per invitation
- `GET /api/admin/landing` — Hero settings
- `PATCH /api/admin/landing` — Update hero settings
- `GET /api/stats` — Totals: invitations, rsvp, guestbook

## Key Implementation Notes

### Customer Auth (OTP)
- Flow: email input → OTP (6 digit, 5 min expiry) → login/register in one step
- Rate limit: max 5 OTP requests per email per 10 minutes (in-memory window)
- OTP is single-use (marked `usedAt` after verify)
- Email sending: uses Resend if `RESEND_API_KEY` set; otherwise logs OTP to server console
- Session stores `userId`; `AdminGuard` uses `adminId` — they don't conflict
- `UserGuard` component redirects to `/login` if not authenticated

### RSVP (invite.tsx)
- Fields: `guest_name`, `attendance_status` (hadir/tidak_hadir/belum_pasti), `guest_count`, `note`
- Pre-fills name from `?to=NamaTamu` query param
- Endpoint: `POST /api/public/invitations/:slug/rsvp`

### Ucapan (invite.tsx)
- Fields: `guest_name`, `message`
- Shows list of existing wishes from `data.guestbook`
- Endpoint: `POST /api/public/invitations/:slug/wishes`

### Landing Page Hero
- Editable from `/admin/landing` — saves to `landing_settings` table
- Keys: hero_title, hero_subtitle, hero_cta_primary, hero_cta_link

### Date Sanitization
- `sanitizeDates()` in routes.ts converts empty-string `akadDate`/`receptionDate` to `null`

## Auth & Security
- **Admin**: `express-session` (7-day cookie), bcrypt (cost 12), `requireAdmin` middleware
- **Customer**: OTP via email, `requireUser` middleware, session `userId`
- `SESSION_SECRET` env var required in production

## Development
- Run: `npm run dev` (workflow: "Start application")
- DB sync: `npm run db:push`
- Default admin: `admin@wedhub.com` / `admin123`
- Email: set `RESEND_API_KEY` env var to enable real email; else OTP shown in server console
