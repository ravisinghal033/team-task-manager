"use client";

import Link from "next/link";
import { SelectField } from "@/components/FormControls";
import { useProjectMembers } from "@/lib/use-project-members";

export function AssigneeSelect({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: string;
  onChange: (userId: string) => void;
}) {
  const { members, loading } = useProjectMembers(projectId);

  return (
    <div className="space-y-1.5">
      <SelectField
        label="Assignee"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.user.id}>
            {m.user.name} — {m.user.email}
          </option>
        ))}
      </SelectField>
      <p className="text-xs leading-relaxed text-slate-500">
        Only project members can be assigned. Add teammates in{" "}
        <Link
          href={`/projects/${projectId}/settings`}
          className="font-medium text-sky-400 hover:text-sky-300"
        >
          Project Settings
        </Link>
        .
      </p>
    </div>
  );
}
