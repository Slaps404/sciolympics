"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Division } from "@/lib/supabase/database.types";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const division = String(formData.get("division") ?? "") as Division;

  if (division !== "B" && division !== "C") {
    redirect("/signup?error=invalid-division");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    redirect(
      "/signup?error=Account%20created%20but%20no%20user%20returned.%20Check%20your%20email%20or%20try%20again."
    );
  }

  const { error: profileError } = await supabase.from("users").insert({
    id: data.user.id,
    division,
  });

  if (profileError) {
    redirect(`/signup?error=${encodeURIComponent(profileError.message)}`);
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
