"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { DashboardContent } from "~/app/_components/dashboard/dashboard-content";
import { EmptyState } from "~/app/_components/dashboard/empty-state";

function TagPageContent() {
  const params = useParams<{ name: string }>();
  const tagName = decodeURIComponent(params.name);

  const { data: tags, isLoading } = api.tags.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-light)] border-t-[var(--color-accent)]" />
      </div>
    );
  }

  const tag = tags?.find(
    (t) => t.name.toLowerCase() === tagName.toLowerCase(),
  );

  if (!tag) {
    return <EmptyState variant="no-results" />;
  }

  return <DashboardContent tagId={tag.id} />;
}

export default function TagPage() {
  return (
    <Suspense>
      <TagPageContent />
    </Suspense>
  );
}
