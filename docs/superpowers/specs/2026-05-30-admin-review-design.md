# Admin Review Page — Design Spec

**Date:** 2026-05-30
**Status:** Approved

## Context

The `resource_candidates` table holds AI-curated resource links awaiting human review. This page gives the admin (currently one user: `zekesears2008@gmail.com`) a UI to review those candidates, approve or reject them, and undo past decisions.

## Decisions

| Question | Decision |
|---|---|
| Approve behavior | Copy to `public.resources` + mark candidate `status = 'approved'` |
| Reject behavior | Mark candidate `status = 'rejected'` only |
| Undo approve | Delete from `public.resources` (match by url + event_id) + mark back to `pending` |
| Undo reject | Mark back to `pending` |
| View scope | All candidates, tabbed by status |
| Actions | Inline per-row; URL opens in new tab for preview |
| Nav entry | None — direct URL `/admin/review` only |
| Implementation approach | Server components + searchParams tabs + server actions (Plan A) |

## Route

```
src/app/admin/review/page.tsx     — server component, auth-gated
src/app/admin/review/actions.ts   — server actions
```

## Auth Guard

On page load:
1. `createClient()` → `supabase.auth.getUser()`. No user → `redirect('/login?next=/admin/review')`.
2. Query `public.users.select('is_admin').eq('id', user.id).single()`. Not admin → `redirect('/')`.

The existing RLS "users read own profile" policy (`auth.uid() = id`) allows this query. The `public.is_admin()` Postgres function is intentionally not used here — it has EXECUTE revoked from all roles; we query directly instead.

## Page Structure

**Tab navigation:** `searchParams.tab` — `pending` (default) | `approved` | `rejected`. Tab links are plain `<a href="/admin/review?tab=...">` anchors — no client component needed.

**Data fetch per tab:**
```ts
supabase
  .from('resource_candidates')
  .select('*, events(name, slug)')
  .eq('status', tab)
  .order('found_at', { ascending: false })
```

**Candidate card fields:**
- Event name (from join), linked to `/events/[slug]`
- Title — `<a href={url} target="_blank" rel="noopener noreferrer">` for site preview
- `ai_description` (if present)
- `resource_type` badge (same colored-pill pattern as `PRACTICE_TYPE_BADGE`)
- `relevance_score` + `trust_score` as small numeric chips (e.g. "R: 85 · T: 70")
- `found_at` formatted date

**Inline action buttons** (via `<form action={...}>`):
- Pending tab → **Approve** (zinc filled) + **Reject** (zinc border)
- Approved tab → **Undo** (zinc border)
- Rejected tab → **Undo** (zinc border)

Each form passes a hidden `<input name="id" value={candidate.id}>` and hidden `<input name="tab" value={currentTab}>` for redirect-back.

Empty state per tab: dashed border card, "No [pending/approved/rejected] candidates."

## Server Actions (`actions.ts`)

All actions: `"use server"`, `createClient()`, re-verify admin (defense-in-depth), do DB work, `revalidatePath('/admin/review')`, `redirect('/admin/review?tab=...')`.

### `approveCandidate(formData)`
1. Fetch candidate by id (verify exists + is pending).
2. `supabase.from('resources').insert({ event_id, title, url, description: ai_description, submitted_by: null })`.
3. `supabase.from('resource_candidates').update({ status: 'approved' }).eq('id', id)`.
4. Redirect to `?tab=pending`.

### `rejectCandidate(formData)`
1. `supabase.from('resource_candidates').update({ status: 'rejected' }).eq('id', id)`.
2. Redirect to `?tab=pending`.

### `undoDecision(formData)`
Handles both approved→pending and rejected→pending. Only the candidate `id` is passed via the form — `event_id`, `url`, and current `status` are fetched from the DB (avoids form tampering):
1. Fetch candidate by id. Abort if not found or already `pending`.
2. If `status = 'approved'`: `supabase.from('resources').delete().eq('event_id', candidate.event_id).eq('url', candidate.url)` then update candidate to `pending`.
3. If `status = 'rejected'`: update candidate to `pending` only.
4. Redirect to `?tab=pending`.

**Error handling:** On DB error, redirect to `?tab=[tab]&error=action-failed` and show an amber banner (same pattern as events/[slug]).

## Styling

Follows existing conventions:
- `max-w-3xl` page container (matches events/[slug])
- Zinc card border `rounded-xl border border-zinc-200 p-4 dark:border-zinc-800`
- Active tab: `border-b-2 border-zinc-900` (matches events/[slug] tabs)
- Approve button: `bg-zinc-900 text-white` filled
- Reject/Undo button: `border border-zinc-300` outline
- `resource_type` badge: colored pill, same map as `PRACTICE_TYPE_BADGE` (quiz/hybrid/build) — unknown types fall back to zinc

## Files Changed

| File | Change |
|---|---|
| `src/app/admin/review/page.tsx` | New — server component |
| `src/app/admin/review/actions.ts` | New — approve/reject/undo server actions |

No changes to `public.resources` schema, `layout.tsx`, or any existing pages.

## Verification

1. Visit `/admin/review` logged out → redirects to `/login?next=/admin/review`.
2. Visit `/admin/review` logged in as non-admin → redirects to `/`.
3. Visit `/admin/review` as admin (zekesears2008@gmail.com) → Pending tab loads (may be empty).
4. Insert a test candidate via Supabase SQL editor, reload → card appears.
5. Click the title link → opens URL in new tab.
6. Approve → card disappears from Pending, appears in Approved tab; verify row in `public.resources`.
7. Undo approval → card returns to Pending tab; verify row removed from `public.resources`.
8. Reject → card disappears from Pending, appears in Rejected tab.
9. Undo rejection → card returns to Pending tab.
10. `npm run build && npm run lint` clean.
