"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/Card";
import { StatusBadge, OverdueBadge } from "@/components/Badges";

type DashboardData = {
  totalProjects: number;
  totalTasks: number;
  tasksAssignedToMe: number;
  tasksByStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
  overdueCount: number;
  overdueTasks: Array<{
    id: string;
    title: string;
    status: string;
    project: { id: string; name: string };
    dueDate: string | null;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    project: { id: string; name: string };
    createdAt: string;
  }>;
  projectProgress: Array<{
    projectId: string;
    name: string;
    totalTasks: number;
    doneTasks: number;
    progressPercent: number;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard", { credentials: "include" });
        const json = (await res.json()) as { error?: string } & Partial<DashboardData>;
        if (!res.ok) {
          if (!cancelled) setError(json.error || "Failed to load dashboard");
          return;
        }
        if (!cancelled) setData(json as DashboardData);
      } catch {
        if (!cancelled) setError("Failed to load dashboard");
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
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        Loading dashboard…
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-rose-400">{error || "Unable to load data"}</p>;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-slate-400">Overview of your workload across every project.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Projects" value={data.totalProjects} hint="Where you collaborate" />
        <StatCard label="Total tasks" value={data.totalTasks} hint="Across all projects" />
        <StatCard label="Assigned to me" value={data.tasksAssignedToMe} hint="Owned delivery" />
        <StatCard label="Overdue" value={data.overdueCount} hint="Needs attention" accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Tasks by status</CardTitle>
          <CardDescription>Pipeline health at a glance.</CardDescription>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-2xl font-bold text-slate-100">{data.tasksByStatus.TODO}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Todo</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="text-2xl font-bold text-amber-200">
                {data.tasksByStatus.IN_PROGRESS}
              </div>
              <div className="text-xs uppercase tracking-wide text-amber-500/70">In progress</div>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-2xl font-bold text-emerald-200">{data.tasksByStatus.DONE}</div>
              <div className="text-xs uppercase tracking-wide text-emerald-500/70">Done</div>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Project progress</CardTitle>
          <CardDescription>Completion rate based on done tasks.</CardDescription>
          <div className="mt-6 space-y-4">
            {data.projectProgress.length === 0 ? (
              <p className="text-sm text-slate-500">Join a project to see progress here.</p>
            ) : (
              data.projectProgress.map((p) => (
                <div key={p.projectId}>
                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href={`/projects/${p.projectId}`}
                      className="font-medium text-sky-300 hover:text-sky-200"
                    >
                      {p.name}
                    </Link>
                    <span className="text-slate-400">
                      {p.doneTasks}/{p.totalTasks}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Overdue tasks</CardTitle>
          <CardDescription>Active work past its due date.</CardDescription>
          <ul className="mt-4 divide-y divide-slate-800/80">
            {data.overdueTasks.length === 0 ? (
              <li className="py-6 text-center text-sm text-slate-500">Nothing overdue. Nice work.</li>
            ) : (
              data.overdueTasks.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="font-medium text-slate-100 hover:text-sky-300"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500">{t.project.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    <OverdueBadge />
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <CardTitle>Recently created</CardTitle>
          <CardDescription>Newest tasks in your projects.</CardDescription>
          <ul className="mt-4 divide-y divide-slate-800/80">
            {data.recentTasks.length === 0 ? (
              <li className="py-6 text-center text-sm text-slate-500">No tasks yet.</li>
            ) : (
              data.recentTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="font-medium text-slate-100 hover:text-sky-300"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {t.project.name} · {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent && value > 0
          ? "border-rose-500/30 bg-rose-950/20"
          : ""
      }
    >
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Card>
  );
}
