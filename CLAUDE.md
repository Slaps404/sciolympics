# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SciOly Practice Platform — a Next.js + Supabase web app for Science Olympiad students. Two goals: resource repository (link-based, tagged by event) and async ghost-race quiz competition. Ghost-race = a solo run replayed alongside a recording of another user's earlier run, sidestepping the cold-start problem of real-time matchmaking.

Build order: Foundation → Layer 1 (resource repo) → Layer 3 (solo practice) → Layer 4 (ghost-race). Only Foundation + Layer 1 are in scope for the first plan.

## Commands

```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npm run lint      # ESLint
```

## Architecture

### Stack

- **Next.js** (App Router) — full-stack React; UI + API routes in one repo
- **Supabase** — Postgres, Auth, and (later) Realtime; JS client via `@supabase/supabase-js`
- **Vercel** — deploy on push to main

### Database layers

| Layer | Tables | Status |
| --- | --- | --- |
| 0 — Foundation | `events`, `users` (via Supabase Auth + profile row) | first |
| 1 — Resources | `resources` (title, url, description, event FK) | first |
| 3 — Practice *(future)* | `questions`, `runs`, `answers` | future |
| 4 — Ghost-race *(future)* | `matches`, `recordings`, ratings | future |

### Key schema decisions to respect

- `events.practice_type` is an enum: `quiz | hybrid | build`. Controls which events get questions vs. repo-only.
- Events are stored in the DB (not hardcoded) — the national slate rotates yearly.
- Division (B/C) is self-selected by users; stored on the user profile row.
- Questions must be **graded server-side** from the very first question — correct answers never sent to the client. This is the anti-cheat foundation for future ranked play.

### Supabase client

Instantiate a single client in `lib/supabase.ts` (or `lib/supabase/client.ts` / `server.ts` if using the SSR split). Credentials come from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` — never commit `.env.local`.

### Auth

Supabase Auth handles signup/login. On signup, create a `users` profile row (linked to `auth.users` via FK) that stores the user's chosen division (B/C).

## Important constraints

- `.env.local` must be in `.gitignore` before the first commit with real credentials.
- Resource submissions (Layer 1) are **link-only** — no file uploads in v1.
- Real-time simultaneous matchmaking is intentionally deferred (likely never); all competition is async ghost-race.
