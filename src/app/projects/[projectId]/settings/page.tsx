"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, TextArea } from "@/components/FormControls";
import { RoleBadge } from "@/components/Badges";
import { Card, CardDescription, CardTitle } from "@/components/Card";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
};

type ProjectPayload = {
  id: string;
  name: string;
  description: string | null;
  members: Member[];
};

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
    const json = (await res.json()) as {
      error?: string;
      project?: ProjectPayload;
      myRole?: string;
    };
    if (!res.ok) {
      setError(json.error || "Failed to load");
      setProject(null);
      return;
    }
    const p = json.project;
    if (p) {
      setProject(p);
      setName(p.name);
      setDescription(p.description ?? "");
    }
    setMyRole(json.myRole ?? null);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    if (myRole !== "ADMIN") return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          description: description.trim() === "" ? null : description,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not save");
        setSaving(false);
        return;
      }
      setMsg("Project updated.");
      await load();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (myRole !== "ADMIN") return;
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not add member");
        return;
      }
      setInviteEmail("");
      setMsg("Member added.");
      await load();
    } catch {
      setError("Something went wrong");
    }
  }

  async function updateRole(memberId: string, role: string) {
    if (myRole !== "ADMIN") return;
    setError(null);
    setMsg(null);
    const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not update role");
      return;
    }
    setMsg("Role updated.");
    await load();
  }

  async function removeMember(memberId: string) {
    if (myRole !== "ADMIN") return;
    if (!confirm("Remove this member from the project?")) return;
    setError(null);
    setMsg(null);
    const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not remove");
      return;
    }
    setMsg("Member removed.");
    await load();
  }

  async function deleteProject() {
    if (myRole !== "ADMIN") return;
    if (!confirm("Delete this project and all tasks? This cannot be undone.")) return;
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Could not delete");
      return;
    }
    router.push("/projects");
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (error && !project) {
    return <p className="text-rose-400">{error}</p>;
  }

  if (!project) return null;

  if (myRole !== "ADMIN") {
    return (
      <div className="space-y-4">
        <p className="text-slate-300">Only project admins can manage settings.</p>
        <Link href={`/projects/${projectId}`} className="text-sky-400 hover:underline">
          Back to project
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Project settings</h1>
          <p className="mt-1 text-slate-400">{project.name}</p>
        </div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
        >
          Back
        </Link>
      </div>

      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <Card>
        <CardTitle>Details</CardTitle>
        <CardDescription>Update how this project appears to the team.</CardDescription>
        <form onSubmit={(e) => void saveProject(e)} className="mt-6 space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Invite member</CardTitle>
        <CardDescription>Add an existing user by their account email.</CardDescription>
        <form onSubmit={(e) => void inviteMember(e)} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              label="Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="sm:pt-6">
            <Button type="submit">Add member</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Members</CardTitle>
        <CardDescription>Manage roles or remove access.</CardDescription>
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-800/80">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {project.members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{m.user.name}</div>
                    <div className="text-xs text-slate-500">{m.user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <RoleBadge role={m.role} />
                      <select
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                        value={m.role}
                        onChange={(e) => void updateRole(m.id, e.target.value)}
                        aria-label={`Change role for ${m.user.name}`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button type="button" variant="ghost" onClick={() => void removeMember(m.id)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-rose-900/40 bg-rose-950/10">
        <CardTitle>Danger zone</CardTitle>
        <CardDescription>Permanently delete this project and all related tasks.</CardDescription>
        <Button type="button" variant="danger" className="mt-4" onClick={() => void deleteProject()}>
          Delete project
        </Button>
      </Card>
    </div>
  );
}
