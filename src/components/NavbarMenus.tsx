"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBell, IconChevronDown } from "@/components/Icons";
import type { SessionUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/client-fetch";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const res = await apiFetch("/api/notifications?countOnly=1", {
          signal: controller.signal,
        });
        if (ignore || !res.ok) return;
        const json = (await res.json()) as { count?: number };
        if (!ignore) setCount(json.count ?? 0);
      } catch (err) {
        if (controller.signal.aborted || (err as Error)?.name === "AbortError") return;
      }
    })();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  return (
    <Link
      href="/notifications"
      prefetch
      className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
      aria-label="Notifications"
    >
      <IconBell />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-slate-950">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export function ProfileMenu({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  if (!user) {
    return <span className="text-sm text-slate-500">…</span>;
  }

  return (
    <div className="relative">
      <div className="flex items-center">
        <Link
          href="/profile"
          prefetch
          className="flex max-w-[200px] items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800/80"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-300 ring-1 ring-sky-500/30">
            {initials(user.name)}
          </span>
          <span className="hidden truncate sm:inline">{user.name}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800/80 hover:text-slate-200"
          aria-label="Account menu"
        >
          <IconChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-700/80 bg-slate-900/95 p-1 shadow-xl backdrop-blur-md">
          <Link
            href="/profile"
            prefetch
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/80"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
