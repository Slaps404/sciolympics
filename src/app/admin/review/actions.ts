"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
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

  return supabase;
}

export async function approveCandidate(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/review");

  const supabase = await requireAdmin();

  const { data: candidate } = await supabase
    .from("resource_candidates")
    .select("id, event_id, title, url, ai_description, status")
    .eq("id", id)
    .single();

  if (!candidate || candidate.status !== "pending") {
    redirect("/admin/review?tab=pending&error=not-found");
  }

  const { error: insertError } = await supabase.from("resources").insert({
    event_id: candidate.event_id,
    title: candidate.title,
    url: candidate.url,
    description: candidate.ai_description,
    submitted_by: null,
  });

  if (insertError) {
    redirect("/admin/review?tab=pending&error=action-failed");
  }

  const { error: updateError } = await supabase
    .from("resource_candidates")
    .update({ status: "approved" })
    .eq("id", id);

  if (updateError) {
    redirect("/admin/review?tab=pending&error=action-failed");
  }

  revalidatePath("/admin/review");
  redirect("/admin/review?tab=pending");
}

export async function rejectCandidate(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/review");

  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("resource_candidates")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    redirect("/admin/review?tab=pending&error=action-failed");
  }

  revalidatePath("/admin/review");
  redirect("/admin/review?tab=pending");
}

export async function undoDecision(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/review");

  const supabase = await requireAdmin();

  const { data: candidate } = await supabase
    .from("resource_candidates")
    .select("id, event_id, url, status")
    .eq("id", id)
    .single();

  if (!candidate || candidate.status === "pending") {
    redirect("/admin/review?tab=pending");
  }

  const priorStatus = candidate.status as "approved" | "rejected";

  if (priorStatus === "approved") {
    const { error: deleteError } = await supabase
      .from("resources")
      .delete()
      .eq("event_id", candidate.event_id)
      .eq("url", candidate.url);

    if (deleteError) {
      redirect(`/admin/review?tab=${priorStatus}&error=action-failed`);
    }
  }

  const { error } = await supabase
    .from("resource_candidates")
    .update({ status: "pending" })
    .eq("id", id);

  if (error) {
    redirect(`/admin/review?tab=${priorStatus}&error=action-failed`);
  }

  revalidatePath("/admin/review");
  redirect("/admin/review?tab=pending");
}
