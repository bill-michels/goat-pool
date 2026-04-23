# Goat Pool — Data Model

## Overview

This document defines the Postgres database schema for Goat Pool, designed for Supabase. All tables use UUIDs as primary keys. Timestamps are stored in UTC. Supabase Auth handles the core authentication — our `users` table extends it with app-specific fields.

---

## Entity Relationship Diagram

```
users ──────────┬──────────── pools (commissioner)
                │                │
                │                ├── pool_players ──── picks
                │                │
                │                └── pool_invites
                │
                └── stripe_accounts
                
tournaments ──── athletes
            └── rounds ──── athlete_results

platform_settings (singleton)

payments
notifications
```

---

## Tables

### 1. `users`

Extends Supabase Auth. Every authenticated user gets a row here.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, references `auth.users(id)` | Supabase Auth user ID |
| `username` | text | UNIQUE, NOT NULL | Display name, used in URLs and standings |
| `email` | text | NOT NULL | User's email address |
| `role` | text | NOT NULL, DEFAULT 'player' | One of: `player`, `commissioner`, `admin`. Note: `commissioner` is granted when a user creates their first pool. `admin` is set directly in DB. |
| `stripe_connect_account_id` | text | NULLABLE | Stripe Connect account ID (for Commissioners and Admin receiving payouts) |
| `stripe_connect_onboarded` | boolean | DEFAULT false | Whether Stripe Connect onboarding is complete |
| `created_at` | timestamptz | DEFAULT now() | Account creation time |
| `updated_at` | timestamptz | DEFAULT now() | Last profile update |

**Notes:**
- A user can function as both Commissioner and Player — the `role` field tracks their highest privilege level.
- Supabase Auth handles password hashing, sessions, and OAuth tokens.

---

### 2. `tournaments`

Each tournament represents a real tennis event.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `name` | text | UNIQUE, NOT NULL | e.g., "Wimbledon 2026" |
| `num_rounds` | integer | NOT NULL | Total number of rounds (set at creation) |
| `status` | text | NOT NULL, DEFAULT 'upcoming' | One of: `upcoming`, `active`, `concluded`, `cancelled` |
| `created_by` | uuid | FK → users(id), NOT NULL | Admin who created it |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

---

### 3. `athletes`

Tennis players in a tournament.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `tournament_id` | uuid | FK → tournaments(id), NOT NULL | Which tournament this athlete is in |
| `name` | text | NOT NULL | Athlete's full name |
| `seed` | integer | NOT NULL | Seed/ranking number (1 = top seed) |
| `has_bye` | boolean | DEFAULT false | If true, athlete has a bye in Round 1 and is not selectable until Round 2 |
| `status` | text | NOT NULL, DEFAULT 'active' | One of: `active`, `eliminated` |
| `eliminated_in_round` | integer | NULLABLE | Round number in which the athlete was eliminated |
| `created_at` | timestamptz | DEFAULT now() | |

**Unique constraint:** `(tournament_id, name)` — no duplicate athlete names within a tournament.
**Unique constraint:** `(tournament_id, seed)` — no duplicate seeds within a tournament.

---

### 4. `rounds`

Rounds within a tournament, each with a lock deadline.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `tournament_id` | uuid | FK → tournaments(id), NOT NULL | |
| `round_number` | integer | NOT NULL | 1, 2, 3, etc. |
| `lock_deadline` | timestamptz | NOT NULL | Picks due by this time |
| `status` | text | NOT NULL, DEFAULT 'upcoming' | One of: `upcoming`, `active`, `locked`, `completed` |
| `created_at` | timestamptz | DEFAULT now() | |

**Unique constraint:** `(tournament_id, round_number)`

---

### 5. `athlete_results`

Records the outcome of each athlete in each round.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `round_id` | uuid | FK → rounds(id), NOT NULL | |
| `athlete_id` | uuid | FK → athletes(id), NOT NULL | |
| `result` | text | NOT NULL | One of: `win`, `loss` |
| `recorded_by` | uuid | FK → users(id), NOT NULL | Admin who entered the result |
| `created_at` | timestamptz | DEFAULT now() | |

**Unique constraint:** `(round_id, athlete_id)` — one result per athlete per round.

---

### 6. `pools`

