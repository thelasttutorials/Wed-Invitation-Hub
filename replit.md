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

### Notes
- `rsvpEntries` and `guestbookEntries` are exported as **aliases** for backward compatibility with any code using the old names.
- `invitations.slug` unique constraint is named `invitations_slug_key` in DB — matched explicitly in schema via `uniqueIndex("invitations_slug_key")` to prevent Drizzle from renaming it.
- `admins` table is empty — must be seeded before auth is implemented.
- `landing_settings` is seeded with 9 default keys (hero_title, hero_subtitle, hero_cta_primary, hero_cta_secondary, features_title, features_subtitle, pricing_title, pricing_subtitle, footer_tagline).

## Pages & Routes

### Frontend (Wouter)
- `/` → `client/src/pages/landing.tsx` — Marketing landing page
- `/invitation/:slug` → `client/src/pages/invitation.tsx` — Public invitation page per couple
- `/admin` → `client/src/pages/admin/dashboard.tsx` — Admin dashboard (unprotected)
- `/admin/new` → `client/src/pages/admin/new-invitation.tsx` — Create invitation
- `/admin/:id/edit` → `client/src/pages/admin/edit-invitation.tsx` — Edit invitation

### Backend API (`server/routes.ts`)
- `GET /api/invitations` — All invitations
- `GET /api/invitations/id/:id` — Single by ID (+ loveStory)
- `GET /api/invitations/:slug` — Single by slug (+ loveStory + rsvp + guestbook)
- `POST /api/invitations` — Create (auto-generates slug from names)
- `PATCH /api/invitations/:id` — Update (+ optional loveStory replace)
- `DELETE /api/invitations/:id` — Delete
- `GET /api/invitations/:id/rsvp` — All RSVPs for an invitation
- `POST /api/invitations/:slug/rsvp` — Submit RSVP
- `GET /api/invitations/:id/guestbook` — All wishes/guestbook entries
- `POST /api/invitations/:slug/guestbook` — Submit wish
- `GET /api/landing-settings` — All settings as key→value map
- `GET /api/stats` — Aggregated stats (totalInvitations, totalRsvp, totalGuestbook)

## Storage Layer (`server/storage.ts`)
Real `DatabaseStorage` class — no mocks. All methods query PostgreSQL via Drizzle.

Key method groups:
- `getAdminByEmail`, `getAdminById`, `createAdmin`
- `getAllLandingSettings`, `getLandingSetting`, `upsertLandingSetting`, `upsertManyLandingSettings`
- `getAllInvitations`, `getInvitationBySlug`, `getInvitationById`, `createInvitation`, `updateInvitation`, `deleteInvitation`, `slugExists`
- `getLoveStoryByInvitation`, `replaceLoveStory` (delete-all + re-insert in one call)
- `getRsvpsByInvitation`, `createRsvp`
- `getWishesByInvitation`, `createWish`, `deleteWish`

## Design Tokens
- **Primary color**: Blue `217 91% 60%` (configured in `index.css`)
- **Background**: White / Slate-50 alternating sections
- **Border radius**: `rounded-md` (cards), `rounded-xl` (large cards)

## Security Status
- Admin routes are **unprotected** — no login/auth middleware exists yet
- Auth packages installed but unused: `passport`, `passport-local`, `express-session`
- No `/admin/login` page yet

## Migration
- Run `npm run db:push` to sync schema → database
- Schema is stable; no destructive prompts expected after the `invitations_slug_key` fix
