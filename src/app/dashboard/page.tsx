"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/Badges";
import { Card, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/FormControls";
import { useSessionUser } from "@/components/UserProvider";
import { formatDueDate } from "@/lib/format-date";
import { sortTasksForDisplay } from "@/lib/task-sort";
import { apiFetch } from "@/lib/client-fetch";

type DashboardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string };
  overdue?: boolean;
};

type WorkloadRow = { userId: string; name: string; openTasks: number };

type DashboardData = {
  totalProjects: number;
  totalTasks: number;
  tasksAssignedToMe: number;
  tasksCreatedByMe: number;
  overdueCount: number;
  dueSoonCount: number;
  completedAssignedCount: number;
  teamMemberCount: number;
  isAdminOnAny: boolean;
  isMemberOnly: boolean;
  overdueTasks: DashboardTask[];
  dueSoonTasks: DashboardTask[];
  recentTasks: DashboardTask[];
  myCreatedTasks: DashboardTask[];
  assignedToMeTasks: DashboardTask[];
  unassignedTasks: DashboardTask[];
  workloadSummary: WorkloadRow[];
  projectProgress: Array<{
    projectId: string;
    name: string;
    totalTasks: number;
    doneTasks: number;
    progressPercent: number;
  }>;
  statusDistribution: { TODO: number; IN_PROGRESS: number; DONE: number };
};

function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.totalProjects === "number" && typeof v.totalTasks === "number";
}

function extractDashboard(payload: unknown): DashboardData | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;

  if (root.ok === false) return null;

  const candidate = root.dashboard ?? root.data ?? root;
  if (isDashboardData(candidate)) return candidate;

  return null;
}

