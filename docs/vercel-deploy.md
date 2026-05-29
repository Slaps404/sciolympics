# Vercel deployment

## 1. Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **Slaps404/scioly-practice** from GitHub
3. Framework: **Next.js** (auto-detected)
4. Root directory: `.` (default)

## 2. Environment variables

Add for **Production** and **Preview**:

| Name | Example |
|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` (your actual Vercel URL) |

Do **not** add the service role key unless you build admin-only server features.

## 3. Deploy

Click **Deploy**. Note the production URL (e.g. `https://scioly-practice.vercel.app`).

## 4. Update Supabase Auth

In [Auth URL Configuration](https://supabase.com/dashboard/project/tenvdkinyvhdlitkwzru/auth/url-configuration):

- Add redirect URL: `https://YOUR-VERCEL-URL/auth/callback`
- Optionally set Site URL to production for production-only emails

Keep `http://localhost:3000/auth/callback` for local dev.

## 5. Verify

- Open production URL — events should load
- Sign up on production — confirm email link uses production callback
