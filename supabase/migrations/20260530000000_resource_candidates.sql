-- Staging table for AI-curated resource links awaiting human review.
-- Live resources table is untouched; candidates promote to resources via admin UI (future).

-- 1. Admin flag — establishes the is_admin pattern for this project.
alter table public.users
  add column if not exists is_admin boolean not null default false;

-- 2. Helper function — security definer so other tables' RLS policies can call it
--    without depending on the shape of users-table RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.users where id = auth.uid()),
    false
  );
$$;

-- 3. Staging table.
create table public.resource_candidates (
  id               uuid        primary key default gen_random_uuid(),
  url              text        not null,
  event_id         uuid        not null references public.events (id) on delete cascade,
  title            text        not null,
  ai_description   text,
  relevance_score  integer     check (relevance_score between 0 and 100),
  trust_score      integer     check (trust_score      between 0 and 100),
  resource_type    text,
  status           text        not null default 'pending'
                               check (status in ('pending', 'approved', 'rejected')),
  found_at         timestamptz not null default now(),
  unique (event_id, url)
);

-- 4. RLS — admins only; anon and non-admin authenticated users are denied by default.
alter table public.resource_candidates enable row level security;

create policy "admins manage resource_candidates"
  on public.resource_candidates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Revoke direct RPC access; is_admin() is only needed internally by RLS policies.
revoke execute on function public.is_admin() from anon, authenticated;
