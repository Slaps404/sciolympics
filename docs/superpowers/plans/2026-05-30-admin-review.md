# Admin Review Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/review` — an admin-only page for reviewing AI-curated `resource_candidates` with tabbed status views and inline approve/reject/undo actions.

**Architecture:** Two new files only — `actions.ts` handles all DB mutations (approve = insert into resources + mark approved; reject = mark rejected; undo = reverse either), `page.tsx` is a server component with searchParams-driven tab navigation. No client components, no new routes beyond `/admin/review`.

**Tech Stack:** Next.js App Router (server components, server actions), Supabase SSR client (`@/lib/supabase/server`), Tailwind v4 utility classes, TypeScript.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/admin/review/actions.ts` | Create | Three server actions: `approveCandidate`, `rejectCandidate`, `undoDecision` |
| `src/app/admin/review/page.tsx` | Create | Auth-gated server component, tab nav, candidate cards, inline action forms |

No existing files are modified.

---

## Task 1: Server actions

**Files:**
- Create: `src/app/admin/review/actions.ts`

- [ ] **Step 1.1 — Create `src/app/admin/review/actions.ts`** with the full content below:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/review");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");

  return supabase;
}

export async function approveCandidate(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/review");

  const supabase = await requireAdmin();

  const { data: candidate } = await supabase
    .from("resource_candidates")
    .select("id, event_id, title, url, ai_description, status")
    .eq("id", id)
    .single();

  if (!candidate || candidate.status !== "pending")
    redirect("/admin/review?tab=pending&error=not-found");

  const { error: insertError } = await supabase.from("resources").insert({
    event_id: candidate.event_id,
    title: candidate.title,
    url: candidate.url,
    description: candidate.ai_description,
    submitted_by: null,
  });
  if (insertError) redirect("/admin/review?tab=pending&error=action-failed");

  const { error: updateError } = await supabase
    .from("resource_candidates")
    .update({ status: "approved" })
    .eq("id", id);
  if (updateError) redirect("/admin/review?tab=pending&error=action-failed");

  revalidatePath("/admin/review");
  redirect("/admin/review?tab=pending");
}

export async function rejectCandidate(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/review");

  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("resource_candidates")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) redirect("/admin/review?tab=pending&error=action-failed");

  revalidatePath("/admin/review");
  redirect("/admin/review?tab=pending");
}

export async function undoDecision(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/review");

  const supabase = await requireAdmin();

  const { data: candidate } = await supabase
    .from("resource_candidates")
    .select("id, event_id, url, status")
    .eq("id", id)
    .single();

  if (!candidate || candidate.status === "pending")
    redirect("/admin/review?tab=pending");

  const priorStatus = candidate.status as "approved" | "rejected";

  if (priorStatus === "approved") {
    await supabase
      .from("resources")
      .delete()
      .eq("event_id", candidate.event_id)
      .eq("url", candidate.url);
  }

  const { error } = await supabase
    .from("resource_candidates")
    .update({ status: "pending" })
    .eq("id", id);
  if (error) redirect(`/admin/review?tab=${priorStatus}&error=action-failed`);

  revalidatePath("/admin/review");
  redirect("/admin/review?tab=pending");
}
```

- [ ] **Step 1.2 — Verify with lint + build**

```bash
npm run lint && npm run build
```

Expected: no errors, `/admin/review` does not yet appear in route table (page not created yet). Actions file compiles cleanly.

- [ ] **Step 1.3 — Commit**

```bash
git add src/app/admin/review/actions.ts
git commit -m "Add admin review server actions (approve/reject/undo)"
```

---

## Task 2: Review page

**Files:**
- Create: `src/app/admin/review/page.tsx`

- [ ] **Step 2.1 — Create `src/app/admin/review/page.tsx`** with the full content below:

