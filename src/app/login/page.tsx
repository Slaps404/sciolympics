import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { mapAuthError } from "@/lib/auth/messages";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const { error } = params;

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
            Log in to your account
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {mapAuthError(error)}
            </p>
          ) : null}

          <form action={login} className="flex flex-col gap-4">
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
                autoComplete="current-password"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <button
              type="submit"
              className="mt-1 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Log in
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No account?{" "}
          <Link
            href={next !== "/" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
            className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
