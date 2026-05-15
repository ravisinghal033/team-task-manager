"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleBadge } from "@/components/Badges";
import { Card, CardTitle } from "@/components/Card";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/FormControls";
import { useSessionUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/client-fetch";

type ProjectRow = {
  id: string;
  name: string;
  myRole: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: sessionUser, loading: sessionLoading } = useSessionUser();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const loadProjects = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    try {
      const res = await apiFetch("/api/projects", { signal });
      const json = (await res.json()) as {
        error?: string;
        projects?: Array<{ id: string; name: string; myRole: string | null }>;
      };
      if (!mountedRef.current) return;
      if (!res.ok) {
        setError(json.error || "Could not load projects.");
        return;
      }
      setProjects(
        (json.projects ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          myRole: p.myRole,
        })),
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (mountedRef.current) setError("Could not load projects.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();
    void loadProjects(ac.signal);
    return () => {
      mountedRef.current = false;
      ac.abort();
    };
  }, [loadProjects]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  if (sessionLoading || (loading && !sessionUser)) {
    return <LoadingScreen label="Loading profile…" />;
  }

  if (!sessionUser) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-8 text-center">
        <p className="text-slate-200">Session expired. Please sign in again.</p>
        <Link href="/login" className="mt-4 inline-block text-sky-300 hover:text-sky-200">
          Go to login
        </Link>
      </div>
    );
  }

  const createdLabel = sessionUser.createdAt
    ? new Date(sessionUser.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/20 text-xl font-semibold text-sky-300 ring-2 ring-sky-500/30">
            {initials(sessionUser.name)}
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{sessionUser.name}</h1>
            <p className="mt-1 text-slate-400">{sessionUser.email}</p>
            {createdLabel ? (
              <p className="mt-1 text-xs text-slate-500">Account created {createdLabel}</p>
            ) : null}
          </div>
        </div>
        <Button variant="secondary" onClick={() => void logout()}>
          Log out
        </Button>
      </div>

      <Card>
        <CardTitle>Workspace</CardTitle>
        <p className="mt-2 text-sm text-slate-400">
          Project roles are managed per project.
        </p>
      </Card>

      <Card>
        <CardTitle>Your projects</CardTitle>
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        {projects.length === 0 && !error ? (
          <p className="mt-4 text-sm text-slate-500">You are not a member of any projects yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-700/50">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/projects/${p.id}`} className="font-medium text-sky-300 hover:text-sky-200">
                  {p.name}
                </Link>
                {p.myRole ? <RoleBadge role={p.myRole} /> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
