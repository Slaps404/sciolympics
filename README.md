# SciOlympics

Science Olympiad practice platform — link-based resource repo (Layer 1) with async ghost-race quizzes planned for later.

**Stack:** Next.js App Router · Supabase · Tailwind · Vercel

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (this repo links to `tenvdkinyvhdlitkwzru`)

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in Supabase URL + anon/publishable key
npm run dev                        # http://localhost:3000
```

Get API keys from **Supabase Dashboard → Project Settings → API**.

## Database setup

One-time CLI login, then apply migrations and seed:

```bash
npx supabase login
npm run db:link    # enter database password when prompted
npm run db:push
npm run db:seed
npm run gen:types  # optional — overwrites hand-maintained types from live schema
```

Migrations live in [`supabase/migrations/`](supabase/migrations/). See [`docs/supabase-auth-setup.md`](docs/supabase-auth-setup.md) for Auth dashboard settings (redirect URLs, email provider).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply migrations to linked Supabase project |
| `npm run db:seed` | Insert sample events |
| `npm run gen:types` | Regenerate TypeScript types from DB schema |

## Project scope

| Layer | Status |
|-------|--------|
| L0 Foundation (`events`, `users`) | In progress |
| L1 Resources (`resources`, link-only) | Planned |
| L3 Practice / L4 Ghost-race | Future |

Full spec: [`CLAUDE.md`](CLAUDE.md). Cursor rules: [`.cursor/rules/`](.cursor/rules/).

## Auth flow

- `/signup` — email, password, division (B/C), creates `users` profile row
- `/login` — email/password
- `/auth/callback` — OAuth/email confirmation redirect handler
- Middleware refreshes JWT cookies so RLS sees the logged-in user

## Deploy (Vercel)

1. Connect the GitHub repo
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key)
3. Add production callback URL in Supabase Auth settings
