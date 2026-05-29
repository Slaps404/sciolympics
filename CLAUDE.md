# CLAUDE.md

> **Cursor**: compressed always-on rules live in `.cursor/rules/`. This file is the full spec.

Guidance for Claude Code and other agents working in this repository.

## Project Overview

SciOly Practice Platform — Next.js + Supabase for Science Olympiad students. Two goals: resource repository (link-based, tagged by event) and async ghost-race quiz competition. Ghost-race = solo run replayed alongside another user's recorded run (no realtime matchmaking).

**Build order:** Foundation → L1 (resources) → L3 (solo practice) → L4 (ghost-race). **Only L0 + L1 in scope now.**

## Commands

```bash
npm run dev    # localhost:3000
npm run build
npm run lint
```

## Architecture

**Stack:** Next.js App Router · Supabase (Postgres, Auth) · Vercel

| Layer | Tables | Status |
| --- | --- | --- |
| L0 Foundation | `events`, `users` (Auth + profile FK) | now |
| L1 Resources | `resources` (title, url, description, event FK) | now |
| L3 Practice | `questions`, `runs`, `answers` | future |
| L4 Ghost-race | `matches`, `recordings`, ratings | future |

### Schema decisions

- `events.practice_type`: `quiz | hybrid | build` — quiz vs repo-only events
- Events in DB (yearly slate), not hardcoded
- Division B/C self-selected → stored on user profile
- Questions graded **server-side** from day one; correct answers never sent to client

### Supabase clients

SSR split (already in repo):

- `src/lib/supabase/client.ts` — browser
- `src/lib/supabase/server.ts` — server/RSC (cookies)

Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` — never commit.

### Auth

Supabase Auth for signup/login. On signup, create `users` profile row (FK to `auth.users`) with chosen division.

## Constraints

- `.env.local` gitignored (`.env*` with `!.env*.example`)
- L1 resources: **link-only**, no file uploads in v1
- Competition is async ghost-race only; realtime matchmaking deferred
