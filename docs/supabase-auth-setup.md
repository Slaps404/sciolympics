# Supabase Auth dashboard setup

Complete these steps in the [Supabase Dashboard](https://supabase.com/dashboard/project/tenvdkinyvhdlitkwzru) before testing login/signup locally.

## 1. Enable email provider

1. Go to **Authentication → Providers → Email**
2. Enable **Email** sign-in
3. For local dev, you may disable **Confirm email** to skip inbox verification

## 2. Set redirect URLs

Go to **Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

For production (Vercel), add your deployed URL too, e.g. `https://your-app.vercel.app/auth/callback`.

## 3. Apply database schema

From the repo root (after one-time `npx supabase login`):

```bash
npm run db:link
npm run db:push
npm run db:seed
```

Or run the SQL in `supabase/migrations/20260328120000_init.sql` and `supabase/seed.sql` via the SQL Editor.

## 4. Verify

1. `npm run dev`
2. Visit `/signup`, create an account with division B or C
3. Confirm a row appears in **Authentication → Users** and **Table Editor → users**
