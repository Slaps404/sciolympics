-- Add optional system-level topics for Anatomy and Physiology resources.
create table public.event_topics (
  id          uuid        primary key default gen_random_uuid(),
  event_id    uuid        not null references public.events (id) on delete cascade,
  slug        text        not null,
  name        text        not null,
  description text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  unique (event_id, slug)
);

alter table public.event_topics enable row level security;

create policy "event_topics are public read"
  on public.event_topics
  for select
  to anon, authenticated
  using (true);

create policy "admins manage event_topics"
  on public.event_topics
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.event_topics to anon, authenticated;
grant insert, update, delete on public.event_topics to authenticated;

alter table public.resource_candidates
  add column topic_id uuid references public.event_topics (id) on delete set null;

alter table public.resources
  add column topic_id uuid references public.event_topics (id) on delete set null;

insert into public.event_topics (event_id, slug, name, description, sort_order)
select
  e.id,
  topic.slug,
  topic.name,
  topic.description,
  topic.sort_order
from public.events e
cross join (
  values
    (
      'respiratory-system',
      'Respiratory',
      'Respiratory system anatomy, gas exchange, mechanics of breathing, and related physiology.',
      10
    ),
    (
      'immune-system',
      'Immune',
      'Innate and adaptive immunity, lymphatic structures, immune cells, antibodies, and immune responses.',
      20
    ),
    (
      'digestive-system',
      'Digestive',
      'Digestive tract anatomy, accessory organs, digestion, absorption, and related physiology.',
      30
    )
) as topic(slug, name, description, sort_order)
where e.slug = 'anatomy-and-physiology'
on conflict (event_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

with respiratory_topic as (
  select t.id, t.event_id
  from public.event_topics t
  join public.events e on e.id = t.event_id
  where e.slug = 'anatomy-and-physiology'
    and t.slug = 'respiratory-system'
)
update public.resource_candidates c
set topic_id = respiratory_topic.id
from respiratory_topic
where c.event_id = respiratory_topic.event_id
  and c.topic_id is null;

with respiratory_topic as (
  select t.id, t.event_id
  from public.event_topics t
  join public.events e on e.id = t.event_id
  where e.slug = 'anatomy-and-physiology'
    and t.slug = 'respiratory-system'
)
update public.resources r
set topic_id = respiratory_topic.id
from respiratory_topic
where r.event_id = respiratory_topic.event_id
  and r.topic_id is null;
