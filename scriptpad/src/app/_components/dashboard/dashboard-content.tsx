"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { StatusTabs } from "./status-tabs";
import { SortControls, type SortByOption } from "./sort-controls";
import { ScriptCard, type ScriptCardData } from "./script-card";
import { ScriptCardGrid, ScriptCardGridSkeleton } from "./script-card-grid";
import { ScriptCardContextMenu } from "./script-card-context-menu";
import { EmptyState } from "./empty-state";

type ScriptStatus = "idea" | "writing" | "ready" | "posted";
type ActiveStatus = ScriptStatus | "all";

interface DashboardContentProps {
  folderId?: string;
  tagId?: string;
}

export function DashboardContent({ folderId, tagId }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? undefined;

  const [activeStatus, setActiveStatus] = useState<ActiveStatus>("all");
  const [sortBy, setSortBy] = useState<SortByOption>("createdAt");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    scriptId: string;
  } | null>(null);

  const sortOrder = sortBy === "postDate" ? "asc" : "desc";

  const { data: scripts, isLoading } = api.scripts.list.useQuery({
    status: activeStatus === "all" ? undefined : activeStatus,
    folderId,
    tagId,
    search,
    sortBy,
    sortOrder,
  });

  const handleContextMenu = useCallback(
    (e: { x: number; y: number; scriptId: string }) => {
      setContextMenu(e);
    },
    [],
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Determine empty state variant
  const getEmptyVariant = ():
    | "no-scripts"
    | "no-results"
    | "no-status"
    | null => {
    if (!scripts || scripts.length > 0) return null;
    if (search) return "no-results";
    if (activeStatus !== "all") return "no-status";
    return "no-scripts";
  };

  const emptyVariant = getEmptyVariant();

  const STATUS_LABELS: Record<ScriptStatus, string> = {
    idea: "Idea",
    writing: "Writing",
    ready: "Ready",
    posted: "Posted",
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header: Status Tabs + Sort */}
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabs
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
        />
        <SortControls sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      {/* Content */}
      <div className="mt-8">
        {isLoading ? (
          <ScriptCardGridSkeleton />
        ) : emptyVariant ? (
          <EmptyState
            variant={emptyVariant}
            statusLabel={
              activeStatus !== "all"
                ? STATUS_LABELS[activeStatus]
                : undefined
            }
            searchQuery={search}
          />
        ) : (
          <ScriptCardGrid>
            {scripts!.map((script) => (
              <ScriptCard
                key={script.id}
                script={script as unknown as ScriptCardData}
                onContextMenu={handleContextMenu}
              />
            ))}
          </ScriptCardGrid>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ScriptCardContextMenu
          position={contextMenu}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}
