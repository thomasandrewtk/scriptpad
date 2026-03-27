"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { Folder } from "lucide-react";
import { isWithinInterval, subDays, formatDistanceToNow, format } from "date-fns";
import { StatusBadge } from "./status-badge";

type ScriptStatus = "idea" | "writing" | "ready" | "posted";

interface ScriptTag {
  id: string;
  name: string;
  color: string;
}

export interface ScriptCardData {
  id: string;
  title: string;
  bodyPlainText: string | null;
  status: ScriptStatus;
  postDate: Date | null;
  createdAt: Date;
  tags: ScriptTag[];
  folderName: string | null;
}

interface ScriptCardProps {
  script: ScriptCardData;
  onContextMenu: (e: { x: number; y: number; scriptId: string }) => void;
}

function formatPostDate(date: Date): string {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const sevenDaysFromNow = subDays(now, -7);

  if (
    isWithinInterval(date, { start: sevenDaysAgo, end: sevenDaysFromNow })
  ) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, "MMM d, yyyy");
}

const MAX_VISIBLE_TAGS = 3;

export function ScriptCard({ script, onContextMenu }: ScriptCardProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu({ x: e.clientX, y: e.clientY, scriptId: script.id });
    },
    [onContextMenu, script.id],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      longPressTimer.current = setTimeout(() => {
        onContextMenu({
          x: touch.clientX,
          y: touch.clientY,
          scriptId: script.id,
        });
      }, 500);
    },
    [onContextMenu, script.id],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const visibleTags = script.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = script.tags.length - MAX_VISIBLE_TAGS;

  return (
    <Link
      href={`/script/${script.id}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      className="group block max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--color-border-light)] hover:shadow-lg hover:shadow-black/20"
    >
      {/* Top row: status + post date */}
      <div className="flex items-center justify-between">
        <StatusBadge status={script.status} />
        {script.postDate && (
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatPostDate(new Date(script.postDate))}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mt-3 line-clamp-1 text-base font-semibold text-[var(--color-text-primary)]">
        {script.title}
      </h3>

      {/* Body preview */}
      {script.bodyPlainText && (
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {script.bodyPlainText}
        </p>
      )}

      {/* Bottom: tags + folder */}
      {(script.tags.length > 0 || script.folderName) && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {visibleTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                color: tag.color,
                backgroundColor: `${tag.color}33`,
              }}
            >
              {tag.name}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">
              +{overflowCount} more
            </span>
          )}
          {script.folderName && (
            <>
              {script.tags.length > 0 && (
                <span className="mx-0.5 text-[var(--color-border-light)]">
                  &middot;
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Folder size={12} />
                {script.folderName}
              </span>
            </>
          )}
        </div>
      )}
    </Link>
  );
}
