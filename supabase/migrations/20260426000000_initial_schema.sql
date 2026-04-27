-- ============================================================
-- Goat Pool — Initial Schema
-- ============================================================

-- Helper: auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. users (extends Supabase Auth)
CREATE TABLE public.users (
  id                          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username                    text UNIQUE NOT NULL,
  email                       text NOT NULL,
  role                        text NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'commissioner', 'admin')),
  stripe_connect_account_id   text,
  stripe_connect_onboarded    boolean NOT NULL DEFAULT false,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: get current user's role (defined after users table exists)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Auto-create users row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. tournaments
CREATE TABLE public.tournaments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text UNIQUE NOT NULL,
  num_rounds  integer NOT NULL,
  status      text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'concluded', 'cancelled')),
  created_by  uuid NOT NULL REFERENCES public.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. athletes
CREATE TABLE public.athletes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id       uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name                text NOT NULL,
  seed                integer NOT NULL,
  has_bye             boolean NOT NULL DEFAULT false,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'eliminated')),
  eliminated_in_round integer,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, name),
  UNIQUE (tournament_id, seed)
);

-- 4. rounds
CREATE TABLE public.rounds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number    integer NOT NULL,
  lock_deadline   timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'locked', 'completed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round_number)
);

-- 5. athlete_results
CREATE TABLE public.athlete_results (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      uuid NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  athlete_id    uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  result        text NOT NULL CHECK (result IN ('win', 'loss')),
  recorded_by   uuid NOT NULL REFERENCES public.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, athlete_id)
);

-- 6. pools
CREATE TABLE public.pools (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text UNIQUE NOT NULL,
  slug              text UNIQUE NOT NULL,
  tournament_id     uuid NOT NULL REFERENCES public.tournaments(id),
  commissioner_id   uuid NOT NULL REFERENCES public.users(id),
  fee_per_life      integer NOT NULL,
  missed_pick_rule  text NOT NULL DEFAULT 'top_seed' CHECK (missed_pick_rule IN ('top_seed', 'random')),
  take_rate         integer NOT NULL DEFAULT 50 CHECK (take_rate BETWEEN 0 AND 100),
  status            text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'concluded', 'cancelled')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER pools_updated_at
  BEFORE UPDATE ON public.pools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. payments (before pool_players since pool_players references it)
CREATE TABLE public.payments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id                     uuid NOT NULL REFERENCES public.pools(id),
  user_id                     uuid NOT NULL REFERENCES public.users(id),
  amount                      integer NOT NULL,
  stripe_payment_intent_id    text UNIQUE,
  stripe_checkout_session_id  text UNIQUE,
  status                      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  refunded_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

-- 8. pool_players
CREATE TABLE public.pool_players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id         uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id),
  status          text NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'eliminated', 'winner')),
  lives_purchased integer NOT NULL CHECK (lives_purchased IN (1, 2)),
  lives_remaining integer NOT NULL,
  payment_status  text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid_stripe', 'paid_external')),
  payment_id      uuid REFERENCES public.payments(id),
  joined_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id)
);

-- 9. picks
CREATE TABLE public.picks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id         uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id),
  round_id        uuid NOT NULL REFERENCES public.rounds(id),
  athlete_id      uuid NOT NULL REFERENCES public.athletes(id),
  is_auto_assigned boolean NOT NULL DEFAULT false,
  result          text CHECK (result IN ('win', 'loss')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id, round_id),
  UNIQUE (pool_id, user_id, athlete_id)
);

-- 10. pool_invites
CREATE TABLE public.pool_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id       uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  email         text NOT NULL,
  invite_token  text UNIQUE NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  sent_at       timestamptz NOT NULL DEFAULT now(),
  accepted_at   timestamptz
);

-- 11. payouts
CREATE TABLE public.payouts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id           uuid NOT NULL REFERENCES public.pools(id),
  commissioner_id   uuid NOT NULL REFERENCES public.users(id),
  amount            integer NOT NULL,
  platform_amount   integer NOT NULL,
  stripe_transfer_id text UNIQUE,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

