import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { submitResource } from "./actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Title and URL are required.",
  "invalid-url": "Please enter a valid URL starting with http:// or https://.",
  "submit-failed": "Could not save your resource. Please try again.",
};

const PRACTICE_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  quiz:   { label: "Quiz",   className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  hybrid: { label: "Hybrid", className: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  build:  { label: "Build",  className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TABS = [
  { label: "Resources", active: true },
  { label: "Quiz", active: false },
  { label: "Groups", active: false },
  { label: "Compete", active: false },
];

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error: submitError } = await searchParams;

  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name, slug, practice_type, season_year, description")
    .eq("slug", slug)
    .single();

  if (eventError) {
    if (eventError.code === "PGRST116") notFound();
    throw new Error(`Failed to load event: ${eventError.message}`);
  }
  if (!event) notFound();

  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, url, description, created_at, submitted_by")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  // Fetch submitter emails for display
  const submitterIds = [...new Set((resources ?? []).map((r) => r.submitted_by).filter(Boolean))] as string[];
  const submitterMap: Record<string, string> = {};
  if (submitterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("users")
      .select("id")
      .in("id", submitterIds);
    // We only have id on the users table; email lives in auth.users (not client-accessible)
    // Show initials placeholder derived from id instead
    for (const id of submitterIds) {
      submitterMap[id] = id.slice(0, 2).toUpperCase();
    }
    void profiles; // profiles queried to confirm existence; email not exposed client-side
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const errorMessage = submitError ? (ERROR_MESSAGES[submitError] ?? submitError) : null;
  const badge = PRACTICE_TYPE_BADGE[event.practice_type] ?? PRACTICE_TYPE_BADGE.quiz;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-0 px-6 py-10">
      {/* Back + title */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Events
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
            {event.description ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
                {event.description}
              </p>
            ) : null}
          </div>
          <span className={`mt-1 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mb-8 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((tab) =>
          tab.active ? (
            <span
              key={tab.label}
              className="border-b-2 border-zinc-900 px-3 pb-2.5 text-sm font-medium dark:border-zinc-100"
            >
              {tab.label}
            </span>
          ) : (
            <span
              key={tab.label}
              title="Coming soon"
              className="cursor-not-allowed px-3 pb-2.5 text-sm text-zinc-400 dark:text-zinc-600"
            >
              {tab.label}
            </span>
          )
        )}
      </div>

      {/* Resources list */}
      <section className="flex flex-col gap-6">
        {resources && resources.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {resources.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {r.title}
                  </a>
                  {r.submitted_by ? (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                      title="Submitted by a community member"
                    >
                      {submitterMap[r.submitted_by] ?? "??"}
                    </span>
                  ) : null}
                </div>
                {r.description ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {r.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                  {formatDate(r.created_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No resources yet — be the first to submit one below.
            </p>
          </div>
        )}

        {/* Submit form */}
        <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-4 text-base font-semibold">Submit a resource</h2>
          {user ? (
            <>
              {errorMessage ? (
                <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {errorMessage}
                </p>
              ) : null}
              <form action={submitResource} className="flex flex-col gap-4">
                <input type="hidden" name="slug" value={slug} />
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Title
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Khan Academy — Cell Biology"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  URL
                  <input
                    name="url"
                    type="url"
                    required
                    placeholder="https://"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Description{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="What does this resource cover?"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <button
                  type="submit"
                  className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Submit
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                href={`/login?next=/events/${slug}`}
                className="font-medium underline underline-offset-2"
              >
                Log in
              </Link>{" "}
              to submit a resource for this event.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
