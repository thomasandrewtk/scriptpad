"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Copy,
  Trash2,
  ArrowRight,
  ChevronRight,
  Folder,
  FolderX,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

type ScriptStatus = "idea" | "writing" | "ready" | "posted";

interface ContextMenuPosition {
  x: number;
  y: number;
  scriptId: string;
}

interface ScriptCardContextMenuProps {
  position: ContextMenuPosition;
  onClose: () => void;
}

const STATUSES: { key: ScriptStatus; label: string; color: string }[] = [
  { key: "idea", label: "Idea", color: "#6B7280" },
  { key: "writing", label: "Writing", color: "#F59E0B" },
  { key: "ready", label: "Ready", color: "#10B981" },
  { key: "posted", label: "Posted", color: "#6366F1" },
];

export function ScriptCardContextMenu({
  position,
  onClose,
}: ScriptCardContextMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<"status" | "folder" | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    position: "fixed",
    left: position.x,
    top: position.y,
    opacity: 0,
  });

  const utils = api.useUtils();
  const { data: foldersData } = api.folders.list.useQuery();

  const invalidateAll = useCallback(() => {
    void utils.scripts.list.invalidate();
    void utils.scripts.statusCounts.invalidate();
    void utils.folders.list.invalidate();
    void utils.tags.list.invalidate();
  }, [utils]);

  const updateStatus = api.scripts.updateStatus.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Status updated");
      onClose();
    },
    onError: () => toast.error("Failed to update status"),
  });

  const updateScript = api.scripts.update.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Moved to folder");
      onClose();
    },
    onError: () => toast.error("Failed to move script"),
  });

  const duplicateScript = api.scripts.duplicate.useMutation({
    onSuccess: (data) => {
      invalidateAll();
      toast.success("Script duplicated");
      onClose();
      router.push(`/script/${data.id}`);
    },
    onError: () => toast.error("Failed to duplicate script"),
  });

  const deleteScript = api.scripts.softDelete.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Script deleted");
      onClose();
    },
    onError: () => toast.error("Failed to delete script"),
  });

  // Viewport clamping
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let { x, y } = position;

    if (x + rect.width > window.innerWidth) {
      x = window.innerWidth - rect.width - 8;
    }
    if (y + rect.height > window.innerHeight) {
      y = window.innerHeight - rect.height - 8;
    }

    setMenuStyle({
      position: "fixed",
      left: Math.max(8, x),
      top: Math.max(8, y),
      opacity: 1,
    });
  }, [position]);

  // Close on Escape or click-outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const folders = foldersData?.folders ?? [];

  return createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="z-50 min-w-[180px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-xl shadow-black/30"
    >
      {/* Change Status */}
      <div
        className="relative"
        onMouseEnter={() => setSubmenu("status")}
        onMouseLeave={() => setSubmenu(null)}
      >
        <button className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]">
          <span className="flex items-center gap-2">
            <ArrowRight size={14} />
            Change Status
          </span>
          <ChevronRight size={14} />
        </button>
        {submenu === "status" && (
          <div className="absolute left-full top-0 z-50 ml-1 min-w-[150px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-xl shadow-black/30">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() =>
                  updateStatus.mutate({
                    id: position.scriptId,
                    status: s.key,
                  })
                }
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Move to Folder */}
      <div
        className="relative"
        onMouseEnter={() => setSubmenu("folder")}
        onMouseLeave={() => setSubmenu(null)}
      >
        <button className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]">
          <span className="flex items-center gap-2">
            <Folder size={14} />
            Move to Folder
          </span>
          <ChevronRight size={14} />
        </button>
        {submenu === "folder" && (
          <div className="absolute left-full top-0 z-50 ml-1 min-w-[150px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-xl shadow-black/30">
            <button
              onClick={() =>
                updateScript.mutate({
                  id: position.scriptId,
                  folderId: null,
                })
              }
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              <FolderX size={14} />
              No Folder
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() =>
                  updateScript.mutate({
                    id: position.scriptId,
                    folderId: folder.id,
                  })
                }
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              >
                <Folder size={14} />
                {folder.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="my-1 border-t border-[var(--color-border)]" />

      {/* Duplicate */}
      <button
        onClick={() => duplicateScript.mutate({ id: position.scriptId })}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
      >
        <Copy size={14} />
        Duplicate
      </button>

      {/* Delete */}
      <button
        onClick={() => deleteScript.mutate({ id: position.scriptId })}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>,
    document.body,
  );
}
