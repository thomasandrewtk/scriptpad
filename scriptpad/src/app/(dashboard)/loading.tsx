export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      {/* Skeleton status tabs */}
      <div className="mb-6 flex gap-2">
        {[80, 64, 72, 56].map((w, i) => (
          <div
            key={i}
            className="animate-pulse rounded-full bg-[var(--color-surface)]"
            style={{ width: w, height: 32 }}
          />
        ))}
      </div>

      {/* Skeleton card grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-[var(--color-surface)] p-5"
          >
            {/* Title */}
            <div className="mb-3 h-5 w-3/4 rounded bg-[var(--color-border)]" />
            {/* Body lines */}
            <div className="mb-2 h-3 w-full rounded bg-[var(--color-border)]" />
            <div className="mb-2 h-3 w-5/6 rounded bg-[var(--color-border)]" />
            <div className="mb-4 h-3 w-2/3 rounded bg-[var(--color-border)]" />
            {/* Footer row */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 rounded-full bg-[var(--color-border)]" />
              <div className="h-3 w-20 rounded bg-[var(--color-border)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
