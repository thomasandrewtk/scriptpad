"use client";

import { api } from "~/trpc/react";

type ScriptStatus = "idea" | "writing" | "ready" | "posted";
type ActiveStatus = ScriptStatus | "all";

interface StatusTabsProps {
  activeStatus: ActiveStatus;
  onStatusChange: (status: ActiveStatus) => void;
}

const TABS: { key: ActiveStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "idea", label: "Idea" },
  { key: "writing", label: "Writing" },
  { key: "ready", label: "Ready" },
  { key: "posted", label: "Posted" },
];

const STATUS_DOT_COLORS: Record<ScriptStatus, string> = {
  idea: "#6B7280",
  writing: "#F59E0B",
  ready: "#10B981",
  posted: "#6366F1",
};

export function StatusTabs({ activeStatus, onStatusChange }: StatusTabsProps) {
  const { data: counts } = api.scripts.statusCounts.useQuery();

  return (
    <div className="flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = activeStatus === tab.key;
        const count =
          counts?.[tab.key as keyof typeof counts] ?? 0;

        return (
          <button
            key={tab.key}
            onClick={() => onStatusChange(tab.key)}
            className={[
              "flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
            ].join(" ")}
          >
            {tab.key !== "all" && (
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_DOT_COLORS[tab.key] }}
              />
            )}
            {tab.label}
            <span
              className={[
                "ml-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 font-mono text-xs",
                isActive
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]",
              ].join(" ")}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
