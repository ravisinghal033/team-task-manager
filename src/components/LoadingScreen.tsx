import { BrandMark } from "@/components/BrandMark";

export function LoadingScreen({ label = "Loading workspace…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-slate-400">
      <div className="relative">
        <BrandMark className="h-12 w-12 animate-pulse" />
        <div className="absolute inset-0 rounded-lg ring-2 ring-sky-500/30 ring-offset-2 ring-offset-[#0c1222]" />
      </div>
      <p className="text-sm font-medium text-slate-300">{label}</p>
    </div>
  );
}
