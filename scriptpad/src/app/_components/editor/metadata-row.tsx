"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Folder,
  FolderX,
  Calendar,
  X,
  ChevronDown,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { TagPickerPopover } from "./tag-picker-popover";

interface MetadataRowProps {
  script: RouterOutputs["scripts"]["getById"];
  onMetadataChange: () => void;
  onImmediateSave: (fields: Record<string, unknown>) => void;
}

export function MetadataRow({
  script,
  onMetadataChange,
  onImmediateSave,
}: MetadataRowProps) {
  const [folderOpen, setFolderOpen] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const folderBtnRef = useRef<HTMLButtonElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);
  const tagBtnRef = useRef<HTMLButtonElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const { data: foldersData } = api.folders.list.useQuery();

  const updateScript = api.scripts.update.useMutation({
    onSuccess: () => onMetadataChange(),
    onError: () => toast.error("Failed to update"),
  });

  const removeTag = api.tags.removeFromScript.useMutation({
    onSuccess: () => onMetadataChange(),
    onError: () => toast.error("Failed to remove tag"),
  });

  const folders = foldersData?.folders ?? [];

  // Close folder dropdown on outside click / escape
  useEffect(() => {
    if (!folderOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFolderOpen(false);
    }
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        folderMenuRef.current &&
        !folderMenuRef.current.contains(target) &&
        folderBtnRef.current &&
        !folderBtnRef.current.contains(target)
      ) {
        setFolderOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [folderOpen]);

  const getFolderMenuPos = useCallback(() => {
    if (!folderBtnRef.current) return { top: 0, left: 0 };
    const rect = folderBtnRef.current.getBoundingClientRect();
    return { top: rect.bottom + 4, left: rect.left };
  }, []);

  function handleFolderSelect(folderId: string | null) {
    updateScript.mutate({ id: script.id, folderId });
    setFolderOpen(false);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    onImmediateSave({ postDate: value || null });
    onMetadataChange();
  }

  function handleClearDate() {
    onImmediateSave({ postDate: null });
    onMetadataChange();
    if (dateInputRef.current) {
      dateInputRef.current.value = "";
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Folder */}
      <div className="relative">
        <button
          ref={folderBtnRef}
          onClick={() => setFolderOpen(!folderOpen)}
          className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        >
          <Folder size={13} />
          <span>{script.folder?.name ?? "No folder"}</span>
          <ChevronDown size={12} />
        </button>

        {folderOpen &&
          createPortal(
            <div
              ref={folderMenuRef}
              className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-xl shadow-black/30"
              style={getFolderMenuPos()}
            >
              <button
                onClick={() => handleFolderSelect(null)}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              >
                <FolderX size={14} />
                No Folder
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder.id)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] ${
                    folder.id === script.folderId
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  <Folder size={14} />
                  {folder.name}
                </button>
              ))}
            </div>,
            document.body,
          )}
      </div>

      <span className="text-[var(--color-border-light)]">&middot;</span>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {script.tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              color: tag.color,
              backgroundColor: `${tag.color}33`,
            }}
          >
            {tag.name}
            <button
              onClick={() =>
                removeTag.mutate({
                  scriptId: script.id,
                  tagId: tag.id,
                })
              }
              className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-white/10"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <button
          ref={tagBtnRef}
          onClick={() => setTagPickerOpen(!tagPickerOpen)}
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        >
          <Plus size={12} />
          Add tag
        </button>

        {tagPickerOpen && (
          <TagPickerPopover
            scriptId={script.id}
            currentTagIds={script.tags.map((t) => t.id)}
            anchorRef={tagBtnRef}
            onClose={() => setTagPickerOpen(false)}
            onTagsChange={onMetadataChange}
          />
        )}
      </div>

      <span className="text-[var(--color-border-light)]">&middot;</span>

      {/* Post Date */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => dateInputRef.current?.showPicker()}
          className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        >
          <Calendar size={13} />
          {script.postDate
            ? format(new Date(script.postDate), "MMM d, yyyy")
            : "No date set"}
        </button>
        {script.postDate && (
          <button
            onClick={handleClearDate}
            className="cursor-pointer rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          >
            <X size={12} />
          </button>
        )}
        <input
          ref={dateInputRef}
          type="date"
          defaultValue={
            script.postDate
              ? format(new Date(script.postDate), "yyyy-MM-dd")
              : ""
          }
          onChange={handleDateChange}
          className="invisible absolute h-0 w-0"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
