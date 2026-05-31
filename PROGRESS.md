# Project Progress

> Last updated: 2026-05-30

---

## What's built

### L0 — Foundation (complete)

**Database** (`supabase/migrations/20260328120000_init.sql`)
- `public.events` — event catalog: `id`, `name`, `slug`, `practice_type` (enum: quiz/hybrid/build), `season_year`, `created_at`
- `public.users` — profile table FK'd to `auth.users`: `id`, `division` (enum: B/C), `is_admin` (bool, default false), `created_at`
- `public.resources` — submitted links: `id`, `event_id` → events, `title`, `url`, `description`, `submitted_by` → users, `created_at`
- RLS enabled on all three. Resources: public read, authenticated insert (own rows only). Users: read/insert/update own row only.

**Auth trigger** (`supabase/migrations/20260328120100_auth_user_profile_trigger.sql`)
- `handle_new_user()` trigger auto-creates a `public.users` profile row on signup using `raw_user_meta_data.division`.
- `handle_new_user()` EXECUTE is revoked from public API roles by `20260530205726_lock_down_public_functions_and_topic_policies.sql`; it remains usable by the signup trigger.

**2027 season data** (`supabase/migrations/20260529000000_events_description_and_2027.sql`)
- Added `description` column to `public.events`.
- Seeded 6 events: Anatomy and Physiology, Codebusters, Disease Detectives, Forensics, Helicopter, Trajectory — all season_year 2027.

**Auth pages**
- `src/app/login/page.tsx` — email/password login, redirects to `?next=` param after success
- `src/app/signup/page.tsx` — email/password + division selection, triggers profile creation
- `src/app/auth/actions.ts` — server actions: `login`, `signup`, `logout`
- `src/app/auth/callback/route.ts` — handles Supabase email confirmation callback
- `src/lib/auth/safe-redirect.ts` — `safeRedirectPath()` validates `next=` param against allowlist
- `src/lib/auth/ensure-profile.ts` — helper to verify profile row exists

---

### L1 — Resources (complete)

**Activity-first resource hub** (`src/app/resources/page.tsx`, `src/app/resources/[eventSlug]/page.tsx`)
- `/resources` shows an event picker; signed-in home redirects there.
- `/resources/[eventSlug]` lists event resources in reverse-chronological order.
- Old `/events/[slug]` URLs redirect to `/resources/[slug]`.
- Resource page uses a filter drawer with multi-select topic and resource-type filters.
- Submit-a-resource form: title + URL required, description and type optional, gated to authenticated users.
- Error messages passed via `?error=` searchParam.

**Resource type migration** (`supabase/migrations/20260530214106_resources_resource_type.sql`)
- Added nullable `public.resources.resource_type` with canonical values: `video`, `article`, `textbook`, `interactive`, `game`, `quiz`, `practice_test`, `lesson_collection`, `archive`, `other`.
- Backfilled approved curated live resources from matching `resource_candidates.resource_type`.
- Admin approval now copies both `topic_id` and `resource_type` into live resources.

**Anatomy and Physiology topic filters** (`supabase/migrations/20260530204853_anatomy_event_topics.sql`)
- Added `public.event_topics` for optional event subcategories: `event_id`, `slug`, `name`, `description`, `sort_order`, `created_at`
- Added nullable `topic_id` to `public.resource_candidates` and `public.resources`
- Seeded Anatomy and Physiology topics for the 2027 systems: `respiratory-system`, `immune-system`, `digestive-system`
- Backfilled existing Anatomy and Physiology candidates/resources to `respiratory-system`
- `/resources/anatomy-and-physiology` now filters by Respiratory / Immune / Digestive topics; All behavior is clearing the filter drawer.

---

### Nav + home split (complete)

**Root layout** (`src/app/layout.tsx`)
- Persistent header on every page via Next.js App Router root layout
- Top-level activity nav: Resources / Quiz / Groups / Compete
- Logged-out: "Log in" (bordered pill) + "Sign up" (filled zinc pill)
- Logged-in: avatar initials dropdown with email, Dashboard, and Log out
- `getInitials(email)` helper splits on `.`, `-`, `_` separators

**Landing page** (`src/app/page.tsx`)
- Logged-in users: immediately `redirect("/resources")`
- Logged-out users: hero pitch + "Get started — it's free" + "Log in" CTAs, then events grid below as proof-of-value
- Event cards: colored type badge, description preview, resource count pulled from `public.resources`

**Dashboard** (`src/app/dashboard/page.tsx`)
- Gated: `redirect("/login?next=/dashboard")` if not authenticated
- Welcome header with user email
- Resources hub card links to `/resources`
- Full events grid below the card links event cards to `/resources/[eventSlug]`.

