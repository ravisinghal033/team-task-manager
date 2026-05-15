"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/client-fetch";
import { StatusBadge, PriorityBadge, OverdueBadge, RoleBadge } from "@/components/Badges";
import { Card, CardDescription, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { formatDueDate } from "@/lib/format-date";
import { sortTasksForDisplay } from "@/lib/task-sort";

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
  createdBy: { id: string; name: string; email: string };
  overdue?: boolean;
};

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading project…" />}>
      <ProjectDetailContent />
    </Suspense>
  );
}

function ProjectDetailContent() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const assignedBanner = searchParams.get("assigned") === "1";

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
  const [titleSearch, setTitleSearch] = useState("");

  const taskQuery = useMemo(() => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (assignee) qs.set("assigneeId", assignee);
    if (priority) qs.set("priority", priority);
    if (overdueOnly) qs.set("overdue", "true");
    const s = qs.toString();
    return s ? `?${s}` : "";
  }, [status, assignee, priority, overdueOnly]);

  const filteredTasks = useMemo(() => {
    const q = titleSearch.trim().toLowerCase();
    const base = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)) : tasks;
    return sortTasksForDisplay(base);
  }, [tasks, titleSearch]);

  const loadProject = useCallback(async () => {
    setLoadingProject(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/projects/${projectId}`);
      const json = (await res.json()) as {
        error?: string;
        project?: ProjectPayload;
        myRole?: string;
      };
      if (!res.ok) {
        setError(json.error || "Failed to load project");
        setProject(null);
        return;
      }
      setProject(json.project ?? null);
      setMyRole(json.myRole ?? null);
    } catch {
      setError("Failed to load project");
      setProject(null);
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/tasks${taskQuery}`);
      const json = (await res.json()) as { error?: string; tasks?: TaskRow[] };
      setTasks(res.ok ? (json.tasks ?? []) : []);
    } catch {
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [projectId, taskQuery]);

  useEffect(() => {
    void loadProject();
  }, [loadProject, pathname]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks, pathname]);

  if (loadingProject) {
    return <LoadingScreen label="Loading project…" />;
  }

  if (error || !project) {
    return <p className="text-rose-400">{error || "Project not found"}</p>;
  }

  const isAdmin = myRole === "ADMIN";
  const hasApiFilters = Boolean(status || assignee || priority || overdueOnly);

  return (
    <div className="space-y-6">
      {assignedBanner ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          Task assigned successfully.
        </p>
      ) : null}
      <section className="rounded-2xl border border-slate-700/50 bg-[#131b2e]/80 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {project.name}
              </h1>
              {myRole ? <RoleBadge role={myRole} /> : null}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            {project.description || "No description yet."}
          </p>
          <p className="mt-2 text-sm text-slate-500">{project.taskCount} tasks</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <>
              <Link
                href={`/projects/${projectId}/tasks/new`}
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                New task
              </Link>
              <Link
                href={`/projects/${projectId}/settings`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
              >
                Settings
              </Link>
            </>
          ) : null}
        </div>
        </div>
      </section>

      <Card className="!p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {project.members.map((m) => (
            <li
              key={m.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3 py-1 text-xs text-slate-200"
            >
              <span className="font-medium">{m.user.name}</span>
              <RoleBadge role={m.role} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Filter and search tasks in this project.</CardDescription>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm text-slate-400 sm:col-span-2 lg:col-span-1">
            Search title
            <input
              type="search"
              placeholder="Filter by title…"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600"
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
            />
          </label>
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
          <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm text-slate-300 lg:pt-0 lg:items-end lg:pb-2">
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
          ) : filteredTasks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={hasApiFilters || titleSearch ? "No matching tasks" : "No tasks yet"}
                description={
                  hasApiFilters || titleSearch
                    ? "Try adjusting filters or search."
                    : "Create the first task for this project."
                }
                action={
                  isAdmin && !hasApiFilters && !titleSearch ? (
                    <Link
                      href={`/projects/${projectId}/tasks/new`}
                      className="text-sm font-medium text-sky-400 hover:text-sky-300"
                    >
                      New task →
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Priority</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Assignee</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Created by</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/20">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tasks/${t.id}`}
                        className="font-medium text-sky-300 hover:text-sky-200"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-slate-200">{t.assignee?.name ?? "Unassigned"}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                      {t.createdBy.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-400">
                          {t.dueDate ? formatDueDate(t.dueDate) : "—"}
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
