"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AssigneeSelect } from "@/components/AssigneeSelect";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button, Input, TextArea, SelectField } from "@/components/FormControls";
import { Card, CardDescription, CardTitle } from "@/components/Card";
import { apiFetch } from "@/lib/client-fetch";

export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [myRole, setMyRole] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [due, setDue] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch(`/api/projects/${projectId}`);
        const json = (await res.json()) as { myRole?: string; error?: string };
        if (!cancelled) setMyRole(json.myRole ?? null);
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
    setSuccess(null);
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
      const res = await apiFetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; task?: { id: string } };
      if (!res.ok) {
        setError(data.error || "Could not create task");
        return;
      }
      if (data.task) {
        const assigned = Boolean(assigneeId);
        if (assigned) {
          setSuccess("Task assigned successfully.");
          window.setTimeout(() => {
            router.push(`/projects/${projectId}?assigned=1`);
          }, 600);
        } else {
          router.push(`/tasks/${data.task.id}`);
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading task form…" />;
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
        <p className="mt-1 text-slate-400">Assign work to teammates on this project.</p>
      </div>
      <Card>
        <CardTitle>Task details</CardTitle>
        <CardDescription>Required fields are validated on the server.</CardDescription>
        {success ? <p className="mt-3 text-sm text-emerald-400">{success}</p> : null}
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
          <AssigneeSelect
            projectId={projectId}
            value={assigneeId}
            onChange={setAssigneeId}
          />
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
