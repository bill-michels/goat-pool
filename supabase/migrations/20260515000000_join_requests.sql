-- Add allow_join_requests flag to pools
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS allow_join_requests boolean NOT NULL DEFAULT false;

-- Join requests table
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pool_id, user_id)
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
