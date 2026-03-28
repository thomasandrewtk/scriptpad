"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
      <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
      <p className="mb-6 max-w-md text-center text-sm text-[var(--color-text-muted)]">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
