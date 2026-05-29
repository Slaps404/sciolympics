import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Division } from "@/lib/supabase/database.types";

export async function ensureUserProfile(
  supabase: SupabaseClient<Database>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return;
  }

  const division = user.user_metadata?.division;
  if (division !== "B" && division !== "C") {
    return;
  }

  await supabase.from("users").insert({
    id: user.id,
    division: division as Division,
  });
}
