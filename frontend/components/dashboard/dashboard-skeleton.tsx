export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04] lg:col-span-2" />
        <div className="h-56 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
        <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
      </div>
    </div>
  );
}
