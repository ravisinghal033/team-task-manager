export type SortableTask = {
  id: string;
  status: string;
  priority: string;
  dueDate: string | null;
  overdue?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

const priorityRank: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const statusRank: Record<string, number> = { IN_PROGRESS: 0, TODO: 1, DONE: 9 };

export function sortTasksForDisplay<T extends SortableTask>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = Boolean(a.overdue) && a.status !== "DONE";
    const bOverdue = Boolean(b.overdue) && b.status !== "DONE";
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    const pa = priorityRank[a.priority] ?? 2;
    const pb = priorityRank[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;

    if (a.dueDate && b.dueDate) {
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (diff !== 0) return diff;
    } else if (a.dueDate && !b.dueDate) return -1;
    else if (!a.dueDate && b.dueDate) return 1;

    const sa = statusRank[a.status] ?? 5;
    const sb = statusRank[b.status] ?? 5;
    if (sa !== sb) return sa - sb;

    const aT = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bT = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bT - aT;
  });
}
