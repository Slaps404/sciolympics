import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SciOlympics",
  description: "Science Olympiad practice resources and async ghost-race quizzes",
};

function getInitials(email: string): string {
  const local = email.split("@")[0];
  const parts = local.split(/[.\-_]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initials = user?.email ? getInitials(user.email) : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Link href="/" className="text-base font-semibold tracking-tight">
              SciOlympics
            </Link>

            <nav className="flex items-center gap-3 text-sm">
              {user && initials ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-md px-3 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    Dashboard
                  </Link>
                  <details className="relative">
                    <summary className="flex cursor-pointer list-none items-center gap-2 select-none">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {initials}
                      </span>
                    </summary>
                    <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                      <p className="truncate px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {user.email}
                      </p>
                      <hr className="border-zinc-200 dark:border-zinc-700" />
                      <form action={logout}>
                        <button
                          type="submit"
                          className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Log out
                        </button>
                      </form>
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
