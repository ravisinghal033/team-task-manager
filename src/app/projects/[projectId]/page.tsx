"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/Card";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/Badges";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
};

type ProjectPayload = {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
  members: Member[];
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
  overdue?: boolean;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const taskQuery = useMemo(() => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (assignee) qs.set("assigneeId", assignee);
    if (priority) qs.set("priority", priority);
    if (overdueOnly) qs.set("overdue", "true");
    const s = qs.toString();
    return s ? `?${s}` : "";
  }, [status, assignee, priority, overdueOnly]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProject(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
        const json = (await res.json()) as {
          error?: string;
          project?: ProjectPayload;
          myRole?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(json.error || "Failed to load project");
          return;
        }
        if (!cancelled) {
          setProject(json.project ?? null);
          setMyRole(json.myRole ?? null);
        }
      } catch {
        if (!cancelled) setError("Failed to load project");
      } finally {
        if (!cancelled) setLoadingProject(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTasks(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks${taskQuery}`, {
          credentials: "include",
        });
        const json = (await res.json()) as { error?: string; tasks?: TaskRow[] };
        if (!res.ok) {
          if (!cancelled) setTasks([]);
          return;
        }
        if (!cancelled) setTasks(json.tasks ?? []);
      } catch {
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, taskQuery]);

  if (loadingProject) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-400">
        Loading project…
      </div>
    );
  }

  if (error || !project) {
    return <p className="text-rose-400">{error || "Project not found"}</p>;
  }

  const isAdmin = myRole === "ADMIN";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-400/90">Project</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            {project.description || "No description yet."}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {project.taskCount} tasks · You are {myRole}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <>
              <Link
                href={`/projects/${projectId}/tasks/new`}
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              >
                New task
              </Link>
              <Link
                href={`/projects/${projectId}/settings`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              >
                Settings
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <Card>
        <CardTitle>Team</CardTitle>
        <CardDescription>Members with access to this project.</CardDescription>
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.members.map((m) => (
            <li
              key={m.id}
              className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs text-slate-200"
            >
              <span className="font-medium">{m.user.name}</span>
              <span className="text-slate-500"> · {m.role}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Filter the backlog without leaving the page.</CardDescription>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-400">
            Status
            <select
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </label>
          <label className="text-sm text-slate-400">
            Assignee
            <select
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">All</option>
              <option value="me">Assigned to me</option>
              {project.members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-400">
            Priority
            <select
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900"
            />
            Overdue only
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-800/80">
          {loadingTasks ? (
            <div className="p-8 text-center text-slate-500">Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No tasks match these filters.
              {isAdmin ? (
                <>
                  {" "}
                  <Link href={`/projects/${projectId}/tasks/new`} className="text-sky-400 hover:underline">
                    Create the first task
                  </Link>
                </>
              ) : null}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Assignee</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/20">
                    <td className="px-4 py-3">
                      <Link href={`/tasks/${t.id}`} className="font-medium text-sky-300 hover:text-sky-200">
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="hidden px-4 py-3 text-slate-400 md:table-cell">
                      {t.assignee?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-400">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                        </span>
                        {t.overdue ? <OverdueBadge /> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
