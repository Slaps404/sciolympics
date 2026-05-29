# SciOlympics — Agent Guide

> Read [`docs/project-status.md`](docs/project-status.md) for current build phase before starting work.

Cursor loads `.cursor/rules/` automatically. Human-readable spec: `CLAUDE.md`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## TL;DR

| | |
|---|---|
| Stack | Next.js App Router, Supabase (`@supabase/ssr`), Tailwind 4, Vercel |
| Scope | L0 Foundation + L1 Resources only |
| Supabase | `src/lib/supabase/client.ts` · `server.ts` |
| Env | `.env.local.example` → `.env.local` (gitignored) |
| Run | `npm run dev` → localhost:3000 |
