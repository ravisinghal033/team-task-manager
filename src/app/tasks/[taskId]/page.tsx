"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, TextArea, SelectField } from "@/components/FormControls";
import { Card, CardDescription, CardTitle } from "@/components/Card";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/Badges";

type TaskPayload = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  assignee: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
  overdue?: boolean;
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<TaskPayload | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; user: { id: string; name: string } }>>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [due, setDue] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  async function load() {
    setError(null);
    const [tRes, meRes] = await Promise.all([
      fetch(`/api/tasks/${taskId}`, { credentials: "include" }),
      fetch("/api/auth/me", { credentials: "include" }),
    ]);
    const tJson = (await tRes.json()) as {
      error?: string;
      task?: TaskPayload;
      myRole?: string;
    };
    if (!tRes.ok) {
      setError(tJson.error || "Not found");
      setTask(null);
      return;
    }
    const t = tJson.task;
    if (t) {
      setTask(t);
      setMyRole(tJson.myRole ?? null);
      setTitle(t.title);
      setDescription(t.description ?? "");
      setStatus(t.status);
      setPriority(t.priority);
      setDue(
        t.dueDate
          ? (() => {
              const d = new Date(t.dueDate);
              const pad = (n: number) => String(n).padStart(2, "0");
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            })()
          : "",
      );
      setAssigneeId(t.assigneeId ?? "");
    }

    if (meRes.ok) {
      const u = (await meRes.json()) as { user: { id: string } };
      setMeId(u.user.id);
    }

    if (t) {
      const mRes = await fetch(`/api/projects/${t.projectId}/members`, {
        credentials: "include",
      });
      const mJson = (await mRes.json()) as {
        members?: Array<{ id: string; user: { id: string; name: string } }>;
      };
      setMembers(mJson.members ?? []);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const isAdmin = myRole === "ADMIN";
  const isAssignee = task?.assigneeId != null && task.assigneeId === meId;

  async function saveAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !task) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description: description.trim() === "" ? null : description,
          status,
          priority,
          dueDate: due ? new Date(due).toISOString() : null,
          assigneeId: assigneeId === "" ? null : assigneeId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not save");
        setSaving(false);
        return;
      }
      await load();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function saveMemberStatus(next: string) {
    if (!task || !isAssignee) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not update status");
        setSaving(false);
        return;
      }
      setStatus(next);
      await load();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask() {
    if (!isAdmin) return;
    if (!confirm("Delete this task permanently?")) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Could not delete");
      return;
    }
    if (task) router.push(`/projects/${task.projectId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-400">
        Loading task…
      </div>
    );
  }

  if (error || !task) {
    return <p className="text-rose-400">{error || "Task not found"}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/projects/${task.projectId}`}
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            ← Back to project
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{task.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.overdue ? <OverdueBadge /> : null}
          </div>
        </div>
      </div>

      <Card>
        <CardTitle>Summary</CardTitle>
        <CardDescription>Created by {task.createdBy.name}</CardDescription>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Assignee</dt>
            <dd className="text-slate-200">{task.assignee?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Due</dt>
            <dd className="text-slate-200">
              {task.dueDate ? new Date(task.dueDate).toLocaleString() : "None"}
            </dd>
          </div>
        </dl>
        {task.description ? (
          <p className="mt-4 whitespace-pre-wrap text-slate-300">{task.description}</p>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No description.</p>
        )}
      </Card>

      {isAssignee && !isAdmin ? (
        <Card>
          <CardTitle>Your status</CardTitle>
          <CardDescription>As the assignee, you may only move this task across statuses.</CardDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant={status === s ? "primary" : "secondary"}
                disabled={saving}
                onClick={() => void saveMemberStatus(s)}
              >
                {s.replace("_", " ")}
              </Button>
            ))}
          </div>
          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        </Card>
      ) : null}

      {isAdmin ? (
        <Card>
          <CardTitle>Edit task</CardTitle>
          <CardDescription>Admins can change every field, including assignment.</CardDescription>
          <form onSubmit={(e) => void saveAdmin(e)} className="mt-6 space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextArea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </SelectField>
              <SelectField
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </SelectField>
            </div>
            <Input
              label="Due date (local)"
              type="datetime-local"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
            <SelectField
              label="Assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
            </SelectField>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="danger" onClick={() => void deleteTask()}>
                Delete task
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {!isAdmin && !isAssignee ? (
        <p className="text-sm text-slate-500">
          You can view this task because you are a project member. Only admins can edit fields, and
          only the assignee can update status.
        </p>
      ) : null}
    </div>
  );
}
