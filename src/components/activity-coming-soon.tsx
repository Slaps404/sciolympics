import Link from "next/link";

const ACTIVITY_LABEL: Record<string, string> = {
  quiz: "Quiz",
  groups: "Groups",
  compete: "Compete",
};

const ACTIVITY_MESSAGE: Record<string, string> = {
  quiz: "Event quizzes will live here, with focused practice sets and score history.",
  groups: "Event groups will live here, with shared prep spaces for teammates.",
  compete: "Event competition mode will live here, with timed runs and ghost-race challenges.",
};

export function ActivityComingSoon({
  activity,
  event,
}: {
  activity: "quiz" | "groups" | "compete";
  event: { name: string; slug: string; description: string | null };
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <Link
        href={`/${activity}`}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {"<- "}
        {ACTIVITY_LABEL[activity]}
      </Link>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {ACTIVITY_LABEL[activity]} Arena
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {event.name}
        </h1>
        {event.description ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {event.description}
          </p>
        ) : null}
      </section>

      <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 dark:border-zinc-700">
        <p className="text-base font-medium">
          {ACTIVITY_LABEL[activity]} is coming soon for this event.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {ACTIVITY_MESSAGE[activity]}
        </p>
        <Link
          href={`/resources/${event.slug}`}
          className="mt-5 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Train with resources
        </Link>
      </div>
    </div>
  );
}
