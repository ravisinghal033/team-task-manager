/** Readable due date: May 20, 2026 or May 20, 2026, 05:30 PM */
export function formatDueDate(iso: string | null | undefined): string {
  if (!iso) return "None";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "None";

  const dateOpts: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };

  const isMidnight =
    d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;

  if (isMidnight) {
    return d.toLocaleDateString("en-US", dateOpts);
  }

  return d.toLocaleString("en-US", {
    ...dateOpts,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
