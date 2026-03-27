"use client";

import { FileText, Search, Filter } from "lucide-react";

type EmptyStateVariant = "no-scripts" | "no-results" | "no-status";

interface EmptyStateProps {
  variant: EmptyStateVariant;
  statusLabel?: string;
}

const EMPTY_STATES: Record<
  EmptyStateVariant,
  {
    icon: typeof FileText;
    title: string;
    description: string | ((label?: string) => string);
  }
> = {
  "no-scripts": {
    icon: FileText,
    title: "No scripts yet",
    description:
      "Tap the + button to create your first script and start writing.",
  },
  "no-results": {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search terms or clearing your filters.",
  },
  "no-status": {
    icon: Filter,
    title: "No scripts here",
    description: (label) =>
      `You don't have any scripts with "${label ?? "this"}" status yet.`,
  },
};

export function EmptyState({ variant, statusLabel }: EmptyStateProps) {
  const config = EMPTY_STATES[variant];
  const Icon = config.icon;
  const description =
    typeof config.description === "function"
      ? config.description(statusLabel)
      : config.description;

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
        <Icon size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
        {config.title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}
