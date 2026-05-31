-- Store canonical resource type on live resources so public filters can use it.
alter table public.resources
  add column resource_type text
  check (
    resource_type is null
    or resource_type in (
      'video',
      'article',
      'textbook',
      'interactive',
      'game',
      'quiz',
      'practice_test',
      'lesson_collection',
      'archive',
      'other'
    )
  );

-- Backfill approved AI-curated resources from their matching candidates.
update public.resources r
set resource_type = case
  when c.resource_type in (
    'video',
    'article',
    'textbook',
    'interactive',
    'game',
    'quiz',
    'practice_test',
    'lesson_collection',
    'archive',
    'other'
  ) then c.resource_type
  else 'other'
end
from public.resource_candidates c
where c.event_id = r.event_id
  and c.url = r.url
  and c.status = 'approved'
  and r.resource_type is null;
