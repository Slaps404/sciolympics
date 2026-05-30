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
- ⚠️ Known security advisory: `handle_new_user()` is callable as a public RPC endpoint. Low risk (it requires valid trigger context to do anything), but worth revoking EXECUTE at some point.

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

**Event detail page** (`src/app/events/[slug]/page.tsx`)
- Lists resources for the event in reverse-chronological order
- Colored type badge (Quiz/Hybrid/Build) from `PRACTICE_TYPE_BADGE` map
- Submit-a-resource form: title + URL (required) + description (optional), gated to authenticated users
- Error messages passed via `?error=` searchParam
- Tab bar stub: Resources (active), Quiz / Groups / Compete (disabled with "coming soon" tooltip)

**Submit resource action** (`src/app/events/[slug]/actions.ts`)
- Validates URL protocol (http/https only)
- Guards against unauthenticated submission
- Inserts into `public.resources` with `submitted_by = user.id`

---

### Nav + home split (complete)

**Root layout** (`src/app/layout.tsx`)
- Persistent header on every page via Next.js App Router root layout
- Logged-out: "Log in" (bordered pill) + "Sign up" (filled zinc pill)
- Logged-in: "Dashboard" link + avatar initials dropdown (email + Log out)
- `getInitials(email)` helper splits on `.`, `-`, `_` separators

**Landing page** (`src/app/page.tsx`)
- Logged-in users: immediately `redirect("/dashboard")`
- Logged-out users: hero pitch + "Get started — it's free" + "Log in" CTAs, then events grid below as proof-of-value
- Event cards: colored type badge, description preview, resource count pulled from `public.resources`

**Dashboard** (`src/app/dashboard/page.tsx`)
- Gated: `redirect("/login?next=/dashboard")` if not authenticated
- Welcome header with user email
- Resources hub card (links to `#events` anchor)
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

### Admin review page (implemented; smoke testing in progress)

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
- Use richer `resource_type` values now to support future categorization: `video`, `article`, `textbook`, `interactive`, `practice_test`, etc. The admin UI can display unknown types with the zinc fallback until type-specific badges are expanded.
- Relevance must consider Division B vs Division C fit. A long textbook can be highly relevant for Division C/reference depth but less useful as a first resource for many Division B learners; videos, interactives, and games often score higher for getting-started Division B use.
- Trust should combine source authority with cross-source/user-review signals when available. Examples: OpenStax = Rice University/nonprofit textbook; Khan Academy = nonprofit education platform; Kenhub = medically reviewed anatomy content plus student-facing review signals; GetBodySmart = interactive anatomy site now tied to Kenhub.
- Descriptions should explicitly mention the respiratory/digestive/immune/etc. topic signals so future subcategory backfills can be inferred from existing candidate text.

---

## Immediate next step

**Finish the admin review smoke test** at `/admin/review?tab=pending`:
1. Review the pending respiratory candidates at `/admin/review?tab=pending`: Osmosis, Free Anatomy Quiz, PurposeGames, and Minnesota State Pressbooks.
2. Use optional feedback scores/notes during approve/reject when useful.
3. Review `/events/anatomy-and-physiology` and confirm approved respiratory resources read well publicly.
4. Continue with the next Anatomy and Physiology respiratory resource category or another body-system topic.
5. Once the manual process is dialed in, codify it as a reusable skill via `/skill creator`.



---

## Gotchas / watch out for

- **Remote divergence on push (2026-05-30):** The remote had independent UI work (avatar dropdown, richer event cards) when we pushed the home split. Resolved by merging both sets of changes. If this happens again, pull before pushing.
- **`docs/context/resources.md` is referenced in task briefs but doesn't exist.** The RLS patterns actually live in `supabase/migrations/20260328120000_init.sql`.
- **`public.is_admin()` has EXECUTE revoked** — don't call it as an RPC or from client code. Auth checks in pages/actions should query `public.users.is_admin` directly (the user can read their own row via RLS).
- **`handle_new_user()` security advisory** — callable as a public RPC endpoint (pre-existing, not introduced by our work). Fix: `revoke execute on function public.handle_new_user() from anon, authenticated;` in a future migration.
- **Admin account is `zekesears2008@gmail.com`**, not the school email. The school email (`2027-eesears@preuss.ucsd.edu`) has no auth account in this project.
- **`resource_candidates` uses `ai_description`** (not `description`) to avoid confusion with `resources.description`. When approving a candidate, `ai_description` maps to `resources.description`.
- **Undo approval deletes by `(event_id, url)`** — this is deterministic because of the UNIQUE constraint on `resource_candidates(event_id, url)`. If a resource was submitted manually with the same URL, approving and then undoing a candidate would delete it. Low risk for now (no duplicate URLs expected), but worth noting for later.
