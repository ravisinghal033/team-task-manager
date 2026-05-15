"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/client-fetch";

export type ProjectMemberRow = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
};

export function useProjectMembers(projectId: string) {
  const pathname = usePathname();
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/members`);
      const json = (await res.json()) as { error?: string; members?: ProjectMemberRow[] };
      if (!res.ok) {
        setError(json.error || "Failed to load members");
        setMembers([]);
        return;
      }
      setMembers(json.members ?? []);
    } catch {
      setError("Failed to load members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload, pathname]);

  return { members, loading, error, reload };
}
