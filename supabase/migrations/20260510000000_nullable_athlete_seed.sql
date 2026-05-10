-- Make athlete seed optional and drop seed-based unique constraint
ALTER TABLE public.athletes ALTER COLUMN seed DROP NOT NULL;
ALTER TABLE public.athletes DROP CONSTRAINT IF EXISTS athletes_tournament_id_seed_key;
