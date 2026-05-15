"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);

  const hideNav = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (hideNav) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setMe(null);
          return;
        }
        const data = (await res.json()) as { user: { name: string; email: string } };
        if (!cancelled) setMe(data.user);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hideNav, pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {!hideNav && (
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-sky-300">
              Team Tasks
            </Link>
            <nav className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/projects">Projects</NavLink>
              <span className="hidden text-sm text-slate-500 sm:inline">|</span>
              <span className="hidden max-w-[160px] truncate text-sm text-slate-400 sm:inline">
                {me?.name ?? "…"}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Log out
              </button>
            </nav>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-slate-800 text-sky-300" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}
