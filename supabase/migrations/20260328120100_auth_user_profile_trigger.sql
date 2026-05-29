-- Create profile row when auth user is created (works with email confirmation enabled).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_division division;
begin
  user_division := (new.raw_user_meta_data ->> 'division')::division;
  if user_division is null then
    raise exception 'division is required in signup metadata';
  end if;

  insert into public.users (id, division)
  values (new.id, user_division);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Explicit WITH CHECK on profile updates.
drop policy if exists "users update own profile" on public.users;

create policy "users update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
