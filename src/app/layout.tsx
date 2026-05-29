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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Link href="/" className="text-lg font-semibold">
              SciOlympics
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {user.email}
                  </span>
                  <form action={logout}>
                    <button type="submit" className="underline">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="underline">
                    Log in
                  </Link>
                  <Link href="/signup" className="underline">
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
