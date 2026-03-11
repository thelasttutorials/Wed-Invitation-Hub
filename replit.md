# WedSaas — Digital Wedding Invitation Platform

## Overview
A modern SaaS landing page for a digital wedding invitation platform called "WedSaas". Built with React, TypeScript, TailwindCSS, and Shadcn UI components.

## Architecture
- **Frontend**: React + Vite (client/)
- **Backend**: Express.js (server/)
- **Styling**: TailwindCSS + Shadcn UI
- **Fonts**: Plus Jakarta Sans (body), Playfair Display (serif/wedding preview)

## Pages
- `/` — Main landing page (`client/src/pages/landing.tsx`)

## Landing Page Sections
1. **Navbar** — Fixed sticky navbar with logo, nav links, and CTA buttons. Transparent on top, white background on scroll.
2. **Hero** — Large hero with highlighted title, two CTA buttons, stats (10K+ couples, 4.9/5 rating, 100% free), and a mock invitation browser mockup with floating notification cards.
3. **Features** — 6-card grid with icons: Builder Visual, Responsif, Link Khusus, RSVP Online, Galeri Foto, Hadiah Digital.
4. **How It Works** — 4-step numbered flow with connecting lines.
5. **Theme Preview** — 4 theme cards with gradient preview images, ratings, Preview Demo and Gunakan buttons.
6. **Pricing** — 3-tier pricing (Gratis Rp 0 / Premium Rp 99K / Pro Rp 199K). Premium plan highlighted with blue background and "Paling Populer" badge.
7. **Testimonials** — 3 customer testimonial cards with star ratings.
8. **FAQ** — Accordion-style FAQ section with 6 questions.
9. **CTA** — Full-width blue gradient CTA section.
10. **Footer** — Links and copyright.

## Design Tokens
- **Primary color**: Blue `217 91% 60%` (configured in index.css)
- **Background**: White / Slate-50 alternating sections
- **Font**: Plus Jakarta Sans (body), Playfair Display (serif)
- **Border radius**: Small/medium rounded-md (6px) / rounded-xl for cards

## Key Design Decisions
- Completely static landing page (no backend data needed)
- Uses Indonesian language throughout (target market)
- Mobile-responsive with hamburger menu
- Sticky navbar with scroll-based transparency
- Hero includes a realistic browser mockup of an invitation
