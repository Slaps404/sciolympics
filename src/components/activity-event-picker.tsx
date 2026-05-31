import Link from "next/link";

type EventCard = {
  id: string;
  name: string;
  slug: string;
  practice_type: string;
  season_year: number;
  description?: string | null;
};

const PRACTICE_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  quiz: {
    label: "Quiz",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  hybrid: {
    label: "Hybrid",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  },
  build: {
    label: "Build",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
};

const ACTIVITY_COPY: Record<
  string,
  { kicker: string; title: string; description: string; cta: string }
> = {
  resources: {
    kicker: "Training Library",
    title: "Choose an event to start resource prep.",
    description:
      "Open an event, filter by system and resource type, and build a cleaner study queue.",
    cta: "Open resources",
  },
  quiz: {
    kicker: "Coming Soon",
    title: "Quiz mode is warming up.",
    description:
      "Choose an event now to see where event-specific quizzes will live once practice mode ships.",
    cta: "Preview quiz space",
  },
  groups: {
    kicker: "Coming Soon",
    title: "Team rooms will start by event.",
    description:
      "Groups will organize teammates, shared prep, and event-specific collaboration.",
    cta: "Preview group space",
  },
  compete: {
    kicker: "Coming Soon",
    title: "Competition mode will start by event.",
    description:
      "Compete will become the place for timed attempts, ghost runs, and lightweight rankings.",
    cta: "Preview compete space",
  },
};

export function ActivityEventPicker({
  activity,
  events,
  resourceCount = {},
  error,
}: {
  activity: "resources" | "quiz" | "groups" | "compete";
  events: EventCard[] | null;
  resourceCount?: Record<string, number>;
  error?: boolean;
}) {
  const copy = ACTIVITY_COPY[activity];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {copy.kicker}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          {copy.description}
        </p>
      </section>

      {error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Could not load events. Run database migrations with{" "}
          <code className="font-mono">npm run db:push</code> after{" "}
          <code className="font-mono">npx supabase login</code>.
        </p>
      ) : events && events.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => {
            const badge =
              PRACTICE_TYPE_BADGE[event.practice_type] ?? PRACTICE_TYPE_BADGE.quiz;
            const count = resourceCount[event.id] ?? 0;
            const status =
              activity === "resources"
                ? count === 0
                  ? "No resources yet"
                  : `${count} resource${count === 1 ? "" : "s"}`
                : "Coming soon";

            return (
              <li key={event.id}>
                <Link
                  href={`/${activity}/${event.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-500"
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
                <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{status}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {copy.cta}
                    </span>
                  </div>
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
    </div>
  );
}
