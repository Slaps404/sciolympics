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
  article: {
    label: "Article",
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  },
  game: {
    label: "Game",
    className:
      "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  },
  interactive: {
    label: "Interactive",
    className:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  },
  textbook: {
    label: "Textbook",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
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
  playlist: {
    label: "Playlist",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
  lesson_collection: {
    label: "Lesson Collection",
    className:
      "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  },
  quiz: {
    label: "Quiz",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  archive: {
    label: "Archive",
    className:
      "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300",
  },
};

const TABS = ["pending", "approved", "rejected"] as const;
type Tab = (typeof TABS)[number];

const ERROR_MESSAGES: Record<string, string> = {
  "action-failed": "Action failed. Please try again.",
  "duplicate-resource": "That URL is already live for this event.",
  "not-found": "Candidate not found or already actioned.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; error?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawTab = getSingleParam(query.tab);
  const errorKey = getSingleParam(query.error);
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
      "id, url, title, ai_description, relevance_score, trust_score, resource_type, found_at, event_id, topic_id"
    )
    .eq("status", tab)
    .order("found_at", { ascending: false });

  const eventIds = [...new Set((candidates ?? []).map((c) => c.event_id))];
  const topicIds = [
    ...new Set((candidates ?? []).map((c) => c.topic_id).filter(Boolean)),
  ] as string[];
  const eventMap: Record<string, { name: string; slug: string }> = {};
  const topicMap: Record<string, { name: string; slug: string }> = {};

  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, name, slug")
      .in("id", eventIds);

    for (const event of events ?? []) {
      eventMap[event.id] = { name: event.name, slug: event.slug };
    }
  }

  if (topicIds.length > 0) {
    const { data: topics } = await supabase
      .from("event_topics")
      .select("id, name, slug")
      .in("id", topicIds);

    for (const topic of topics ?? []) {
      topicMap[topic.id] = { name: topic.name, slug: topic.slug };
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
          {"<- Dashboard"}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Resource Candidates
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review AI-curated links before they go live.
        </p>
      </div>

      <div className="mb-8 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((item) =>
          item === tab ? (
            <span
              key={item}
              className="border-b-2 border-zinc-900 px-3 pb-2.5 text-sm font-medium capitalize dark:border-zinc-100"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={`/admin/review?tab=${item}`}
              className="px-3 pb-2.5 text-sm capitalize text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item}
            </Link>
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
          {candidates.map((candidate) => {
            const event = eventMap[candidate.event_id] ?? null;
            const topic = candidate.topic_id
              ? (topicMap[candidate.topic_id] ?? null)
              : null;
            const badge =
              RESOURCE_TYPE_BADGE[candidate.resource_type ?? ""] ?? null;

            return (
              <li
                key={candidate.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <a
                      href={candidate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium hover:underline"
                    >
                      {candidate.title}
                    </a>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {event ? (
                        <Link
                          href={`/resources/${event.slug}`}
                          className="hover:underline"
                        >
                          {event.name}
                        </Link>
                      ) : null}
                      {event && topic ? <span aria-hidden="true">/</span> : null}
                      {topic ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {topic.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {badge ? (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  ) : candidate.resource_type ? (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {candidate.resource_type}
                    </span>
                  ) : null}
                </div>

                {candidate.ai_description ? (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {candidate.ai_description}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                  {candidate.relevance_score !== null ? (
                    <span>Relevance: {candidate.relevance_score}</span>
                  ) : null}
                  {candidate.trust_score !== null ? (
                    <span>Trust: {candidate.trust_score}</span>
                  ) : null}
                  <span>{formatDate(candidate.found_at)}</span>
                </div>

                <div className="mt-3 flex gap-2">
                  {tab === "pending" ? (
                    <form className="flex w-full flex-col gap-3">
                      <input type="hidden" name="id" value={candidate.id} />
                      <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/70">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          Review feedback
                        </p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Relevance
                            <select
                              name="review_relevance_score"
                              defaultValue=""
                              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                            >
                              <option value="">No rating</option>
                              {Array.from({ length: 10 }, (_, index) => (
                                <option key={index + 1} value={index + 1}>
                                  {index + 1}/10
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Trust
                            <select
                              name="review_trust_score"
                              defaultValue=""
                              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                            >
                              <option value="">No rating</option>
                              {Array.from({ length: 10 }, (_, index) => (
                                <option key={index + 1} value={index + 1}>
                                  {index + 1}/10
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="mt-3 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Note
                          <textarea
                            name="review_notes"
                            maxLength={300}
                            rows={2}
                            placeholder="Optional: too advanced for B, great visuals, weak trust signal..."
                            className="resize-none rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          formAction={approveCandidate}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          Approve
                        </button>
                        <button
                          type="submit"
                          formAction={rejectCandidate}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          Reject
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form action={undoDecision}>
                      <input type="hidden" name="id" value={candidate.id} />
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
