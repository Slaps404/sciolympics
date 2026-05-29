import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, slug, practice_type, season_year")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      {params.message === "confirmed" ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          Email confirmed — welcome to SciOlympics!
        </p>
      ) : null}
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          SciOly practice platform
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Browse event resources and prepare for async ghost-race quizzes. Layer 1
          is link-based resources tagged by event.
        </p>
        <div className="flex gap-3 text-sm">
          <Link href="/signup" className="rounded-md bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900">
            Get started
          </Link>
          <Link href="/login" className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700">
            Log in
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Events</h2>
        {error ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Could not load events. Run database migrations with{" "}
            <code className="font-mono">npm run db:push</code> after{" "}
            <code className="font-mono">npx supabase login</code>.
          </p>
        ) : events && events.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <Link
                  href={`/events/${event.slug}`}
                  className="block p-4"
                >
                  <p className="font-medium">{event.name}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {event.practice_type} · {event.season_year}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No events yet. Seed data lives in{" "}
            <code className="font-mono">supabase/seed.sql</code>.
          </p>
        )}
      </section>
    </div>
  );
}
