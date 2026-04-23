# Goat Pool

## What is this?

Goat Pool is a web app for tennis survivor pools. A Commissioner creates a pool tied to a real tennis tournament, invites friends to join, and each round players pick an athlete to win. Pick wrong and you lose a life. Last player(s) standing win.

## Documentation

All product and technical docs are in `./docs/`:

- **[docs/Goat Pool - Requirements (Final).md](./docs/Goat%20Pool%20-%20Requirements%20(Final).md)** — Complete product requirements including all pages, business rules, payment flows, and notification logic.
- **[docs/Goat Pool - Component Breakdown.md](./docs/Goat%20Pool%20-%20Component%20Breakdown.md)** — Tech stack, architecture, component breakdown, third-party integrations, and infrastructure plan.
- **[docs/Goat Pool - Data Model.md](./docs/Goat%20Pool%20-%20Data%20Model.md)** — Full Postgres schema (13 tables), relationships, Row Level Security policies, and indexes.

Read these docs before making architectural or product decisions.

## UI Mockups

All UI mockups are in `./docs/ui-mockups/` as React (.jsx) files. They use inline styles and the shared design system (green #4A7C59, cream #F5F3EF, charcoal #2D2D2D). Pages:

- `homepage.jsx` — Landing page with hero, how it works, example pool, pricing
- `login.jsx` — Login, Sign Up, and Forgot Password (toggle between modes)
- `profile.jsx` — User profile with account details, Stripe Connect status, pool stats
- `commissioner-dashboard.jsx` — Commissioner's pool list with stats
- `commissioner-start-pool.jsx` — 3-step pool creation wizard
- `commissioner-manage-pool.jsx` — Per-pool management with player/invite tabs
- `admin-dashboard.jsx` — Platform metrics, tournament monitoring
- `admin-tournament-setup.jsx` — Create tournament, add athletes, manage rounds/results
- `player-dashboard.jsx` — Player's pool list grouped by urgency
- `player-pool-view.jsx` — Per-pool view with standings and clickable round results
- `player-place-pick.jsx` — Athlete selection with search, hover states, confirmation

## Tech Stack

- **Frontend:** Next.js 14 (App Router) with Tailwind CSS and shadcn/ui
- **Backend/DB:** Supabase (Postgres, Auth, Row Level Security, Realtime, Edge Functions)
- **Payments:** Stripe Checkout + Stripe Connect (Express) for Commissioner payouts
- **Email:** Resend for transactional emails (invites, reminders, results)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Scheduling:** Supabase pg_cron or Vercel Cron for Round Lock enforcement and reminders

## Key Business Rules

- Players pick one athlete per round. Each athlete can only be picked once per pool.
- **Pay-per-life model:** Commissioner sets a Fee per Life. Players choose 1 or 2 lives when joining and pay accordingly (e.g., $4/life × 2 lives = $8). Lives are capped at 2.
- Picks are hidden from other players until Round Lock.
- Missed picks: auto-assigned based on pool's rule (Top Seed Remaining or Random), configured by Commissioner.
- Athletes with a bye in Round 1 are not selectable until Round 2.
- Platform take rate: 50% default, adjustable per pool and platform-wide.
- Payouts to Commissioners happen at pool conclusion, not as players join.
- Refunds are Admin-only, triggered by tournament cancellation.
- MVP supports one active tournament at a time.
- Tournament data is entered manually by Admin (API integration planned for future).

## Terminology

- **Pick** — The athlete a player selects for a round.
- **Life** — A chance to survive a wrong pick. Players buy 1 or 2 lives. Don't use "pick" to refer to lives.
- **Athlete** — A tennis player in the tournament. Don't use "player" for athletes.
- **Player** — A user participating in a pool.

## Roles

- **Player** — Joins pools, makes picks each round.
- **Commissioner** — Creates and manages pools. Can also be a Player.
- **Admin** — Manages tournaments, monitors platform, handles payouts and refunds.

## URL Structure

```
/home                                    — Landing page
/profile                                 — User profile
/commissioner/dash                       — Commissioner dashboard
/commissioner/startpool                  — Create a pool
/commissioner/managepool/:poolname       — Manage a specific pool
/player/dash                             — Player dashboard
/player/:poolname                        — View a pool
/player/:poolname/placepick              — Place a pick
/admin                                   — Admin dashboard
/admin/metrics                           — Platform metrics
/admin/metrics/livetournaments           — Live tournament monitoring
/admin/metrics/concludedtournaments      — Historical tournaments
/admin/metrics/concludedtournaments/:name — Tournament detail
/admin/tournamentsetup                   — Create/manage tournaments
```

## Database

13 Postgres tables in Supabase. See Data Model doc for full schema. Key tables:

- `users` — extends Supabase Auth with username, role, Stripe Connect ID
- `tournaments`, `athletes`, `rounds`, `athlete_results` — tournament data
- `pools` — pool config including `fee_per_life`, `missed_pick_rule`, `take_rate`
- `pool_players` — tracks `lives_purchased` and `lives_remaining` per player
- `picks` — player athlete selections per round
- `payments`, `payouts` — Stripe transaction tracking
- `pool_invites`, `notifications`, `platform_settings` — supporting features

Money is stored in cents (integers). Row Level Security enforces pick visibility and access control.
