"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PriorityBadge, StatusBadge, OverdueBadge } from "@/components/Badges";
import { Card, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/FormControls";
import { formatDueDate } from "@/lib/format-date";
import { apiFetch } from "@/lib/client-fetch";

type TaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  overdue?: boolean;
  project: { id: string; name: string };
  kind?: string;
};

type NotificationsPayload = {
  notifications: TaskItem[];
  assignedToMe: TaskItem[];
  dueSoon: TaskItem[];
  overdue: TaskItem[];
};

function kindLabel(kind?: string) {
  switch (kind) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    case "assigned":
      return "Assigned to you";
    case "unassigned":
      return "Unassigned";
    default:
      return "Alert";
  }
}

function TaskSection({
  title,
  tasks,
  emptyTitle,
}: {
  title: string;
  tasks: TaskItem[];
  emptyTitle: string;
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {tasks.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={emptyTitle} />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-700/50">
          {tasks.map((t) => (
            <li key={`${title}-${t.id}-${t.kind ?? ""}`} className="py-3">
              <Link href={`/tasks/${t.id}`} className="block rounded-lg transition hover:bg-slate-800/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-100 hover:text-sky-300">{t.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{t.project.name}</p>
                    {t.kind ? (
                      <p className="mt-1 text-xs font-medium text-sky-400/90">{kindLabel(t.kind)}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    {t.overdue ? <OverdueBadge /> : null}
                    {t.dueDate ? (
                      <span className="text-xs text-slate-500">Due {formatDueDate(t.dueDate)}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    try {
      const res = await apiFetch("/api/notifications", { signal });
      const json = (await res.json()) as { error?: string } & Partial<NotificationsPayload>;
      if (!mountedRef.current) return;
      if (!res.ok) {
        setError(json.error || "Notifications could not load. Please retry.");
        setData(null);
        return;
      }
      setData({
        notifications: json.notifications ?? [],
        assignedToMe: json.assignedToMe ?? [],
        dueSoon: json.dueSoon ?? [],
        overdue: json.overdue ?? [],
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (mountedRef.current) {
        setError("Notifications could not load. Please retry.");
        setData(null);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();
    setLoading(true);
    void load(ac.signal);
    return () => {
      mountedRef.current = false;
      ac.abort();
    };
  }, [load]);

  if (loading && !data) {
    return <LoadingScreen label="Loading notifications…" />;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-8 text-center">
        <p className="text-slate-200">{error || "Notifications could not load. Please retry."}</p>
        <Button className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Notifications</h1>
        <p className="mt-1 text-slate-400">Task alerts from your projects — assigned, due soon, and overdue.</p>
      </div>

      <TaskSection title="All alerts" tasks={data.notifications} emptyTitle="You are all caught up." />
      <TaskSection title="Assigned to me" tasks={data.assignedToMe} emptyTitle="No assigned tasks." />
      <TaskSection title="Due soon" tasks={data.dueSoon} emptyTitle="Nothing due in the next 7 days." />
      <TaskSection title="Overdue" tasks={data.overdue} emptyTitle="No overdue tasks." />
    </div>
  );
}
