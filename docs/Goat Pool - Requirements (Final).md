# Goat Pool — Final Requirements

## 1. Summary

Goat Pool is a web app that enables users to set up a survivor pool ("Pool") for a professional tennis tournament. A group of friends compete by predicting winners of each round. Pick correctly and you survive; pick wrong and you lose a life. The last player standing wins.

### Pricing Model

- No fee for the Commissioner to set up a Pool.
- Commissioner sets a **Fee per Life** (e.g., $4/life).
- Players choose how many lives they want — **1 or 2** — and pay accordingly (e.g., $4 for 1 life, $8 for 2 lives).
- Pool fees are split between the Commissioner and the Goat Pool platform.
- Default platform take rate: **50%** (configurable at both pool and platform level).

---

## 2. Roles

| Role | Description |
|---|---|
| **Player** | A user who participates in a Pool by making picks each round. |
| **Commissioner** | A user who creates and manages a Pool. Can also be a Player in that Pool. |
| **Admin** | A platform-level user who manages Tournaments, monitors all Pools, and oversees the entire app. |

---

## 3. Definitions

### Entities

- **Pool** — A group of Players competing to predict winners across rounds of a Tournament.
- **Tournament** — A real-life tennis tournament that provides the matches for a Pool. **MVP supports one active Tournament at a time.**
- **Athlete** — A tennis player competing in a Tournament.
- **Active Athletes** — Athletes who have not lost a Match.
- **Eliminated Athletes** — Athletes who have lost a Match.
- **Round** — A stage of the Tournament where every remaining Athlete has a Match.
- **Match** — A single tennis match within a Round.
- **Pick** — The Athlete a Player selects for a given Round.
- **Life** — A chance to survive a wrong pick. Players purchase 1 or 2 lives when joining a Pool. If a picked athlete loses, the Player loses one life. When all lives are gone, the Player is eliminated.
- **Fee per Life** — The cost per life, set by the Commissioner. Players pay Fee × number of lives purchased (e.g., $4/life × 2 lives = $8).

### Events & States

- **Pick Select** — A Player selects an Athlete for a Round.
- **Athlete Win** — An Athlete's Match result is marked as a win by Admin.
- **Athlete Loss** — An Athlete's Match result is marked as a loss by Admin.
- **Round Lock** — The deadline after which Players can no longer submit or change Picks for that Round.
- **Missed Pick** — If a Player does not submit a Pick before Round Lock, an athlete is auto-assigned based on the Pool's **Missed Pick Rule** (configured by Commissioner):
  - **Top Seed Remaining** (default) — the highest-seeded active athlete the Player has not yet picked.
  - **Random** — a randomly selected active athlete the Player has not yet picked.
- **Player Eliminated** — A Player has exhausted all purchased lives.
- **Pool Concluded** — The pool ends when only one player remains, or when the tournament ends. All surviving players are declared **winners**. There is no in-app prize payout to players — any winnings distribution happens outside the app at the Commissioner's discretion.

---

## 4. Pages & URL Structure

| URL | Page | Description |
|---|---|---|
| `/home` | Homepage | Landing page with app info, how it works, pricing |
| `/profile` | User Profile | View/edit username, email, payment info |
| `/commissioner/dash` | Commissioner Dashboard | List of live & concluded Pools where user is Commissioner |
| `/commissioner/startpool` | Start a Pool | Create and configure a new Pool |
| `/commissioner/managepool/:poolname` | Manage Pool | Per-pool management view with player & pool metrics |
| `/player/dash` | Player Dashboard | List of Pools the user is playing in |
| `/player/:poolname` | Pool View | View pool details, standings, rounds |
| `/player/:poolname/placepick` | Place Pick | Select an Athlete for the current Round |
| `/admin` | Admin Dashboard | Platform-level monitoring and management |
| `/admin/metrics` | Admin Metrics | Overview metrics |
| `/admin/metrics/livetournaments` | Live Tournaments | Active tournament monitoring |
| `/admin/metrics/concludedtournaments` | Concluded Tournaments | Historical tournament data |
| `/admin/metrics/concludedtournaments/:name` | Tournament Detail | Drill-down on a concluded tournament |
| `/admin/tournamentsetup` | Tournament Setup | Create and manage Tournaments |

---

## 5. Feature Requirements

### 5.1 Homepage (`/home`)

