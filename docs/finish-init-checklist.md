# Finish initialization — progress log

Simple walkthrough of what “done” means after the code is on `master`. Check boxes as you complete each step.

---

## Step 1 — Sync repo and verify build

**What:** Make sure your machine matches GitHub and the app compiles.

```bash
git checkout master
git pull origin master
npm install
npm run lint
npm run build
npm run dev
```

**Done when:** Homepage at http://localhost:3000 lists seeded events (or shows the migration hint if DB isn’t linked).

---

## Step 2 — Supabase Auth (email confirmation ON)

**What:** Tell Supabase where users land after they click the confirm link in email.

Dashboard: [Supabase → Auth](https://supabase.com/dashboard/project/tenvdkinyvhdlitkwzru/auth/url-configuration)

| Setting | Value |
|---------|--------|
| Email provider | Enabled |
| Confirm email | **On** (production-like) |
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

**Local env:** add to `.env.local` (not committed):

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

See also [`supabase-auth-setup.md`](supabase-auth-setup.md).

---

## Step 3 — Auth smoke test (you do this in the browser)

**What:** Prove signup → email → login works end-to-end.

1. `/signup` → pick division B or C → submit
2. See “check your email” (no session until confirm)
3. Click link in inbox → lands on `/` with email in header
4. Supabase **Table Editor → users** has your row with correct division
5. Log out → log in with password again

---

## Step 4 — Vercel first deploy

**What:** Put the app on the internet so others can open it.

See [`vercel-deploy.md`](vercel-deploy.md).

**Done when:** Production URL loads the homepage with events.

---

## Step 5 — Production Auth URLs

**What:** Same as Step 2, but for your Vercel URL.

Add to Supabase redirect URLs (keep localhost):

- Site URL: `https://YOUR-APP.vercel.app`
- Redirect: `https://YOUR-APP.vercel.app/auth/callback`

Set on Vercel: `NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app`

Repeat Step 3 on the production URL.

---

## Step 6 — Loose ends

- [ ] GitHub Actions CI green on `master` (`.github/workflows/ci.yml`)
- [ ] Do **not** run `npm audit fix --force` (downgrades Next.js — see README)
- [ ] Optional: customize Supabase email templates

---

## After init: what’s next (L1 features)

Not part of finish-init — next build slice:

1. Event detail pages (`/events/[slug]`)
2. Resource list per event (public read)
3. Submit link form (any logged-in user)

See [`CLAUDE.md`](../CLAUDE.md) for full scope.
