"use server";

import { createClient } from "@/lib/supabase/server";
import { parseResourceType } from "@/lib/resources/resource-types";
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

function parseOptionalScore(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;

  const score = Number(raw);
  if (!Number.isInteger(score) || score < 1 || score > 10) return null;

  return score;
}

function parseReviewFeedback(formData: FormData) {
  const review_relevance_score = parseOptionalScore(
    formData,
    "review_relevance_score"
  );
  const review_trust_score = parseOptionalScore(formData, "review_trust_score");
  const review_notes =
    String(formData.get("review_notes") ?? "").trim().slice(0, 300) || null;

  return {
    review_relevance_score,
    review_trust_score,
    review_notes,
    reviewed_at:
      review_relevance_score !== null ||
      review_trust_score !== null ||
      review_notes !== null
        ? new Date().toISOString()
        : null,
  };
}

export async function approveCandidate(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/review");

  const supabase = await requireAdmin();

  const { data: candidate } = await supabase
    .from("resource_candidates")
    .select(
      "id, event_id, topic_id, resource_type, title, url, ai_description, status"
    )
    .eq("id", id)
    .single();

  if (!candidate || candidate.status !== "pending") {
    redirect("/admin/review?tab=pending&error=not-found");
  }

  const { data: existingResource, error: existingError } = await supabase
    .from("resources")
    .select("id")
    .eq("event_id", candidate.event_id)
    .eq("url", candidate.url)
    .maybeSingle();

  if (existingError) {
    redirect("/admin/review?tab=pending&error=action-failed");
  }

  if (existingResource) {
    redirect("/admin/review?tab=pending&error=duplicate-resource");
  }

  const { error: insertError } = await supabase.from("resources").insert({
    event_id: candidate.event_id,
    title: candidate.title,
    url: candidate.url,
    description: candidate.ai_description,
    topic_id: candidate.topic_id,
    resource_type: parseResourceType(candidate.resource_type),
    submitted_by: null,
  });

  if (insertError) {
    redirect("/admin/review?tab=pending&error=action-failed");
  }

  const { error: updateError } = await supabase
    .from("resource_candidates")
    .update({ status: "approved", ...parseReviewFeedback(formData) })
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
    .update({ status: "rejected", ...parseReviewFeedback(formData) })
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