A survivor pool created by a Commissioner, tied to a tournament.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `name` | text | UNIQUE, NOT NULL | Pool name (used in URLs) |
| `slug` | text | UNIQUE, NOT NULL | URL-safe version of pool name |
| `tournament_id` | uuid | FK → tournaments(id), NOT NULL | |
| `commissioner_id` | uuid | FK → users(id), NOT NULL | User who created/manages this pool |
| `fee_per_life` | integer | NOT NULL | Fee per life in cents (e.g., 400 = $4.00). Players choose 1 or 2 lives at join time. |
| `missed_pick_rule` | text | NOT NULL, DEFAULT 'top_seed' | One of: `top_seed`, `random` |
| `take_rate` | integer | NOT NULL, DEFAULT 50 | Platform take rate percentage (0-100) |
| `status` | text | NOT NULL, DEFAULT 'open' | One of: `open` (accepting players), `active` (tournament started), `concluded`, `cancelled` |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

---

### 7. `pool_players`

Join table: which users are playing in which pools.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `pool_id` | uuid | FK → pools(id), NOT NULL | |
| `user_id` | uuid | FK → users(id), NOT NULL | |
| `status` | text | NOT NULL, DEFAULT 'alive' | One of: `alive`, `eliminated`, `winner` |
| `lives_purchased` | integer | NOT NULL | Number of lives the player bought (1 or 2) |
| `lives_remaining` | integer | NOT NULL | Starts at `lives_purchased` value, decremented on wrong picks |
| `payment_status` | text | NOT NULL, DEFAULT 'unpaid' | One of: `unpaid`, `paid_stripe`, `paid_external` |
| `payment_id` | uuid | NULLABLE, FK → payments(id) | Link to Stripe payment record if paid in-app |
| `joined_at` | timestamptz | DEFAULT now() | |

**Unique constraint:** `(pool_id, user_id)` — a user can only join a pool once.

---

### 8. `picks`

A player's athlete selection for a specific round within a pool.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `pool_id` | uuid | FK → pools(id), NOT NULL | |
| `user_id` | uuid | FK → users(id), NOT NULL | |
| `round_id` | uuid | FK → rounds(id), NOT NULL | |
| `athlete_id` | uuid | FK → athletes(id), NOT NULL | |
| `is_auto_assigned` | boolean | DEFAULT false | True if this pick was auto-assigned due to missed deadline |
| `result` | text | NULLABLE | One of: `win`, `loss`, NULL (pending) — populated when round results are entered |
| `created_at` | timestamptz | DEFAULT now() | |

**Unique constraint:** `(pool_id, user_id, round_id)` — one pick per player per round per pool.
**Unique constraint:** `(pool_id, user_id, athlete_id)` — each athlete can only be picked once per player per pool.

---

### 9. `pool_invites`

Tracks email invitations sent by Commissioners.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `pool_id` | uuid | FK → pools(id), NOT NULL | |
| `email` | text | NOT NULL | Invited email address |
| `invite_token` | text | UNIQUE, NOT NULL | Unique token for the join link |
| `status` | text | NOT NULL, DEFAULT 'pending' | One of: `pending`, `accepted`, `expired` |
| `sent_at` | timestamptz | DEFAULT now() | |
| `accepted_at` | timestamptz | NULLABLE | When the invite was used |

---

### 10. `payments`

Records all Stripe transactions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `pool_id` | uuid | FK → pools(id), NOT NULL | |
| `user_id` | uuid | FK → users(id), NOT NULL | Player who paid |
| `amount` | integer | NOT NULL | Amount in cents |
| `stripe_payment_intent_id` | text | UNIQUE, NULLABLE | Stripe PaymentIntent ID |
| `stripe_checkout_session_id` | text | UNIQUE, NULLABLE | Stripe Checkout Session ID |
| `status` | text | NOT NULL, DEFAULT 'pending' | One of: `pending`, `completed`, `refunded`, `failed` |
| `refunded_at` | timestamptz | NULLABLE | If refunded, when |
| `created_at` | timestamptz | DEFAULT now() | |

---

### 11. `payouts`

Tracks Commissioner payouts at pool conclusion.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `pool_id` | uuid | FK → pools(id), NOT NULL | |
| `commissioner_id` | uuid | FK → users(id), NOT NULL | |
| `amount` | integer | NOT NULL | Payout amount in cents |
| `platform_amount` | integer | NOT NULL | Platform's share in cents |
| `stripe_transfer_id` | text | UNIQUE, NULLABLE | Stripe Transfer ID |
| `status` | text | NOT NULL, DEFAULT 'pending' | One of: `pending`, `completed`, `failed` |
| `created_at` | timestamptz | DEFAULT now() | |
| `completed_at` | timestamptz | NULLABLE | |

