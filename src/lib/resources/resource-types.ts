import type { ResourceType } from "@/lib/supabase/database.types";

export const RESOURCE_TYPES = [
  "video",
  "article",
  "textbook",
  "interactive",
  "game",
  "quiz",
  "practice_test",
  "lesson_collection",
  "archive",
  "other",
] as const satisfies readonly ResourceType[];

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  video: "Video",
  article: "Article",
  textbook: "Textbook",
  interactive: "Interactive",
  game: "Game",
  quiz: "Quiz",
  practice_test: "Practice Test",
  lesson_collection: "Lesson Collection",
  archive: "Archive",
  other: "Other",
};

export const RESOURCE_TYPE_BADGE: Record<ResourceType, string> = {
  video: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  article: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  textbook: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  interactive: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  game: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  quiz: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  practice_test: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  lesson_collection: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  archive: "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300",
  other: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function parseResourceType(value: FormDataEntryValue | string | null) {
  const raw = String(value ?? "").trim();
  return RESOURCE_TYPES.includes(raw as ResourceType)
    ? (raw as ResourceType)
    : null;
}
