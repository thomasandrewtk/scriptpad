"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { TAG_PRESET_COLORS } from "~/lib/tag-colors";
import { ColorPicker } from "~/app/_components/settings/color-picker";
import { ConfirmDialog } from "~/app/_components/confirm-dialog";

export function TagsSettings() {
  const utils = api.useUtils();
  const { data: tags, isLoading } = api.tags.list.useQuery();

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState<string>(TAG_PRESET_COLORS[0]);
  const createRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteTag, setDeleteTag] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Mutations
  const createTagMut = api.tags.create.useMutation({
    onSuccess: () => {
      void utils.tags.list.invalidate();
      setIsCreating(false);
      setCreateName("");
      toast.success("Tag created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTag = api.tags.update.useMutation({
    onSuccess: () => {
      void utils.tags.list.invalidate();
      setEditingId(null);
      toast.success("Tag updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTagMut = api.tags.delete.useMutation({
    onSuccess: () => {
      void utils.tags.list.invalidate();
      void utils.scripts.list.invalidate();
      setDeleteTag(null);
      toast.success("Tag deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Pick first unused preset color for creation
  useEffect(() => {
    if (isCreating && tags) {
      const usedColors = new Set(tags.map((t) => t.color));
      const unused = TAG_PRESET_COLORS.find((c) => !usedColors.has(c));
      setCreateColor(
        unused ?? TAG_PRESET_COLORS[tags.length % TAG_PRESET_COLORS.length] ?? TAG_PRESET_COLORS[0],
      );
    }
  }, [isCreating, tags]);

  // Auto-focus create input
  useEffect(() => {
    if (isCreating) {
      requestAnimationFrame(() => createRef.current?.focus());
    }
  }, [isCreating]);

  // Auto-focus edit input
  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => {
        editRef.current?.focus();
        editRef.current?.select();
      });
    }
  }, [editingId]);

  const handleCreate = useCallback(() => {
    if (!createName.trim() || createTagMut.isPending) return;
    createTagMut.mutate({ name: createName.trim(), color: createColor });
  }, [createName, createColor, createTagMut]);

  const handleUpdate = useCallback(() => {
    if (!editingId || !editName.trim() || updateTag.isPending) return;
    updateTag.mutate({ id: editingId, name: editName.trim(), color: editColor });
  }, [editingId, editName, editColor, updateTag]);

  function startEditing(tag: { id: string; name: string; color: string }) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-[var(--color-text-muted)]" />
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Tags
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
          New Tag
        </button>
      </div>

      {/* Content */}
      <div className="p-2">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-1">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-[var(--color-surface)]"
              />
            ))}
          </div>
        )}

        {/* Create row */}
        {isCreating && (
          <div className="mb-1 rounded-lg bg-[var(--color-surface)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: createColor }}
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
                placeholder="Tag name..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
                maxLength={100}
              />
            </div>
            <div className="mt-2 pl-5">
              <ColorPicker
                value={createColor}
                onChange={setCreateColor}
              />
            </div>
          </div>
        )}

        {/* Tag list */}
        {tags?.map((tag) => (
          <div key={tag.id}>
            <div className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-surface)]">
              {/* Color dot */}
              {editingId === tag.id ? (
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: editColor }}
                />
              ) : (
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              )}

              {/* Name */}
              {editingId === tag.id ? (
                <input
                  ref={editRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUpdate();
                    }
                    if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  onBlur={() => setEditingId(null)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none"
                  maxLength={100}
                />
              ) : (
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-primary)]">
                  {tag.name}
                </span>
              )}

              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {tag.scriptCount}
              </span>

              {/* Actions (visible on hover) */}
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => startEditing(tag)}
                  className="cursor-pointer rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                  aria-label="Edit tag"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeleteTag({ id: tag.id, name: tag.name })}
                  className="cursor-pointer rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-red-400"
                  aria-label="Delete tag"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Inline color picker when editing */}
            {editingId === tag.id && (
              <div className="px-3 pb-2 pl-8">
                <ColorPicker
                  value={editColor}
                  onChange={(c) => setEditColor(c)}
                />
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {tags && tags.length === 0 && !isCreating && (
          <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
            No tags yet. Create one to categorize your scripts.
          </p>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTag}
        title={`Delete "${deleteTag?.name ?? ""}"?`}
        message="This tag will be removed from all scripts."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTag) deleteTagMut.mutate({ id: deleteTag.id });
        }}
        onCancel={() => setDeleteTag(null)}
        isPending={deleteTagMut.isPending}
      />
    </div>
  );
}
