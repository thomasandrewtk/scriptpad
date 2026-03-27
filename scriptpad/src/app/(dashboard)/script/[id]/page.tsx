export default function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Script Editor
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Script editor coming in Phase 6.
        </p>
      </div>
    </div>
  );
}
