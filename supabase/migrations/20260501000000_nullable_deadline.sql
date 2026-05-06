-- Allow round lock deadlines to be set later
ALTER TABLE public.rounds ALTER COLUMN lock_deadline DROP NOT NULL;
