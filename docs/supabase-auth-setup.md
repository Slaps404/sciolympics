# Supabase Auth dashboard setup

Complete these steps in the [Supabase Dashboard](https://supabase.com/dashboard/project/tenvdkinyvhdlitkwzru) before testing login/signup locally.

## 1. Enable email provider

Supabase moved these settings under **Configuration** in the Auth sidebar (there is no top-level “Providers” item anymore).

1. Open [**Authentication**](https://supabase.com/dashboard/project/tenvdkinyvhdlitkwzru/auth/users) in the left nav
2. Under **CONFIGURATION**, click [**Sign In / Providers**](https://supabase.com/dashboard/project/tenvdkinyvhdlitkwzru/auth/providers)
3. Open **Email** in the provider list
4. Turn **Enable Email provider** on
5. Keep **Confirm email** enabled for production-like behavior (recommended)

With confirm email **on**, signup shows “check your email” until the user clicks the link. Profile rows are created via DB trigger on `auth.users` insert; session starts after confirm at `/auth/callback`.

## 2. Set redirect URLs

Under the same Auth sidebar, open [**URL Configuration**](https://supabase.com/dashboard/project/tenvdkinyvhdlitkwzru/auth/url-configuration) (**CONFIGURATION** section):

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

## Troubleshooting: email confirmation errors

**"Could not confirm your email" after clicking the link**

- Open the link in the **same browser** you used when you signed up. PKCE verification cookies are browser-local; switching browsers breaks the flow.
- If the link has expired or was already used, request a new one by signing up again (if the first attempt failed) or using "Forgot password."
- If you see this error but you're already logged in on another tab, the confirmation may have succeeded silently — refresh the home page.

**"Could not confirm your email" but you can still log in**

Your account was confirmed during an earlier attempt even though the callback showed an error. Try logging in with your email and password directly — if it works, you're all set.
