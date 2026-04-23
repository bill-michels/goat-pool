# Goat Pool — Component Breakdown

## 1. Recommended Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | React-based, file-based routing maps naturally to our URL structure, SSR for SEO on homepage, deployed natively on Vercel |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design system, pairs well with component libraries like shadcn/ui |
| **Backend** | Supabase | Postgres database, built-in auth (email + Google/social), Row Level Security for access control, real-time subscriptions, edge functions for server-side logic |
| **Payments** | Stripe | In-app payment processing for Player fees. Stripe Connect for splitting fees between platform and Commissioners |
| **Email** | Resend (or SendGrid) | Transactional emails for invitations, pick reminders, round results, elimination notices |
| **Hosting** | Vercel | Native Next.js support, automatic CI/CD from GitHub, edge network, serverless functions |
| **Scheduling** | Supabase pg_cron or Vercel Cron | Automated jobs for Round Lock enforcement, missed pick assignment, and pick reminders |

---

## 2. Component Breakdown

### 2.1 Authentication & User Management

**What it does:** Account creation, login, session management, profile editing.

**Components:**
- Supabase Auth — handles email/password and Google OAuth sign-in
- Auth middleware in Next.js — protects routes that require login
- User profile page — view/edit username, email, payment info
- Role management — distinguish between Player, Commissioner, and Admin

**Key considerations:**
- Admin role is not self-service; assigned directly in the database
- A user can be both a Commissioner and a Player (even in the same Pool)
- Username must be unique across the platform

---

### 2.2 Tournament Management (Admin)

**What it does:** Admin creates and manages tournaments, enters athlete data, marks round results.

**Components:**
- Tournament creation form — name, round count, athletes (with seed numbers and bye flags)
- Round Lock deadline editor — set date/time per round at creation
- Round results interface — mark athletes as won/lost per round
- Tournament status management — live vs. concluded

**Key considerations:**
- MVP supports one active tournament at a time
- All data entry is manual
- Marking an athlete as "lost" should cascade: that athlete becomes unselectable in all pools using this tournament
- Round Lock enforcement triggers missed pick auto-assignment

---

### 2.3 Pool Management (Commissioner)

**What it does:** Commissioners create, configure, and monitor their pools.

**Components:**
- Pool creation form — name (unique), select tournament, set Fee per Life, configure rules
- Pool rules configuration:
  - Fee per Life: Commissioner sets price per life. Players choose 1 or 2 lives at join time.
  - Missed Pick Rule: Top Seed Remaining (default) or Random
- Invitation system — enter email addresses, send invite emails with unique join links
- Pool dashboard — player metrics, pool metrics, pool status
- Commissioner payout tracking — fees collected minus platform take rate

**Key considerations:**
- Pool name must be globally unique (used in URLs)
- Invite links should be tokenized (unique, one-time-use or tied to email)
- Commissioner can also join their own pool as a Player
- Platform take rate defaults to 50%, configurable at pool and platform level

---

### 2.4 Player Experience (Pool Play)

**What it does:** Players view their pools, place picks, and track standings.

**Components:**
- Player dashboard — list of active and concluded pools
- Pool view — status, lives remaining, current round countdown, standings
- Pick placement interface — select from active athletes (filtered: no bye athletes in R1, no previously picked, no eliminated)
- Standings/leaderboard — all players with alive/dead status, picks remaining, locked-round picks visible
- Round history — view results of completed rounds

**Key considerations:**
- Picks are hidden from other players until Round Lock
- Pick submission is blocked after Round Lock
- Countdown timer to Round Lock should be prominent
- If player misses a pick, auto-assignment happens at Round Lock based on pool's Missed Pick Rule

---

### 2.5 Payments

**What it does:** Collects Player fees, holds funds during tournament, and pays out Commissioners at conclusion.

