-- Prevent duplicate live resources for the same event.
-- Candidate staging already has unique(event_id, url); this closes the final
-- promotion/submission gap for public resources.
alter table public.resources
  add constraint resources_event_id_url_key unique (event_id, url);
