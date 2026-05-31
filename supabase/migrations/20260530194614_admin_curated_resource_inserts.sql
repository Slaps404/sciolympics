-- Allow admins to promote AI-curated candidates into live resources.
-- Community submissions still use the existing own-row policy.
create policy "admins can insert curated resources"
  on public.resources
  for insert
  to authenticated
  with check (public.is_admin() and submitted_by is null);

create policy "admins can delete curated resources"
  on public.resources
  for delete
  to authenticated
  using (public.is_admin() and submitted_by is null);