**Components:**
- Stripe Checkout — hosted payment page for Players joining a pool. Player selects 1 or 2 lives; total = Fee per Life × lives chosen. Card info never touches our servers.
- Stripe Connect (Express) — Commissioner onboarding for payouts. Stripe's hosted flow collects identity, tax info, and bank details. One-time setup per Commissioner.
- Manual payment marking — Commissioner can flag a player as "paid externally" (Venmo, cash, etc.)
- Fund holding — all Stripe-collected fees held in platform account until pool concludes
- Payout trigger — at pool conclusion, Admin or automated process transfers Commissioner's share as a single payout
- Refund capability — Admin can cancel a tournament and issue refunds to all Stripe-paying Players
- Payment records — track all transactions, payment status, and payout history per pool

**Key considerations:**
- Stripe handles PCI compliance — no card data on our servers
- Platform take rate (default 50%) calculated at payout time, not at payment time
- Manual payments don't flow through Stripe — just a status flag, not included in payout math
- Stripe Connect handles 1099 tax reporting for Commissioners (>$600/year)
- Refunds are Admin-only, triggered by tournament cancellation

---

### 2.6 Notifications & Email

**What it does:** Keeps players informed about key events.

**Components:**
- In-app notification system — stored in database, displayed in UI
- Email service integration (Resend/SendGrid) — triggered by events
- Notification preferences — future enhancement

**Email triggers (MVP):**
- Pool invitation with unique join link
- Pick deadline reminder (e.g., 24h and 1h before Round Lock)
- Round results (your pick won/lost)
- Player elimination notice
- Pool conclusion / winner announcement

---

### 2.7 Scheduled Jobs & Automation

**What it does:** Handles time-based events that can't rely on user actions.

**Jobs:**
- **Round Lock enforcement** — at the deadline, lock the round and prevent further picks
- **Missed pick assignment** — immediately after Round Lock, auto-assign picks for players who didn't submit
- **Pick reminder emails** — send reminders before Round Lock (24h, 1h)
- **Pool conclusion check** — after round results are entered, check if only one player (or zero) remains

---

### 2.8 Admin Dashboard

**What it does:** Platform-wide monitoring and management.

**Components:**
- Metrics overview — total users, pools, revenue
- Live tournament view — active pools, player counts, fee totals
- Concluded tournaments — historical data, per-pool breakdown
- Commissioner payout management — mark payouts as sent
- Platform settings — default take rate, etc.

---

## 3. Infrastructure & DevOps

| Component | Detail |
|---|---|
| **Repo** | Monorepo (Next.js app + Supabase migrations) on GitHub |
| **CI/CD** | Vercel auto-deploys from GitHub (preview deploys on PRs, production on main) |
| **Database migrations** | Supabase CLI for schema migrations, version-controlled |
| **Environment management** | Vercel env vars for secrets (Stripe keys, Supabase keys, email API keys) |
| **Monitoring** | Vercel Analytics + Supabase Dashboard for DB monitoring |

---

## 4. Third-Party Integrations Summary

| Service | Purpose | Account Needed |
|---|---|---|
| **Supabase** | Database, auth, real-time, edge functions | Yes (free tier available) |
| **Stripe** | Payment processing + Connect for splits | Yes (requires business verification for Connect) |
| **Resend** | Transactional email | Yes (free tier: 3k emails/month) |
| **Vercel** | Hosting, CI/CD, serverless functions, cron | Yes (free tier available) |
| **GitHub** | Source control | Yes |

---

## 5. Key Architectural Decisions

1. **Supabase Row Level Security (RLS)** — enforces access control at the database level. Players can only see their own picks before Round Lock. Commissioners can only manage their own pools. Admin has full access.

2. **Supabase Realtime** — used for live updates on the pool view (e.g., countdown timer sync, standings updates after round results).

3. **Stripe Connect (Express)** — allows the platform to collect payments and automatically split fees between the platform and Commissioner. Commissioners onboard via Stripe's hosted flow.

4. **Server-side round lock enforcement** — Round Lock logic runs server-side (Supabase edge function or Vercel cron), not client-side, to prevent manipulation.

5. **URL-based pool identification** — Pool names are unique and URL-safe, used directly in routes (`/poolplay/bills-wimbledon-pool`).
