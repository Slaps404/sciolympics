import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, slug, practice_type, season_year")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Welcome back, {user.email}
        </p>
      </section>

      {/* Hub cards — add more here as L3/L4 features land */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="#events"
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <p className="font-medium">Resources</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Browse link-based resources tagged by event.
          </p>
        </Link>
      </section>

      <section id="events" className="flex flex-col gap-4">
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
                <Link href={`/events/${event.slug}`} className="block p-4">
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
