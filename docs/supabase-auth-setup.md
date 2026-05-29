# Supabase Auth dashboard setup

Complete these steps in the [Supabase Dashboard](https://supabase.com/dashboard/project/tenvdkinyvhdlitkwzru) before testing login/signup locally.

## 1. Enable email provider

1. Go to **Authentication → Providers → Email**
2. Enable **Email** sign-in
3. Keep **Confirm email** enabled for production-like behavior (recommended)

With confirm email **on**, signup shows “check your email” until the user clicks the link. Profile rows are created via DB trigger on `auth.users` insert; session starts after confirm at `/auth/callback`.

## 2. Set redirect URLs

Go to **Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

For production (Vercel), also add `https://your-app.vercel.app/auth/callback` — see [`vercel-deploy.md`](vercel-deploy.md).

## 3. Local environment

Add to `.env.local` (gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` is used for signup email redirect links.

## 4. Apply database schema

From the repo root (after one-time `npm run db:login`):

```bash
npm run db:link
npm run db:push
npm run db:seed
```

Or run the SQL in `supabase/migrations/` and `supabase/seed.sql` via the SQL Editor.

## 5. Verify

1. `npm run dev`
2. Visit `/signup`, create an account with division B or C
3. Confirm email (if confirm is on), then check header shows your email
4. Confirm rows in **Authentication → Users** and **Table Editor → users**

Full checklist: [`finish-init-checklist.md`](finish-init-checklist.md).
