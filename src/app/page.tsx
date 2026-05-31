import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PRACTICE_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  quiz:   { label: "Quiz",   className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  hybrid: { label: "Hybrid", className: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  build:  { label: "Build",  className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/resources");

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, slug, practice_type, season_year, description")
    .order("name");

  const { data: counts } = await supabase
    .from("resources")
    .select("event_id");

  const resourceCount: Record<string, number> = {};
  for (const row of counts ?? []) {
    resourceCount[row.event_id] = (resourceCount[row.event_id] ?? 0) + 1;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12">
      {params.message === "confirmed" ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          Email confirmed — welcome to SciOlympics!
        </p>
      ) : null}

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Science Olympiad, practiced smarter.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Browse curated event resources and race against recorded runs from
            your teammates. Built for Division B &amp; C competitors.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium dark:border-zinc-700"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">Events you can practice</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign up to submit resources and track your prep.
          </p>
        </div>
        {error ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Could not load events. Run database migrations with{" "}
            <code className="font-mono">npm run db:push</code> after{" "}
            <code className="font-mono">npx supabase login</code>.
          </p>
        ) : events && events.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {events.map((event) => {
              const badge = PRACTICE_TYPE_BADGE[event.practice_type] ?? PRACTICE_TYPE_BADGE.quiz;
              const count = resourceCount[event.id] ?? 0;
              return (
                <li key={event.id}>
                  <Link
                    href={`/resources/${event.slug}`}
                    className="group flex h-full flex-col gap-3 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">{event.name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {event.description ? (
                      <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {event.description}
                      </p>
                    ) : null}
                    <p className="mt-auto text-xs text-zinc-400 dark:text-zinc-500">
                      {count === 0
                        ? "No resources yet"
                        : `${count} resource${count === 1 ? "" : "s"}`}
                    </p>
                  </Link>
                </li>
              );
            })}
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
