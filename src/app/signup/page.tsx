import Link from "next/link";
import { redirect } from "next/navigation";
import { signup } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { mapAuthError } from "@/lib/auth/messages";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const { error, message } = params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next = safeRedirectPath(params.next ?? null);
  if (user) redirect(next);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            SciOlympics
          </Link>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Create your account
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {message === "check-email" ? (
            <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
              Check your email to confirm your account, then log in.
            </p>
          ) : null}

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {mapAuthError(error)}
            </p>
          ) : null}

          <form action={signup} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Password
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Confirm password
              <input
                name="password_confirm"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Division
              <select
                name="division"
                required
                defaultValue="C"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="B">Division B (middle school)</option>
                <option value="C">Division C (high school)</option>
              </select>
            </label>
            <button
              type="submit"
              className="mt-1 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Create account
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
