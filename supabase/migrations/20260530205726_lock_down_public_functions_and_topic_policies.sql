-- SECURITY DEFINER helpers are used internally by triggers/RLS only.
-- Revoke PUBLIC too; revoking anon/authenticated alone does not remove
-- privileges inherited through the PUBLIC pseudo-role.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon, authenticated;

-- Keep public topic reads on a single SELECT policy, and split admin writes so
-- authenticated SELECT does not evaluate multiple permissive policies.
drop policy "admins manage event_topics" on public.event_topics;

create policy "admins insert event_topics"
  on public.event_topics
  for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update event_topics"
  on public.event_topics
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete event_topics"
  on public.event_topics
  for delete
  to authenticated
  using (public.is_admin());