**Future activity shells**
- `/quiz`, `/groups`, and `/compete` show event pickers with focused coming-soon states.
- `/quiz/[eventSlug]`, `/groups/[eventSlug]`, and `/compete/[eventSlug]` show event-specific coming-soon pages with a link back to resources.
- Full events grid below the card — same rich card design as landing

---

### resource_candidates staging table (complete)

**Migration** (`supabase/migrations/20260530000000_resource_candidates.sql`)

New table `public.resource_candidates`:
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `url` | text NOT NULL | |
| `event_id` | uuid NOT NULL | FK → `events.id` ON DELETE CASCADE |
| `title` | text NOT NULL | |
| `ai_description` | text | |
| `relevance_score` | integer | CHECK 0–100 |
| `trust_score` | integer | CHECK 0–100 |
| `resource_type` | text | e.g. 'notes', 'video', 'practice_test' |
| `status` | text NOT NULL | DEFAULT 'pending'; CHECK in ('pending','approved','rejected') |
| `found_at` | timestamptz NOT NULL | DEFAULT now() |
| UNIQUE | — | `(event_id, url)` — idempotent AI inserts |

Also in this migration:
- `public.users.is_admin boolean NOT NULL DEFAULT false` — the project's admin-determination pattern
- `public.is_admin()` — `SECURITY DEFINER` helper for RLS policies; EXECUTE revoked from `anon` and `authenticated` (not a public RPC)
- RLS: single `FOR ALL` policy — `public.is_admin()` must return true; anon and non-admin authenticated users get nothing

**Admin user:** `zekesears2008@gmail.com` has `is_admin = true` set directly in the DB.
> Note: The school email `2027-eesears@preuss.ucsd.edu` is NOT the auth account — the Gmail is.

---

## Currently in progress

### Admin review page (implemented)

**Spec:** `docs/superpowers/specs/2026-05-30-admin-review-design.md`
**Plan:** `docs/superpowers/plans/2026-05-30-admin-review.md`

Implemented on branch `codex/admin-review`:

**`src/app/admin/review/actions.ts`**
- `approveCandidate(formData)` — fetches candidate, inserts into `public.resources` (using `ai_description` as `description`, `submitted_by = null`), marks `status = 'approved'`
- `rejectCandidate(formData)` — marks `status = 'rejected'`
- `undoDecision(formData)` — fetches candidate to get status/event_id/url server-side (not from form, to prevent tampering); if approved: deletes matching row from `resources` by `(event_id, url)`, marks back to `pending`; if rejected: marks back to `pending`

**`src/app/admin/review/page.tsx`**
- Auth guard: `getUser()` + `users.is_admin` query → redirect to `/` if not admin
- `?tab=pending|approved|rejected` searchParam drives the data fetch (default: pending)
- Candidate cards: title (link → new tab), event name, `ai_description`, `resource_type` badge, relevance/trust scores, `found_at`
- Pending tab: Approve (filled) + Reject (outlined) buttons per card
- Approved/Rejected tabs: Undo button per card
- Error banner on `?error=action-failed` or `?error=not-found`

Direct URL only — no nav link for now.

---

### Manual resource curator pipeline (pilot started)

Pilot topic: Anatomy and Physiology -> respiratory system getting-started resources.

**Approved respiratory resources from the first manual pass**
- Khan Academy respiratory system unit -> `resource_type = 'video'`
- OpenStax Anatomy and Physiology Chapter 22 -> `resource_type = 'textbook'`
- GetBodySmart Respiratory System -> `resource_type = 'interactive'`
- Kenhub Respiratory System -> `resource_type = 'article'`

