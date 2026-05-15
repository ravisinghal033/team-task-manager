export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-700/50 bg-[#131b2e]/80 p-5 shadow-card backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight text-slate-100">{children}</h2>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-slate-400">{children}</p>;
}