-- 12. notifications
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  pool_id     uuid REFERENCES public.pools(id) ON DELETE SET NULL,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 13. platform_settings (singleton)
CREATE TABLE public.platform_settings (
  id                      integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_take_rate       integer NOT NULL DEFAULT 50,
  admin_stripe_account_id text,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.platform_settings (id) VALUES (1);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_athletes_tournament ON public.athletes(tournament_id);
CREATE INDEX idx_athletes_tournament_status ON public.athletes(tournament_id, status);

CREATE INDEX idx_rounds_tournament ON public.rounds(tournament_id);
CREATE INDEX idx_rounds_status ON public.rounds(status);

CREATE INDEX idx_pools_tournament ON public.pools(tournament_id);
CREATE INDEX idx_pools_commissioner ON public.pools(commissioner_id);
CREATE INDEX idx_pools_status ON public.pools(status);

CREATE INDEX idx_pool_players_pool ON public.pool_players(pool_id);
CREATE INDEX idx_pool_players_user ON public.pool_players(user_id);
CREATE INDEX idx_pool_players_pool_status ON public.pool_players(pool_id, status);

CREATE INDEX idx_picks_pool_round ON public.picks(pool_id, round_id);
CREATE INDEX idx_picks_pool_user ON public.picks(pool_id, user_id);
CREATE INDEX idx_picks_user_round ON public.picks(user_id, round_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX idx_payments_pool ON public.payments(pool_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.get_user_role() = 'admin');

CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- tournaments
CREATE POLICY "Authenticated users can read tournaments" ON public.tournaments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin can update tournaments" ON public.tournaments
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- athletes
CREATE POLICY "Authenticated users can read athletes" ON public.athletes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert athletes" ON public.athletes
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin can update athletes" ON public.athletes
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- rounds
CREATE POLICY "Authenticated users can read rounds" ON public.rounds
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert rounds" ON public.rounds
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin can update rounds" ON public.rounds
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- athlete_results
CREATE POLICY "Authenticated users can read results" ON public.athlete_results
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert results" ON public.athlete_results
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

-- pools
CREATE POLICY "Authenticated users can read pools" ON public.pools
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Commissioner can insert pools" ON public.pools
  FOR INSERT WITH CHECK (auth.uid() = commissioner_id);

CREATE POLICY "Commissioner can update own pools" ON public.pools
  FOR UPDATE USING (auth.uid() = commissioner_id);

-- pool_players
CREATE POLICY "Players can read own memberships" ON public.pool_players
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pools
      WHERE pools.id = pool_players.pool_id
        AND pools.commissioner_id = auth.uid()
    )
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "Players can insert own membership" ON public.pool_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update own membership" ON public.pool_players
  FOR UPDATE USING (auth.uid() = user_id);

-- picks (core visibility rule: hidden until round is locked)
CREATE POLICY "Players can read own picks before lock, all picks after lock" ON public.picks
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.rounds
      WHERE rounds.id = picks.round_id
        AND rounds.status IN ('locked', 'completed')
        AND EXISTS (
          SELECT 1 FROM public.pool_players
          WHERE pool_players.pool_id = picks.pool_id
            AND pool_players.user_id = auth.uid()
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.pools
      WHERE pools.id = picks.pool_id
        AND pools.commissioner_id = auth.uid()
    )
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "Players can insert own picks" ON public.picks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.rounds
      WHERE rounds.id = picks.round_id
        AND rounds.status = 'active'
    )
  );

CREATE POLICY "Players can update own picks before lock" ON public.picks
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.rounds
      WHERE rounds.id = picks.round_id
        AND rounds.status = 'active'
    )
  );

-- pool_invites
CREATE POLICY "Commissioner can read own pool invites" ON public.pool_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pools
      WHERE pools.id = pool_invites.pool_id
        AND pools.commissioner_id = auth.uid()
    )
  );

CREATE POLICY "Commissioner can insert invites" ON public.pool_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pools
      WHERE pools.id = pool_invites.pool_id
        AND pools.commissioner_id = auth.uid()
    )
  );

-- payments
CREATE POLICY "Players can read own payments" ON public.payments
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.pools
      WHERE pools.id = payments.pool_id
        AND pools.commissioner_id = auth.uid()
    )
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "Players can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- payouts
CREATE POLICY "Commissioner can read own payouts" ON public.payouts
  FOR SELECT USING (
    auth.uid() = commissioner_id
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "Admin can insert and update payouts" ON public.payouts
  FOR ALL USING (public.get_user_role() = 'admin');

-- notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- platform_settings
CREATE POLICY "Admin can read platform settings" ON public.platform_settings
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Admin can update platform settings" ON public.platform_settings
  FOR UPDATE USING (public.get_user_role() = 'admin');
