"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag } from "lucide-react";
import { api } from "~/trpc/react";
import { useSidebarStore } from "~/stores/sidebar-store";

export function SidebarTags() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();
  const { data: tags, isLoading } = api.tags.list.useQuery();

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
        <Tag size={14} className="shrink-0" />
        <span
          className={[
            "hidden max-md:inline",
            isCollapsed ? "" : "lg:inline",
          ].join(" ")}
        >
          Tags
        </span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-1 flex flex-col gap-1 px-1">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-md bg-[var(--color-surface)]"
            />
          ))}
        </div>
      )}

      {/* Tag list */}
      {tags && (
        <div className="mt-1 flex flex-col gap-0.5">
          {tags.map((tag) => {
            const tagPath = `/tag/${encodeURIComponent(tag.name)}`;
            const isActive = pathname === tagPath;

            return (
              <Link
                key={tag.id}
                href={tagPath}
                className={[
                  "group relative flex items-center rounded-lg text-sm transition-colors",
                  "max-md:gap-2 max-md:px-3 max-md:py-1.5",
                  "md:justify-center md:p-2",
                  isCollapsed
                    ? ""
                    : "lg:justify-start lg:gap-2 lg:px-3 lg:py-1.5",
                  isActive
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
                ].join(" ")}
              >
                {/* Color dot */}
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span
                  className={[
                    "hidden flex-1 truncate max-md:inline",
                    isCollapsed ? "" : "lg:inline",
                  ].join(" ")}
                >
                  {tag.name}
                </span>
                <span
                  className={[
                    "hidden text-xs text-[var(--color-text-muted)] max-md:inline",
                    isCollapsed ? "" : "lg:inline",
                  ].join(" ")}
                >
                  ({tag.scriptCount})
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
                  {tag.name} ({tag.scriptCount})
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
