import { ActivityComingSoon } from "@/components/activity-coming-soon";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CompeteEventPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("name, slug, description")
    .eq("slug", eventSlug)
    .single();

  if (error || !event) notFound();

  return <ActivityComingSoon activity="compete" event={event} />;
}
