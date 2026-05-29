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
npm run db:login   # opens browser — not `supabase` alone; use npm/npx on Windows
npm run db:link    # enter database password when prompted
npm run db:push
npm run db:seed
npm run gen:types  # optional — overwrites hand-maintained types from live schema
```

**Troubleshooting:** If you see `supabase is not recognized`, use `npm run db:*` or `npx supabase` (CLI is a dev dependency, not global). If you see `Cannot find project ref`, run `npm run db:link` first.

**Do not run `npm audit fix --force`** — it downgrades Next.js to v9 and pulls in hundreds of legacy webpack vulnerabilities. This repo pins `next@16.2.6`. Use `npm audit` only; if issues remain, fix via `package.json` overrides (not `--force`).

Migrations live in [`supabase/migrations/`](supabase/migrations/). Finish setup: [`docs/finish-init-checklist.md`](docs/finish-init-checklist.md) · Auth: [`docs/supabase-auth-setup.md`](docs/supabase-auth-setup.md) · Deploy: [`docs/vercel-deploy.md`](docs/vercel-deploy.md).

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
| L0 Foundation (`events`, `users`) | ✅ Complete |
| L1 Resources (`resources`, link-only) | 🔄 In progress |
| L3 Practice / L4 Ghost-race | Future |

Full spec: [`CLAUDE.md`](CLAUDE.md). Cursor rules: [`.cursor/rules/`](.cursor/rules/). · Status: [`docs/project-status.md`](docs/project-status.md)

## Auth flow

- `/signup` — email, password, division (B/C), creates `users` profile row
- `/login` — email/password
- `/auth/callback` — OAuth/email confirmation redirect handler
- Middleware refreshes JWT cookies so RLS sees the logged-in user

## Deploy (Vercel)

1. Connect the GitHub repo
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key)
3. Add production callback URL in Supabase Auth settings