**Manual curation rules learned**
- Dedupe on `(event_id, url)` before staging candidates. `resource_candidates` already enforces this, and `resources` now has a matching unique constraint so approved/user-submitted links cannot duplicate within the same event.
- Candidate review now supports optional private feedback fields: `review_relevance_score` (1-10), `review_trust_score` (1-10), `review_notes` (max 300 chars), and `reviewed_at`. These calibrate the future curator skill and are not copied to public resources.
- Use richer `resource_type` values now to support future categorization: `video`, `article`, `textbook`, `interactive`, `game`, `quiz`, `practice_test`, `lesson_collection`, etc. The admin UI can display unknown types with the zinc fallback until type-specific badges are expanded.
- Relevance must consider Division B vs Division C fit. A long textbook can be highly relevant for Division C/reference depth but less useful as a first resource for many Division B learners; videos, interactives, and games often score higher for getting-started Division B use.
- Trust should combine source authority with cross-source/user-review signals when available. Examples: OpenStax = Rice University/nonprofit textbook; Khan Academy = nonprofit education platform; Kenhub = medically reviewed anatomy content plus student-facing review signals; GetBodySmart = interactive anatomy site now tied to Kenhub.
- Descriptions should explicitly mention the respiratory/digestive/immune/etc. topic signals so future subcategory backfills can be inferred from existing candidate text.
- Human feedback calibration: PurposeGames-style simple games can be valuable for Division B engagement even with moderate trust; Free Anatomy Quiz should be tagged as `quiz`; Minnesota State Pressbooks is trusted but niche/advanced for histology/tissue identification.
- New quality bar: default to fewer high-value learning resources over many random links. Avoid tiny standalone quizzes/PDFs unless they are substantial, uniquely useful, or specifically requested; SciOly.org and future quiz features cover practice better than low-value quiz clutter.
- Avoid staging login-gated/paywalled/account-required resources unless the free visible page itself has enough usable value. EduMedia was rejected because meaningful use required login.
- Prioritize durable videos/playlists, open textbooks, strong article guides, rich interactives, reputable lesson collections, and official/archival collections.
- Curator skill draft created at `C:\Users\zekes\.agents\skills\curate-scioly-resources` and mirrored to `C:\Users\zekes\.claude\skills\curate-scioly-resources`. Claude Code should be restarted after import so the skill metadata reloads.

### Anatomy and Physiology immune pack (pending review)

Staged 5 immune-system candidates with `topic_id = immune-system`; none are public until approved in `/admin/review`.

- HHMI BioInteractive - The Immune System (`interactive`)
- Crash Course Biology - Animal Defense Systems (`video`)
- OpenStax Anatomy and Physiology - The Lymphatic and Immune System (`textbook`)
- Kenhub - Cells of the Immune System (`article`)
- Visible Body - Lymphatic Immunity (`article`)

Verified on 2026-05-30:
- Remote migration `20260530204853_anatomy_event_topics.sql` applied.
- Follow-up migration `20260530205726_lock_down_public_functions_and_topic_policies.sql` applied to revoke public EXECUTE on `handle_new_user()` / `is_admin()` and narrow event topic admin write policies.
- Topic counts: Respiratory = 12 live resources / 14 candidates; Immune = 0 live resources / 5 pending candidates; Digestive = 0 live resources / 0 candidates.
- `/resources/anatomy-and-physiology` shows Respiratory / Immune / Digestive filters in the drawer.
- `/resources/anatomy-and-physiology?topic=immune-system` correctly stays empty while immune candidates are pending.
- `/admin/review?tab=pending` shows the 5 immune candidates with the Immune topic pill.

---

## Immediate next step

**Human review the immune pack** at `/admin/review?tab=pending`:
1. Review the 5 pending immune candidates and use optional feedback scores/notes when useful.
2. Approve one candidate to verify promotion from `resource_candidates.topic_id` to `resources.topic_id`.
3. Check `/resources/anatomy-and-physiology?topic=immune-system` after approval and confirm the resource appears under Immune.
4. Continue with either pruning low-value approved respiratory resources or staging the first digestive-system pack.
5. Keep tightening `curate-scioly-resources` from the feedback before broader event curation.



---

## Gotchas / watch out for

- **Remote divergence on push (2026-05-30):** The remote had independent UI work (avatar dropdown, richer event cards) when we pushed the home split. Resolved by merging both sets of changes. If this happens again, pull before pushing.
- **`docs/context/resources.md` is referenced in task briefs but doesn't exist.** The RLS patterns actually live in `supabase/migrations/20260328120000_init.sql`.
- **`public.is_admin()` has EXECUTE revoked** — don't call it as an RPC or from client code. Auth checks in pages/actions should query `public.users.is_admin` directly (the user can read their own row via RLS).
- **Supabase advisors still warn on leaked password protection and RLS performance.** Public EXECUTE on `handle_new_user()` and `is_admin()` was fixed on 2026-05-30; remaining warnings are dashboard Auth settings plus older RLS `auth.uid()` init-plan / multiple insert-policy performance cleanup.
- **Admin account is `zekesears2008@gmail.com`**, not the school email. The school email (`2027-eesears@preuss.ucsd.edu`) has no auth account in this project.
- **`resource_candidates` uses `ai_description`** (not `description`) to avoid confusion with `resources.description`. When approving a candidate, `ai_description` maps to `resources.description`.
- **Undo approval deletes by `(event_id, url)`** — this is deterministic because of the UNIQUE constraint on `resource_candidates(event_id, url)`. If a resource was submitted manually with the same URL, approving and then undoing a candidate would delete it. Low risk for now (no duplicate URLs expected), but worth noting for later.
