"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, TextArea, SelectField } from "@/components/FormControls";
import { Card, CardDescription, CardTitle } from "@/components/Card";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
};

export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [due, setDue] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/members`, { credentials: "include" }),
          fetch(`/api/projects/${projectId}`, { credentials: "include" }),
        ]);
        const mJson = (await mRes.json()) as { members?: Member[] };
        const pJson = (await pRes.json()) as { myRole?: string; error?: string };
        if (!cancelled) {
          setMembers(mJson.members ?? []);
          setMyRole(pJson.myRole ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (myRole !== "ADMIN") return;
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title,
        description: description.trim() === "" ? null : description,
        status,
        priority,
        dueDate: due ? new Date(due).toISOString() : null,
        assigneeId: assigneeId === "" ? null : assigneeId,
      };
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; task?: { id: string } };
      if (!res.ok) {
        setError(data.error || "Could not create task");
        setSubmitting(false);
        return;
      }
      if (data.task) router.push(`/tasks/${data.task.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (myRole !== "ADMIN") {
    return (
      <div className="space-y-4">
        <p className="text-slate-300">Only admins can create tasks.</p>
        <Link href={`/projects/${projectId}`} className="text-sky-400 hover:underline">
          Back to project
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">New task</h1>
        <p className="mt-1 text-slate-400">Assign work to teammates who are already on this project.</p>
      </div>
      <Card>
        <CardTitle>Task details</CardTitle>
        <CardDescription>Required fields are validated on the server.</CardDescription>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
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
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create task"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