- General information about Goat Pool: what it is, how it works, pricing.
- Call-to-action to start a pool or join a pool.
- Top navigation tabs: **Start/Manage Pool**, **Join/View Pool**, **Profile**, **Login** (hamburger menu).

### 5.2 Authentication & Login

- Create Account or Login.
- Fields: Email and Username.
- Google/Social authentication support.
- Forgot Password flow.

### 5.3 User Profile (`/profile`)

- Accessible from the Profile tab. If not logged in, prompt to log in.
- Displays: Username, Email, Payment info.
- Edit capabilities: Change Username, Change Email.

### 5.4 Admin: Monitor & Tournament Management (`/admin`)

#### Platform Payment Setup

- Admin connects their own payment account via **Stripe Connect** to receive the platform's share of fees.
- Stripe onboarding collects: legal name (or business name), tax ID (SSN or EIN), address, and bank account for payouts.
- Can onboard as an **individual** initially and update to an **LLC or business entity** later without disruption.
- The platform's take rate share from all pools is paid out to this account.

#### Monitoring

- **Total Metrics** — platform-wide overview.
- **Live Tournaments:**
  - List of Pools per tournament, showing: number of Players, total fees.
- **Concluded Tournaments:**
  - List of concluded tournaments, each showing: list of Pools, Players, total fees, Pay Commissioner action.

#### Tournament Setup (`/admin/tournamentsetup`)

**Tournament-Level Setup (at creation):**
- Name of Tournament (e.g., "Wimbledon 2026")
- Number of Rounds — set up front (e.g., 7 for a 128-draw tournament)
- List of Athletes — entered by Admin (e.g., comma-separated names), each with a **seed number** (1 = top seed)
- **Bye Flag** — Admin marks athletes who have a bye in Round 1. These athletes are part of the tournament but are **not selectable by Players in Round 1**. They become available starting Round 2.
- Round Lock Deadlines — a submission deadline (date/time) for each round, set at tournament creation.

**Round-Level Management (as tournament progresses):**
- Mark Athletes Won — Admin marks which athletes won their match. Results are saved individually and visible to players in real time.
- Mark Athletes Lost — Admin marks which athletes lost their match.
- Athletes marked as lost become **Eliminated Athletes** and are no longer selectable in future rounds.
- **Finalize Round** — once all results are entered, Admin finalizes the round. This triggers game logic: checking picks against results, deducting lives, eliminating players, and running missed pick auto-assignments.
- **Edit Round Lock Deadlines** — Admin can adjust a round's lock deadline at any time before it passes (e.g., to accommodate rain delays or late-running matches).
- **Round Overlap** — Finalizing a previous round and locking the next round are independent. Players may need to submit picks for the next round before all previous-round results are in. If a player is eliminated in a late-finishing previous round, their current-round pick is voided.

**Tournament Cancellation:**
- Admin can cancel an active tournament. This cancels all associated pools and triggers the ability to issue refunds to all Players who paid via Stripe.

**Data entry is fully manual for MVP.** Future enhancement: integrate with a tennis data API (e.g., SportRadar) for automatic draw/results.

### 5.5 Commissioner: Pool Management (`/commissioner/dash`)

- User must be logged in.
- Lists of Live Pools and Concluded Pools where user is Commissioner.

#### Start a Pool (`/commissioner/startpool`)

- **Name Pool** (must be unique).
- **Select Tournament** from list of available tournaments.
- **Set Fee per Life** (e.g., $4). Players choose 1 or 2 lives at join time and pay accordingly.
- **Configure Pool Rules:**
  - Missed Pick Rule: **Top Seed Remaining (default)** or **Random**.
- **Commissioner Plays:** Commissioner can opt in as a Player during pool creation. If playing, they choose 1 or 2 lives. The Commissioner does not pay a fee — they are automatically added to the pool with `payment_status: paid_external`.
- **Final Pick Time** per round (Round Lock deadline).
- **Invite Players:** Commissioner enters email addresses; Players receive an **email with a unique join link**.

#### Per-Pool Management (`/commissioner/managepool/:poolname`)

**Player Metrics:**
- Pool status: Live or Concluded
- Number of Players
- List of Player usernames
- Number of invites sent
- List of invite email addresses
- Total fees collected
- Commissioner payout (total fees minus platform take rate), payable at Pool conclusion

**Pool Metrics:**
- Pool Name
- Tournament name
- Number of lives remaining (across pool)
- Number of Players remaining (alive)
- List of alive Players with their remaining lives

