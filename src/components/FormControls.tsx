export function Button({
  children,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-500/60 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary: "bg-sky-500 text-slate-950 hover:bg-sky-400",
    secondary: "border border-slate-600/60 bg-[#131b2e] text-slate-100 hover:bg-slate-800/80",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    ghost: "text-slate-300 hover:bg-slate-800/80",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-600/60 bg-[#0f1628] px-3 py-2 text-sm text-slate-100 outline-none ring-sky-500/40 placeholder:text-slate-500 focus:border-sky-500/60 focus:ring-2"
        {...props}
      />
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <textarea
        className="min-h-[100px] w-full rounded-xl border border-slate-600/60 bg-[#0f1628] px-3 py-2 text-sm text-slate-100 outline-none ring-sky-500/40 placeholder:text-slate-500 focus:border-sky-500/60 focus:ring-2"
        {...props}
      />
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <select
        className="w-full rounded-xl border border-slate-600/60 bg-[#0f1628] px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40"
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}