```typescript
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveCandidate, rejectCandidate, undoDecision } from "./actions";

export const dynamic = "force-dynamic";

const RESOURCE_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  notes: {
    label: "Notes",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  video: {
    label: "Video",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
  practice_test: {
    label: "Practice Test",
    className:
      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  },
};

const TABS = ["pending", "approved", "rejected"] as const;
type Tab = (typeof TABS)[number];

const ERROR_MESSAGES: Record<string, string> = {
  "action-failed": "Action failed — please try again.",
  "not-found": "Candidate not found or already actioned.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const { tab: rawTab, error: errorKey } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as Tab)
    : "pending";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/review");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");

  const { data: candidates } = await supabase
    .from("resource_candidates")
    .select(
      "id, url, title, ai_description, relevance_score, trust_score, resource_type, found_at, event_id"
    )
    .eq("status", tab)
    .order("found_at", { ascending: false });

  // Resolve event names without relying on nested select types
  const eventIds = [...new Set((candidates ?? []).map((c) => c.event_id))];
  const eventMap: Record<string, { name: string; slug: string }> = {};
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, name, slug")
      .in("id", eventIds);
    for (const e of events ?? []) {
      eventMap[e.id] = { name: e.name, slug: e.slug };
    }
  }

  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? errorKey) : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-0 px-6 py-10">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Resource Candidates
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review AI-curated links before they go live.
        </p>
      </div>

      {/* Status tabs */}
      <div className="mb-8 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) =>
          t === tab ? (
            <span
              key={t}
              className="border-b-2 border-zinc-900 px-3 pb-2.5 text-sm font-medium capitalize dark:border-zinc-100"
            >
              {t}
            </span>
          ) : (
            <a
              key={t}
              href={`/admin/review?tab=${t}`}
              className="px-3 pb-2.5 text-sm capitalize text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {t}
            </a>
          )
        )}
      </div>

      {errorMessage ? (
        <p className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {errorMessage}
        </p>
      ) : null}

      {candidates && candidates.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {candidates.map((c) => {
            const event = eventMap[c.event_id] ?? null;
            const badge = RESOURCE_TYPE_BADGE[c.resource_type ?? ""] ?? null;
            return (
              <li
                key={c.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium hover:underline"
                    >
                      {c.title}
                    </a>
                    {event ? (
                      <Link
                        href={`/events/${event.slug}`}
                        className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
                      >
                        {event.name}
                      </Link>
                    ) : null}
                  </div>
                  {badge ? (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  ) : c.resource_type ? (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {c.resource_type}
                    </span>
                  ) : null}
                </div>

                {c.ai_description ? (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {c.ai_description}
                  </p>
                ) : null}

                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                  {c.relevance_score !== null ? (
                    <span>Relevance: {c.relevance_score}</span>
                  ) : null}
                  {c.trust_score !== null ? (
                    <span>Trust: {c.trust_score}</span>
                  ) : null}
                  <span>{formatDate(c.found_at)}</span>
                </div>

                <div className="mt-3 flex gap-2">
                  {tab === "pending" ? (
                    <>
                      <form action={approveCandidate}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={rejectCandidate}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          Reject
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={undoDecision}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Undo
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No {tab} candidates.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2.2 — Verify with lint + build**

```bash
npm run lint && npm run build
```

Expected: no errors, `/admin/review` appears in the route table as `ƒ /admin/review`.

- [ ] **Step 2.3 — Smoke test in browser**

```bash
npm run dev
```

1. Open `http://localhost:3000/admin/review` while logged out → should redirect to `/login?next=/admin/review`.
2. Log in as `zekesears2008@gmail.com` → should land on `/admin/review` showing "No pending candidates." with dashed border empty state.
3. Insert a test candidate via Supabase SQL editor:

```sql
insert into public.resource_candidates (url, event_id, title, ai_description, relevance_score, trust_score, resource_type)
values (
  'https://example.com/anatomy-notes',
  (select id from public.events where slug = 'anatomy-and-physiology'),
  'Example anatomy notes',
  'Covers all major body systems with diagrams.',
  85, 70, 'notes'
);
```

4. Reload `/admin/review` → candidate card appears with Approve + Reject buttons, title is a clickable link.
5. Click **Approve** → card disappears, redirects to Pending tab. Switch to Approved tab → card appears with Undo button. Check Supabase `resources` table: row inserted.
6. Click **Undo** on approved card → card returns to Pending tab. Check `resources` table: row deleted.
7. Click **Reject** → card moves to Rejected tab. Click **Undo** → card returns to Pending.

- [ ] **Step 2.4 — Commit**

```bash
git add src/app/admin/review/page.tsx
git commit -m "Add admin review page with tabbed candidate list"
```

- [ ] **Step 2.5 — Push**

```bash
git push origin master
```
