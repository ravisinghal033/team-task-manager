"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleBadge } from "@/components/Badges";
import { Card, CardDescription, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
  myRole: string | null;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/projects", { credentials: "include" });
        const json = (await res.json()) as { error?: string; projects?: ProjectRow[] };
        if (!res.ok) {
          if (!cancelled) setError(json.error || "Failed to load");
          return;
        }
        if (!cancelled) setProjects(json.projects ?? []);
      } catch {
        if (!cancelled) setError("Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-400">
        Loading projects…
      </div>
    );
  }

  if (error) return <p className="text-rose-400">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="mt-1 text-slate-400">Only projects you belong to are listed here.</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
        >
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <EmptyState
            title="No projects yet"
            description="Create your first project to invite teammates and track tasks."
            action={
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                Create project
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 shadow-card">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Description</th>
                <th className="px-4 py-3 font-medium">Tasks</th>
                <th className="px-4 py-3 font-medium">Your role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-100">
                    <Link href={`/projects/${p.id}`} className="text-sky-300 hover:text-sky-200">
                      {p.name}
                    </Link>
                  </td>
                  <td className="hidden max-w-md truncate px-4 py-3 text-slate-400 sm:table-cell">
                    {p.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.taskCount}</td>
                  <td className="px-4 py-3">
                    {p.myRole ? <RoleBadge role={p.myRole} /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
