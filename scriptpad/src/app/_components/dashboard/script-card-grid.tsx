"use client";

export function ScriptCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}

export function ScriptCardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          {/* Status badge + date */}
          <div className="flex items-center justify-between">
            <div className="h-5 w-16 rounded-full bg-[var(--color-surface-elevated)]" />
            <div className="h-4 w-20 rounded bg-[var(--color-surface-elevated)]" />
          </div>
          {/* Title */}
          <div className="mt-4 h-5 w-3/4 rounded bg-[var(--color-surface-elevated)]" />
          {/* Preview lines */}
          <div className="mt-3 space-y-2">
            <div className="h-3.5 w-full rounded bg-[var(--color-surface-elevated)]" />
            <div className="h-3.5 w-full rounded bg-[var(--color-surface-elevated)]" />
            <div className="h-3.5 w-2/3 rounded bg-[var(--color-surface-elevated)]" />
          </div>
          {/* Tags + folder */}
          <div className="mt-4 flex items-center gap-2">
            <div className="h-5 w-14 rounded-full bg-[var(--color-surface-elevated)]" />
            <div className="h-5 w-14 rounded-full bg-[var(--color-surface-elevated)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
