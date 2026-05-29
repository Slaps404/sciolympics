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
    .select("id, name, slug, practice_type, season_year")
    .eq("slug", slug)
    .single();

  if (eventError) {
    if (eventError.code === "PGRST116") notFound();
    throw new Error(`Failed to load event: ${eventError.message}`);
  }
  if (!event) notFound();

  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, url, description, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const errorMessage = submitError ? (ERROR_MESSAGES[submitError] ?? submitError) : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div>
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to events
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{event.name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {event.practice_type} · {event.season_year}
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Resources</h2>
        {resources && resources.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {resources.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  {r.title}
                </a>
                {r.description ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {r.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No resources yet — be the first to submit.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Submit a resource</h2>
        {user ? (
          <>
            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {errorMessage}
              </p>
            ) : null}
            <form action={submitResource} className="flex flex-col gap-4">
              <input type="hidden" name="slug" value={slug} />
              <label className="flex flex-col gap-1 text-sm">
                Title
                <input
                  name="title"
                  type="text"
                  required
                  className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                URL
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://"
                  className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Description (optional)
                <textarea
                  name="description"
                  rows={3}
                  className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <button
                type="submit"
                className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Submit
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href={`/login?next=/events/${slug}`}
              className="font-medium underline"
            >
              Log in
            </Link>{" "}
            to submit a resource.
          </p>
        )}
      </section>
    </div>
  );
}
