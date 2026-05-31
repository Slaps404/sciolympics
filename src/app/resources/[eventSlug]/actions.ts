"use server";

import { parseResourceType } from "@/lib/resources/resource-types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export async function submitResource(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const resourceType = parseResourceType(formData.get("resource_type"));

  if (!slug) redirect("/resources");
  const back = `/resources/${slug}`;

  if (!title || !url) redirect(`${back}?error=missing-fields`);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    redirect(`${back}?error=invalid-url`);
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    redirect(`${back}?error=invalid-url`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!event) redirect("/resources");

  const { error } = await supabase.from("resources").insert({
    event_id: event.id,
    submitted_by: user.id,
    title,
    url,
    description,
    resource_type: resourceType,
  });

  if (error) redirect(`${back}?error=submit-failed`);

  revalidatePath(back);
  redirect(back);
}
