"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, TextArea } from "@/components/FormControls";
import { Card, CardDescription, CardTitle } from "@/components/Card";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          description: description.trim() === "" ? null : description,
        }),
      });
      const data = (await res.json()) as { error?: string; project?: { id: string } };
      if (!res.ok) {
        setError(data.error || "Could not create project");
        setLoading(false);
        return;
      }
      if (data.project) router.push(`/projects/${data.project.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">New project</h1>
        <p className="mt-1 text-slate-400">You will be the project admin and can invite members by email.</p>
      </div>
      <Card>
        <CardTitle>Project details</CardTitle>
        <CardDescription>Give the team a clear name and optional context.</CardDescription>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create project"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
