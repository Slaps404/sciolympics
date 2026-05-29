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
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center gap-6 px-6">
      <Link
        href="/"
        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back to home
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Access SciOlympics practice resources.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {mapAuthError(error)}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Log in
        </button>
      </form>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link href={next !== "/" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-medium underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
