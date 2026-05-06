-- Allow admins to update athlete_results (needed for upsert conflict resolution)
CREATE POLICY "Admin can update results" ON public.athlete_results
  FOR UPDATE USING (public.get_user_role() = 'admin');