function TaskList({ tasks, emptyTitle }: { tasks: DashboardTask[]; emptyTitle: string }) {
  const sorted = useMemo(() => sortTasksForDisplay(tasks), [tasks]);

  if (sorted.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  return (
    <ul className="divide-y divide-slate-700/50">
      {sorted.map((t) => (
        <li
          key={t.id}
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <Link href={`/tasks/${t.id}`} className="font-medium text-slate-100 hover:text-sky-300">
              {t.title}
            </Link>
            <p className="mt-0.5 truncate text-xs text-slate-500">{t.project.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={t.status} />
            <PriorityBadge priority={t.priority} />
            {t.dueDate ? (
              <span className="text-xs text-slate-500">Due {formatDueDate(t.dueDate)}</span>
            ) : null}
            {t.overdue ? <OverdueBadge /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusBars({
  distribution,
}: {
  distribution: { TODO: number; IN_PROGRESS: number; DONE: number };
}) {
  const total = distribution.TODO + distribution.IN_PROGRESS + distribution.DONE;
  if (total === 0) {
    return <p className="text-sm text-slate-500">No tasks yet.</p>;
  }

  const rows = [
    { label: "To do", key: "TODO" as const, color: "bg-slate-500" },
    { label: "In progress", key: "IN_PROGRESS" as const, color: "bg-amber-500" },
    { label: "Done", key: "DONE" as const, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const count = distribution[row.key];
        const pct = Math.round((count / total) * 100);
        return (
          <div key={row.key}>
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>{row.label}</span>
              <span>
                {count} ({pct}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
              <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useSessionUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const retryControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function loadDashboard() {
      if (process.env.NODE_ENV === "development") {
        console.log("[dashboard page] fetch start");
      }

      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch("/api/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (process.env.NODE_ENV === "development") {
          console.log("[dashboard page] response status", res.status);
        }

        const payload = await res.json().catch(() => null);

        if (!res.ok || (payload && typeof payload === "object" && payload.ok === false)) {
          const message =
            (payload && typeof payload === "object" && "error" in payload
              ? String(payload.error)
              : null) || `Dashboard request failed: ${res.status}`;
          throw new Error(message);
        }

        const dashboardData = extractDashboard(payload);
        if (!dashboardData) {
          throw new Error("Dashboard response missing dashboard payload");
        }

        if (!ignore) {
          setData(dashboardData);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          if (process.env.NODE_ENV === "development") {
            console.log("[dashboard page] fetch aborted");
          }
          return;
        }
        if ((err as Error)?.name === "AbortError") {
          if (process.env.NODE_ENV === "development") {
            console.log("[dashboard page] fetch aborted (AbortError)");
          }
          return;
        }

        console.error("Dashboard load failed:", err);

        if (!ignore) {
          setError("Dashboard data could not load. Please retry.");
          setData(null);
        }
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
      controller.abort();
      if (process.env.NODE_ENV === "development") {
        console.log("[dashboard page] cleanup abort");
      }
    };
  }, []);

  async function retryLoad() {
    retryControllerRef.current?.abort();
    const controller = new AbortController();
    retryControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/dashboard", {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok || (payload && typeof payload === "object" && payload.ok === false)) {
        throw new Error(
          (payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : null) || `Dashboard request failed: ${res.status}`,
        );
      }

      const dashboardData = extractDashboard(payload);
      if (!dashboardData) {
        throw new Error("Dashboard response missing dashboard payload");
      }

      setData(dashboardData);
    } catch (err) {
      if (controller.signal.aborted || (err as Error)?.name === "AbortError") return;
      console.error("Dashboard retry failed:", err);
      setError("Dashboard data could not load. Please retry.");
      setData(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  const dueSoonOverdue = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, DashboardTask>();
    for (const t of data.overdueTasks) {
      map.set(t.id, t);
    }
    for (const t of data.dueSoonTasks) {
      map.set(t.id, t);
    }
    return sortTasksForDisplay(Array.from(map.values()));
  }, [data]);

  const firstName = user?.name?.split(/\s+/)[0] ?? "there";

  if (loading && !data) {
    return <LoadingScreen label="Loading dashboard…" />;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-8 text-center">
        <p className="text-slate-200">{error || "Dashboard data could not load. Please retry."}</p>
        <Button className="mt-4" onClick={() => void retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  const showAssignedSection =
    !data.isAdminOnAny || (data.isAdminOnAny && data.tasksAssignedToMe > 0);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[#131b2e] to-[#0f1628] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Hello, {firstName}</h1>
            <p className="mt-2 text-slate-400">Let&apos;s keep delivery on track.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/projects"
              prefetch
              className="inline-flex items-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              New task
            </Link>
            <Link
              href="/projects/new"
              prefetch
              className="inline-flex items-center rounded-lg border border-slate-600/80 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-500/40 hover:bg-slate-800"
            >
              Create project
            </Link>
          </div>
        </div>
      </section>

      {data.isAdminOnAny ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Projects" value={data.totalProjects} />
            <StatCard label="Total tasks" value={data.totalTasks} />
            <StatCard label="Created by me" value={data.tasksCreatedByMe} />
            <StatCard label="Overdue" value={data.overdueCount} accent />
            <StatCard label="Team members" value={data.teamMemberCount} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle>Project progress</CardTitle>
              <div className="mt-4 space-y-4">
                {data.projectProgress.length === 0 ? (
                  <EmptyState title="No projects yet" />
                ) : (
                  data.projectProgress.map((p) => (
                    <div key={p.projectId}>
                      <div className="flex items-center justify-between text-sm">
                        <Link
                          href={`/projects/${p.projectId}`}
                          prefetch
                          className="font-medium text-sky-300 hover:text-sky-200"
                        >
                          {p.name}
                        </Link>
                        <span className="text-slate-400">
                          {p.doneTasks}/{p.totalTasks}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
                          style={{ width: `${p.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card>
              <CardTitle>Task status</CardTitle>
              <div className="mt-4">
                <StatusBars distribution={data.statusDistribution} />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>Tasks I assigned / created</CardTitle>
              <div className="mt-4">
                <TaskList tasks={data.myCreatedTasks} emptyTitle="No tasks created yet" />
              </div>
            </Card>
            <Card>
              <CardTitle>Due soon & overdue</CardTitle>
              <div className="mt-4">
                <TaskList tasks={dueSoonOverdue} emptyTitle="No urgent tasks" />
              </div>
            </Card>
          </div>

          {data.workloadSummary.length > 0 ? (
            <Card>
              <CardTitle>Team workload</CardTitle>
              <ul className="mt-4 space-y-2">
                {data.workloadSummary.map((w) => (
                  <li
                    key={w.userId}
                    className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-200">{w.name}</span>
                    <span className="text-slate-400">{w.openTasks} open tasks</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {showAssignedSection ? (
            <Card>
              <CardTitle>Also assigned to me</CardTitle>
              <div className="mt-4">
                <TaskList tasks={data.assignedToMeTasks} emptyTitle="No assigned tasks" />
              </div>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="My projects" value={data.totalProjects} />
            <StatCard label="Assigned to me" value={data.tasksAssignedToMe} />
            <StatCard label="Due soon" value={data.dueSoonCount} />
            <StatCard label="Overdue" value={data.overdueCount} accent />
            <StatCard label="Completed" value={data.completedAssignedCount} />
          </div>

          <Card>
            <CardTitle>My assigned tasks</CardTitle>
            <div className="mt-4">
              <TaskList tasks={data.assignedToMeTasks} emptyTitle="No assigned tasks" />
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle>Due soon & overdue</CardTitle>
              <div className="mt-4">
                <TaskList tasks={dueSoonOverdue} emptyTitle="Nothing urgent" />
              </div>
            </Card>
            <Card>
              <CardTitle>My work status</CardTitle>
              <div className="mt-4">
                <StatusBars distribution={data.statusDistribution} />
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle>Project progress</CardTitle>
            <div className="mt-4 space-y-4">
              {data.projectProgress.length === 0 ? (
                <EmptyState title="No projects yet" />
              ) : (
                data.projectProgress.map((p) => (
                  <div key={p.projectId}>
                    <div className="flex items-center justify-between text-sm">
                      <Link
                        href={`/projects/${p.projectId}`}
                        prefetch
                        className="font-medium text-sky-300 hover:text-sky-200"
                      >
                        {p.name}
                      </Link>
                      <span className="text-slate-400">
                        {p.doneTasks}/{p.totalTasks}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className={accent && value > 0 ? "border-rose-500/30 bg-rose-950/25" : ""}>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
    </Card>
  );
}