---

### 12. `notifications`

In-app notifications for users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `user_id` | uuid | FK → users(id), NOT NULL | Recipient |
| `type` | text | NOT NULL | e.g., `pick_reminder`, `round_result`, `elimination`, `pool_concluded`, `invite` |
| `title` | text | NOT NULL | Short notification title |
| `body` | text | NOT NULL | Notification message |
| `pool_id` | uuid | NULLABLE, FK → pools(id) | Related pool, if applicable |
| `is_read` | boolean | DEFAULT false | |
| `created_at` | timestamptz | DEFAULT now() | |

---

### 13. `platform_settings`

Singleton table for platform-wide configuration.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | integer | PK, DEFAULT 1, CHECK (id = 1) | Enforces single row |
| `default_take_rate` | integer | NOT NULL, DEFAULT 50 | Default platform take rate percentage |
| `admin_stripe_account_id` | text | NULLABLE | Admin's Stripe Connect account for receiving platform share |
| `updated_at` | timestamptz | DEFAULT now() | |

---

## Key Relationships

```
tournaments 1──* athletes        (a tournament has many athletes)
tournaments 1──* rounds           (a tournament has many rounds)
rounds      1──* athlete_results  (a round has results for each athlete)
tournaments 1──* pools            (a tournament can have many pools)
users       1──* pools            (a commissioner creates many pools)
pools       1──* pool_players     (a pool has many players)
pools       1──* pool_invites     (a pool has many invites)
pools       1──* picks            (a pool has many picks)
pools       1──* payments         (a pool has many payments)
pools       1──1 payouts          (a pool has one commissioner payout)
users       1──* pool_players     (a user can be in many pools)
users       1──* picks            (a user makes many picks)
users       1──* notifications    (a user receives many notifications)
```

---

## Row Level Security (RLS) Summary

| Table | Rule | Description |
|---|---|---|
| `users` | Users can read/update their own row. Admin can read all. | |
| `tournaments` | All authenticated users can read. Only Admin can create/update. | |
| `athletes` | All authenticated users can read. Only Admin can create/update. | |
| `rounds` | All authenticated users can read. Only Admin can create/update. | |
| `athlete_results` | All authenticated users can read. Only Admin can create. | |
| `pools` | All authenticated users can read. Commissioner can update their own pools. | |
| `pool_players` | Players can read their own pool memberships. Commissioner can read all players in their pools. | |
| `picks` | **Before Round Lock:** Players can only read/write their own picks. **After Round Lock:** All pool members can read all picks for that round. | Pick visibility rule enforced at DB level. |
| `pool_invites` | Commissioner can read/create for their own pools. | |
| `payments` | Players can read their own. Commissioner can read for their pools. Admin can read all. | |
| `payouts` | Commissioner can read their own. Admin can read/update all. | |
| `notifications` | Users can only read/update their own. | |
| `platform_settings` | Only Admin can read/update. | |

---

## Indexes

Key indexes for query performance:

```sql
-- Athlete lookups by tournament
CREATE INDEX idx_athletes_tournament ON athletes(tournament_id);
CREATE INDEX idx_athletes_tournament_status ON athletes(tournament_id, status);

-- Round lookups
CREATE INDEX idx_rounds_tournament ON rounds(tournament_id);
CREATE INDEX idx_rounds_status ON rounds(status);

-- Pool lookups
CREATE INDEX idx_pools_tournament ON pools(tournament_id);
CREATE INDEX idx_pools_commissioner ON pools(commissioner_id);
CREATE INDEX idx_pools_status ON pools(status);

-- Player lookups within pools
CREATE INDEX idx_pool_players_pool ON pool_players(pool_id);
CREATE INDEX idx_pool_players_user ON pool_players(user_id);
CREATE INDEX idx_pool_players_pool_status ON pool_players(pool_id, status);

-- Pick lookups (critical for game logic)
CREATE INDEX idx_picks_pool_round ON picks(pool_id, round_id);
CREATE INDEX idx_picks_pool_user ON picks(pool_id, user_id);
CREATE INDEX idx_picks_user_round ON picks(user_id, round_id);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Payments
CREATE INDEX idx_payments_pool ON payments(pool_id);
CREATE INDEX idx_payments_user ON payments(user_id);
```
