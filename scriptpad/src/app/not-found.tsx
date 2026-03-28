import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <p className="mb-2 text-7xl font-bold text-[var(--color-text-muted)] opacity-40">
        404
      </p>
      <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
      >
        Go back home
      </Link>
    </div>
  );
}
