const FEATURES = [
  "Project and team management",
  "Project-level Admin/Member access",
  "Task status and overdue tracking",
] as const;

export function AuthLayout({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden border-r border-slate-800/80 bg-slate-900/40 px-10 py-12 lg:flex lg:flex-col lg:justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10" />
          <div className="relative mx-auto max-w-md">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-400">
              Ethara WorkBoard
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              Organize AI operations work with clarity.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              Track projects, assign tasks, manage roles, and monitor delivery progress in one
              place.
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-10 text-xs text-slate-500">
              Project, task, and team tracking for AI operations.
            </p>
          </div>
        </section>

        <section className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="mb-8 lg:hidden">
            <p className="text-lg font-semibold text-sky-300">Ethara WorkBoard</p>
            <p className="mt-1 text-sm text-slate-500">
              Project, task, and team tracking for AI operations.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">{children}</div>
          {footer ? <div className="mx-auto mt-6 w-full max-w-md">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}
