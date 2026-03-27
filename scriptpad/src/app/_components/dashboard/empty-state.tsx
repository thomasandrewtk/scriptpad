"use client";

import { FileText, Search, Filter } from "lucide-react";

type EmptyStateVariant = "no-scripts" | "no-results" | "no-status";

interface EmptyStateProps {
  variant: EmptyStateVariant;
  statusLabel?: string;
  searchQuery?: string;
}

export function EmptyState({ variant, statusLabel, searchQuery }: EmptyStateProps) {
  const configs: Record<EmptyStateVariant, { icon: typeof FileText; title: string; description: string }> = {
    "no-scripts": {
      icon: FileText,
      title: "No scripts yet",
      description: "Hit the + button to capture your first idea.",
    },
    "no-results": {
      icon: Search,
      title: "No results found",
      description: searchQuery
        ? `No scripts match '${searchQuery}'. Try a different search or check your filters.`
        : "No scripts match your search. Try a different search or check your filters.",
    },
    "no-status": {
      icon: Filter,
      title: `No scripts in ${statusLabel ?? "this status"}`,
      description: "No scripts in " + (statusLabel ?? "this status") + ". Scripts will appear here as you move them along.",
    },
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
        <Icon size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
        {config.title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--color-text-muted)]">
        {config.description}
      </p>
    </div>
  );
}
