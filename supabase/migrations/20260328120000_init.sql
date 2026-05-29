-- L0 + L1 schema for SciOlympics

create type practice_type as enum ('quiz', 'hybrid', 'build');
create type division as enum ('B', 'C');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  practice_type practice_type not null,
  season_year int not null,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  division division not null,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  submitted_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.users enable row level security;
alter table public.resources enable row level security;

create policy "events are public read"
  on public.events
  for select
  using (true);

create policy "resources are public read"
  on public.resources
  for select
  using (true);

create policy "authenticated users can submit resources"
  on public.resources
  for insert
  to authenticated
  with check (auth.uid() = submitted_by);

create policy "users read own profile"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "users insert own profile"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id);
