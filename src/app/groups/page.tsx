import { ActivityEventPicker } from "@/components/activity-event-picker";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, slug, practice_type, season_year, description")
    .order("name");
  const { data: counts } = await supabase.from("resources").select("event_id");

  const resourceCount: Record<string, number> = {};
  for (const row of counts ?? []) {
    resourceCount[row.event_id] = (resourceCount[row.event_id] ?? 0) + 1;
  }

  return (
    <ActivityEventPicker
      activity="groups"
      events={events}
      resourceCount={resourceCount}
      error={Boolean(error)}
    />
  );
}
