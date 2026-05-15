const statusStyles: Record<string, string> = {
  TODO: "bg-slate-700/80 text-slate-200 ring-1 ring-slate-600",
  IN_PROGRESS: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40",
  DONE: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-800 text-slate-400 ring-1 ring-slate-700",
  MEDIUM: "bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/30",
  HIGH: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/40",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? "bg-slate-800 text-slate-300"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyles[priority] ?? "bg-slate-800"}`}
    >
      {priority}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-rose-600/90 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
      Overdue
    </span>
  );
}
