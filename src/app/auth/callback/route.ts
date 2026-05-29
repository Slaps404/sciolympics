import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_OTP_TYPES = [
  "signup",
  "recovery",
  "magiclink",
  "email_change",
  "email",
] as const;
type OtpType = (typeof ALLOWED_OTP_TYPES)[number];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const errorDescription = searchParams.get("error_description");
  const next = safeRedirectPath(searchParams.get("next"));

  // Supabase redirected here with an error — surface it directly
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`
    );
  }

  const supabase = await createClient();
  let verifyError: { message: string } | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verifyError = error;
  } else if (token_hash && rawType) {
    if (!(ALLOWED_OTP_TYPES as readonly string[]).includes(rawType)) {
      return NextResponse.redirect(
        `${origin}/login?error=callback_invalid_type`
      );
    }
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: rawType as OtpType,
    });
    verifyError = error;
  } else {
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }

  if (verifyError) {
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }

  // Profile creation is best-effort — session is valid even if this fails
  try {
    await ensureUserProfile(supabase);
  } catch (e) {
    console.error("ensureUserProfile failed after auth callback", e);
  }

  // Append ?message=confirmed only when landing on home so it doesn't pollute other page URLs
  const redirectUrl = new URL(`${origin}${next}`);
  if (next === "/") redirectUrl.searchParams.set("message", "confirmed");
  return NextResponse.redirect(redirectUrl.toString());
}
