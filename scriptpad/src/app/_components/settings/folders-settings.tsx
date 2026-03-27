"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { ConfirmDialog } from "~/app/_components/confirm-dialog";

export function FoldersSettings() {
  const utils = api.useUtils();
  const { data, isLoading } = api.folders.list.useQuery();

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const createRef = useRef<HTMLInputElement>(null);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteFolder, setDeleteFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Mutations
  const createFolder = api.folders.create.useMutation({
    onSuccess: () => {
      void utils.folders.list.invalidate();
      setIsCreating(false);
      setCreateName("");
      toast.success("Folder created");
    },
    onError: (err) => toast.error(err.message),
  });

  const renameFolder = api.folders.rename.useMutation({
    onSuccess: () => {
      void utils.folders.list.invalidate();
      setRenamingId(null);
      setRenameName("");
      toast.success("Folder renamed");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteFolderMut = api.folders.delete.useMutation({
    onSuccess: () => {
      void utils.folders.list.invalidate();
      void utils.scripts.list.invalidate();
      setDeleteFolder(null);
      toast.success("Folder deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Auto-focus create input
  useEffect(() => {
    if (isCreating) {
      requestAnimationFrame(() => createRef.current?.focus());
    }
  }, [isCreating]);

  // Auto-focus rename input
  useEffect(() => {
    if (renamingId) {
      requestAnimationFrame(() => {
        renameRef.current?.focus();
        renameRef.current?.select();
      });
    }
  }, [renamingId]);

  const handleCreate = useCallback(() => {
    if (!createName.trim() || createFolder.isPending) return;
    createFolder.mutate({ name: createName.trim() });
  }, [createName, createFolder]);

  const handleRename = useCallback(() => {
    if (!renamingId || !renameName.trim() || renameFolder.isPending) return;
    renameFolder.mutate({ id: renamingId, name: renameName.trim() });
  }, [renamingId, renameName, renameFolder]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-[var(--color-text-muted)]" />
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Folders
          </h2>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setCreateName("");
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-surface)]"
        >
          <Plus size={14} />
          New Folder
        </button>
      </div>

      {/* Content */}
      <div className="p-2">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-[var(--color-surface)]"
              />
            ))}
          </div>
        )}

        {/* Create input */}
        {isCreating && (
          <div className="mb-1 flex items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2">
            <FolderOpen
              size={14}
              className="shrink-0 text-[var(--color-text-muted)]"
            />
            <input
              ref={createRef}
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setCreateName("");
                }
              }}
              onBlur={() => {
                if (!createName.trim()) {
                  setIsCreating(false);
                  setCreateName("");
                }
              }}
              placeholder="Folder name..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
              maxLength={255}
            />
          </div>
        )}

        {/* Folder list */}
        {data?.folders.map((folder) => (
          <div
            key={folder.id}
            className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-surface)]"
          >
            <FolderOpen
              size={14}
              className="shrink-0 text-[var(--color-text-muted)]"
            />

            {renamingId === folder.id ? (
              <input
                ref={renameRef}
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleRename();
                  }
                  if (e.key === "Escape") {
                    setRenamingId(null);
                    setRenameName("");
                  }
                }}
                onBlur={() => {
                  setRenamingId(null);
                  setRenameName("");
                }}
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none"
                maxLength={255}
              />
            ) : (
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-primary)]">
                {folder.name}
              </span>
            )}

            <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
              {folder.scriptCount}
            </span>

            {/* Actions (visible on hover) */}
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => {
                  setRenamingId(folder.id);
                  setRenameName(folder.name);
                }}
                className="cursor-pointer rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                aria-label="Rename folder"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() =>
                  setDeleteFolder({ id: folder.id, name: folder.name })
                }
                className="cursor-pointer rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-red-400"
                aria-label="Delete folder"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {data && data.folders.length === 0 && !isCreating && (
          <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
            No folders yet. Create one to organize your scripts.
          </p>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteFolder}
        title={`Delete "${deleteFolder?.name ?? ""}"?`}
        message="Scripts in this folder will become uncategorized."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteFolder) deleteFolderMut.mutate({ id: deleteFolder.id });
        }}
        onCancel={() => setDeleteFolder(null)}
        isPending={deleteFolderMut.isPending}
      />
    </div>
  );
}
