"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { mapAuthError } from "@/lib/auth/messages";
import type { Division } from "@/lib/supabase/database.types";

function getEmailRedirectTo(next: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const callbackUrl = new URL(`${siteUrl}/auth/callback`);
  if (next !== "/") callbackUrl.searchParams.set("next", next);
  return callbackUrl.toString();
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const nextParam = next !== "/" ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/login?error=${encodeURIComponent(mapAuthError(error.message))}${nextParam}`);
  }

  await ensureUserProfile(supabase);
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const division = String(formData.get("division") ?? "") as Division;
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (password !== passwordConfirm) {
    const nextParam = next !== "/" ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/signup?error=password_mismatch${nextParam}`);
  }

  if (division !== "B" && division !== "C") {
    const nextParam = next !== "/" ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/signup?error=invalid_division${nextParam}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { division },
      emailRedirectTo: getEmailRedirectTo(next),
    },
  });

  if (error) {
    const nextParam = next !== "/" ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/signup?error=${encodeURIComponent(mapAuthError(error.message))}${nextParam}`);
  }

  if (!data.user) {
    const nextParam = next !== "/" ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/signup?error=no_user_returned${nextParam}`);
  }

  if (!data.session) {
    const nextParam = next !== "/" ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/signup?message=check-email${nextParam}`);
  }

  await ensureUserProfile(supabase);
  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