### 5.6 Player: Pool View & Picks (`/player/dash`)

- Lists all Pools the user is playing in or has played (links to each).

#### Per-Pool View (`/player/:poolname`)

- **Status:** Live or Concluded
- **Lives Remaining:** count of lives the Player has left
- **Current Round:**
  - Round number
  - Time until Round Lock (countdown)
- **Place Pick** (`/player/:poolname/placepick`):
  - Player selects an Athlete from the list of **Active Athletes only**.
  - Player cannot pick an Athlete they have already picked in a previous round (default rule).
  - **Picks are hidden from other Players until Round Lock.**
- **Player Standings:**
  - Count of Players
  - Count of total picks made
  - Count of Players alive
  - Player list showing: Username, Alive/Dead status, Lives remaining, Athletes picked (visible only for locked rounds)
- **Pool Rounds:** List of locked/completed Rounds with results (Round 1, Round 2, … Round N).

---

## 6. Payments

### Player Payment

Dual payment model:

1. **Stripe Checkout (in-app):** When a Player clicks "Join Pool," they choose 1 or 2 lives and are redirected to a Stripe-hosted checkout page to pay (Fee per Life × lives chosen). Card info is entered on Stripe's page (never on our site). Funds are held in the Goat Pool platform's Stripe account until the pool concludes.
2. **Manual/external payments:** Commissioner can mark players as "paid externally" for cases where payment happens outside the app (Venmo, cash, etc.). These do not flow through Stripe.

### Commissioner Payout

- Commissioners onboard to **Stripe Connect (Express)** when creating their first pool. Stripe's hosted onboarding collects: legal name, DOB, address, SSN (last 4 or full depending on volume), and bank account or debit card for receiving payouts. This is a one-time setup.
- **Payout timing:** All funds are held until the pool concludes. At conclusion, the platform transfers the Commissioner's share (total Stripe-collected fees minus platform take rate) in a single payout.
- **Tax reporting:** Stripe Connect automatically generates and files 1099s for Commissioners receiving over $600/year. No custom tax reporting needed from the platform.

### Refunds & Cancellations

- **No self-service refunds.** Players cannot request refunds on their own.
- **Admin can cancel a tournament.** When a tournament is cancelled, Admin has the ability to issue refunds to all affected Players across all pools tied to that tournament.
- Once a tournament has started, refunds are only issued if the tournament is cancelled by Admin.

---

## 7. Notifications

- **In-app notifications** for all events.
- **Email notifications** for critical events only (MVP):
  - Pool invitation (with join link)
  - Pick deadline approaching (reminder before Round Lock)
  - Round results (your pick won/lost)
  - Player elimination
  - Pool conclusion / winner announcement

---

## 8. Key Business Rules Summary

| Rule | Detail |
|---|---|
| Lives | Players purchase 1 or 2 lives at join time; pay per life |
| Missed Pick | Commissioner configures: Top Seed Remaining (default) or Random |
| Athlete Seeding | Admin enters seed number per athlete at tournament creation |
| Pick Visibility | Hidden until Round Lock |
| Pick Uniqueness | Each Athlete can only be picked once per pool (default) |
| Win Condition | Last player(s) standing when pool ends |
| Multiple Winners | All survivors declared winners; no in-app payout to players |
| Platform Take Rate | 50% default (adjustable at pool and platform level) |
| Bye Athletes | Flagged by Admin; not selectable in Round 1, available from Round 2 |
| Simultaneous Tournaments | One at a time (MVP) |
| Tournament Data | Manual entry (MVP); API integration planned |
| Round Count | Set up front at tournament creation |
| Invitations | Email with unique join link |
| Payments | Stripe in-app (fee per life × lives chosen) + manual/external option |
| Payout Timing | End of tournament; single transfer to Commissioner |
| Refunds | Admin-only; triggered by tournament cancellation |
| Tax Reporting | Handled by Stripe Connect (1099s for >$600/year) |
| Admin Payout | Admin receives platform take via Stripe Connect; can start as individual, switch to LLC later |

---

## 9. Future Enhancements (Post-MVP)

- Tennis data API integration for automatic tournament draws and results
- Multiple simultaneous tournaments
- Additional social auth providers
- Push notifications (mobile)
- Commissioner-customizable pick visibility rules
- Advanced payout structures
- Player chat / trash talk within pools
