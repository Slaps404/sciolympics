import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RESOURCE_TYPE_BADGE,
  RESOURCE_TYPE_LABEL,
  RESOURCE_TYPES,
} from "@/lib/resources/resource-types";
import type { ResourceType } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { submitResource } from "./actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Title and URL are required.",
  "invalid-url": "Please enter a valid URL starting with http:// or https://.",
  "submit-failed": "Could not save your resource. Please try again.",
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getValues(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function ResourceEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{
    error?: string | string[];
    topic?: string | string[];
    type?: string | string[];
  }>;
}) {
  const { eventSlug } = await params;
  const query = await searchParams;
  const submitError = getValues(query.error)[0];
  const selectedTopicSlugs = new Set(getValues(query.topic));
  const selectedTypes = new Set(
    getValues(query.type).filter((type): type is ResourceType =>
      RESOURCE_TYPES.includes(type as ResourceType)
    )
  );

  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name, slug, practice_type, season_year, description")
    .eq("slug", eventSlug)
    .single();

  if (eventError) {
    if (eventError.code === "PGRST116") notFound();
    throw new Error(`Failed to load event: ${eventError.message}`);
  }
  if (!event) notFound();

  const { data: topics } = await supabase
    .from("event_topics")
    .select("id, name, slug")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true });

  const selectedTopicIds =
    topics
      ?.filter((topic) => selectedTopicSlugs.has(topic.slug))
      .map((topic) => topic.id) ?? [];

  let resourcesQuery = supabase
    .from("resources")
    .select(
      "id, title, url, description, created_at, submitted_by, topic_id, resource_type"
    )
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  if (selectedTopicIds.length > 0) {
    resourcesQuery = resourcesQuery.in("topic_id", selectedTopicIds);
  }

  if (selectedTypes.size > 0) {
    resourcesQuery = resourcesQuery.in("resource_type", [...selectedTypes]);
  }

  const { data: resources } = await resourcesQuery;

  const submitterIds = [
    ...new Set((resources ?? []).map((r) => r.submitted_by).filter(Boolean)),
  ] as string[];
  const submitterMap: Record<string, string> = {};
  if (submitterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("users")
      .select("id")
      .in("id", submitterIds);
    for (const id of submitterIds) {
      submitterMap[id] = id.slice(0, 2).toUpperCase();
    }
    void profiles;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const badge = PRACTICE_TYPE_BADGE[event.practice_type] ?? PRACTICE_TYPE_BADGE.quiz;
  const errorMessage = submitError ? (ERROR_MESSAGES[submitError] ?? submitError) : null;
  const activeFilterCount = selectedTopicIds.length + selectedTypes.size;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-0 px-6 py-10">
      <div className="mb-6">
        <Link
          href="/resources"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {"<- Resources"}
        </Link>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Resource Arena
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                {event.name}
              </h1>
              {event.description ? (
                <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                  {event.description}
                </p>
              ) : null}
            </div>
            <span
              className={`mt-1 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <details className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
            <span>Filter resources</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {activeFilterCount === 0
                ? "All"
                : `${activeFilterCount} active`}
            </span>
          </summary>
          <form className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <div className="grid gap-5 sm:grid-cols-2">
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  Event subsection
                </legend>
                <div className="mt-3 flex flex-col gap-2">
                  {topics && topics.length > 0 ? (
                    topics.map((topic) => (
                      <label
                        key={topic.id}
                        className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <input
                          type="checkbox"
                          name="topic"
                          value={topic.slug}
                          defaultChecked={selectedTopicSlugs.has(topic.slug)}
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        {topic.name}
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No subsections yet.
                    </p>
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  Resource type
                </legend>
                <div className="mt-3 flex flex-col gap-2">
                  {RESOURCE_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      <input
                        type="checkbox"
                        name="type"
                        value={type}
                        defaultChecked={selectedTypes.has(type)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      {RESOURCE_TYPE_LABEL[type]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Apply filters
              </button>
              <Link
                href={`/resources/${event.slug}`}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Clear all
              </Link>
            </div>
          </form>
        </details>
      </div>

      <section className="flex flex-col gap-6">
        {resources && resources.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {resources.map((resource) => {
              const type = resource.resource_type;
              return (
                <li
                  key={resource.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {resource.title}
                    </a>
                    {resource.submitted_by ? (
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                        title="Submitted by a community member"
                      >
                        {submitterMap[resource.submitted_by] ?? "??"}
                      </span>
                    ) : null}
                  </div>
                  {resource.description ? (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {resource.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                    {type ? (
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${RESOURCE_TYPE_BADGE[type]}`}
                      >
                        {RESOURCE_TYPE_LABEL[type]}
                      </span>
                    ) : null}
                    <span>{formatDate(resource.created_at)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {activeFilterCount > 0
                ? "No resources match those filters yet."
                : "No resources yet - be the first to submit one below."}
            </p>
          </div>
        )}

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
                <input type="hidden" name="slug" value={event.slug} />
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Title
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Khan Academy - Cell Biology"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal placeholder:text-zinc-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  URL
                  <input
                    name="url"
                    type="url"
                    required
                    placeholder="https://"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal placeholder:text-zinc-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Type{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                  <select
                    name="resource_type"
                    defaultValue=""
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="">Choose a type</option>
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {RESOURCE_TYPE_LABEL[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Description{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="What does this resource cover?"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal placeholder:text-zinc-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
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
                href={`/login?next=/resources/${event.slug}`}
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
