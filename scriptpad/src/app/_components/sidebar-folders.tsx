"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { api } from "~/trpc/react";
import { useSidebarStore } from "~/stores/sidebar-store";

export function SidebarFolders() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();
  const { data, isLoading } = api.folders.list.useQuery();

  return (
    <div className="mt-4">
      {/* Section header */}
      <div
        className={[
          "flex items-center py-1 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase",
          "max-md:gap-2 max-md:px-3",
          "md:justify-center md:px-0",
          isCollapsed ? "" : "lg:justify-start lg:gap-2 lg:px-3",
        ].join(" ")}
      >
        <FolderOpen size={14} className="shrink-0" />
        <span
          className={[
            "hidden max-md:inline",
            isCollapsed ? "" : "lg:inline",
          ].join(" ")}
        >
          Folders
        </span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-1 flex flex-col gap-1 px-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-md bg-[var(--color-surface)]"
            />
          ))}
        </div>
      )}

      {/* Folder list */}
      {data && (
        <div className="mt-1 flex flex-col gap-0.5">
          {data.folders.map((folder) => {
            const isActive = pathname === `/folder/${folder.id}`;
            return (
              <Link
                key={folder.id}
                href={`/folder/${folder.id}`}
                className={[
                  "group relative flex items-center rounded-lg text-sm transition-colors",
                  "max-md:justify-between max-md:px-3 max-md:py-1.5",
                  "md:justify-center md:p-2",
                  isCollapsed
                    ? ""
                    : "lg:justify-between lg:px-3 lg:py-1.5",
                  isActive
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
                ].join(" ")}
              >
                {/* Expanded: folder name */}
                <span
                  className={[
                    "hidden truncate max-md:inline",
                    isCollapsed ? "" : "lg:inline",
                  ].join(" ")}
                >
                  {folder.name}
                </span>
                {/* Collapsed/tablet: folder icon */}
                <FolderOpen
                  size={16}
                  className={[
                    "hidden shrink-0",
                    isCollapsed ? "md:block" : "max-lg:block",
                  ].join(" ")}
                />
                {/* Expanded: script count */}
                <span
                  className={[
                    "hidden text-xs text-[var(--color-text-muted)] max-md:inline",
                    isCollapsed ? "" : "lg:inline",
                  ].join(" ")}
                >
                  ({folder.scriptCount})
                </span>
                {/* Tooltip */}
                <span
                  className={[
                    "pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text-primary)] shadow-lg",
                    isCollapsed
                      ? "md:group-hover:block"
                      : "max-lg:group-hover:block",
                  ].join(" ")}
                >
                  {folder.name} ({folder.scriptCount})
                </span>
              </Link>
            );
          })}

          {/* Uncategorized */}
          {data.uncategorizedCount > 0 && (
            <div
              className={[
                "group relative flex items-center rounded-lg text-sm text-[var(--color-text-muted)]",
                "max-md:justify-between max-md:px-3 max-md:py-1.5",
                "md:justify-center md:p-2",
                isCollapsed
                  ? ""
                  : "lg:justify-between lg:px-3 lg:py-1.5",
              ].join(" ")}
            >
              {/* Collapsed/tablet: folder icon */}
              <FolderOpen
                size={16}
                className={[
                  "hidden shrink-0",
                  isCollapsed ? "md:block" : "max-lg:block",
                ].join(" ")}
              />
              <span
                className={[
                  "hidden truncate max-md:inline",
                  isCollapsed ? "" : "lg:inline",
                ].join(" ")}
              >
                Uncategorized
              </span>
              <span
                className={[
                  "hidden text-xs max-md:inline",
                  isCollapsed ? "" : "lg:inline",
                ].join(" ")}
              >
                ({data.uncategorizedCount})
              </span>
              {/* Tooltip */}
              <span
                className={[
                  "pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text-primary)] shadow-lg",
                  isCollapsed
                    ? "md:group-hover:block"
                    : "max-lg:group-hover:block",
                ].join(" ")}
              >
                Uncategorized ({data.uncategorizedCount})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
