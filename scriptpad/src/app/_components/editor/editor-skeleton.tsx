"use client";

export function EditorSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="h-8 w-24 animate-pulse rounded bg-[var(--color-surface)]" />
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-6 h-10 w-3/4 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="mb-4 h-6 w-1/2 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-[var(--color-surface)]" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--color-surface)]" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--color-surface)]" />
        </div>
      </div>
    </div>
  );
}
