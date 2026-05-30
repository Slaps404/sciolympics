-- Private admin feedback used to calibrate the resource curator pipeline.
-- These fields stay on candidates and are not copied to public resources.
alter table public.resource_candidates
  add column review_relevance_score integer
    check (review_relevance_score between 1 and 10),
  add column review_trust_score integer
    check (review_trust_score between 1 and 10),
  add column review_notes text
    check (review_notes is null or char_length(review_notes) <= 300),
  add column reviewed_at timestamptz;
