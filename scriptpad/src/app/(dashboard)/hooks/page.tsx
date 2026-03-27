"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Pencil, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { ConfirmDialog } from "~/app/_components/confirm-dialog";

export default function HooksPage() {
  const utils = api.useUtils();
  const { data: templates, isLoading } = api.hookTemplates.list.useQuery();
  const { data: tags } = api.tags.list.useQuery();

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [createBody, setCreateBody] = useState("");
  const [createTagId, setCreateTagId] = useState<string | undefined>(undefined);
  const createBodyRef = useRef<HTMLTextAreaElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editTagId, setEditTagId] = useState<string | undefined>(undefined);
  const editBodyRef = useRef<HTMLTextAreaElement>(null);

  // Delete state
  const [deleteTemplate, setDeleteTemplate] = useState<{
    id: string;
    body: string;
  } | null>(null);

  // Mutations
  const createMut = api.hookTemplates.create.useMutation({
    onSuccess: () => {
      void utils.hookTemplates.list.invalidate();
      setIsCreating(false);
      setCreateBody("");
      setCreateTagId(undefined);
      toast.success("Hook template created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMut = api.hookTemplates.update.useMutation({
    onSuccess: () => {
      void utils.hookTemplates.list.invalidate();
      setEditingId(null);
      setEditBody("");
      setEditTagId(undefined);
      toast.success("Hook template updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = api.hookTemplates.delete.useMutation({
    onSuccess: () => {
      void utils.hookTemplates.list.invalidate();
      setDeleteTemplate(null);
      toast.success("Hook template deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Auto-focus create textarea
  useEffect(() => {
    if (isCreating) {
      requestAnimationFrame(() => createBodyRef.current?.focus());
    }
  }, [isCreating]);

  // Auto-focus edit textarea
  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => {
        editBodyRef.current?.focus();
      });
    }
  }, [editingId]);

  const handleCreate = useCallback(() => {
    if (!createBody.trim() || createMut.isPending) return;
    createMut.mutate({
      body: createBody.trim(),
      tagId: createTagId,
    });
  }, [createBody, createTagId, createMut]);

  const handleUpdate = useCallback(() => {
    if (!editingId || !editBody.trim() || updateMut.isPending) return;
    updateMut.mutate({
      id: editingId,
      body: editBody.trim(),
      tagId: editTagId ?? null,
    });
  }, [editingId, editBody, editTagId, updateMut]);

  function startEditing(template: {
    id: string;
    body: string;
    tagId: string | null;
  }) {
    setEditingId(template.id);
    setEditBody(template.body);
    setEditTagId(template.tagId ?? undefined);
  }

  function cancelCreate() {
    setIsCreating(false);
    setCreateBody("");
    setCreateTagId(undefined);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody("");
    setEditTagId(undefined);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Zap size={22} className="text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Hook Templates
          </h1>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setCreateBody("");
            setCreateTagId(undefined);
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          <Plus size={16} />
          New Hook
        </button>
      </div>

      {/* Content card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="p-2">
          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-[var(--color-surface)]"
                />
              ))}
            </div>
          )}

          {/* Create form */}
          {isCreating && (
            <div className="mb-1 rounded-lg bg-[var(--color-surface)] px-4 py-3">
              <textarea
                ref={createBodyRef}
                value={createBody}
                onChange={(e) => setCreateBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    cancelCreate();
                  }
                }}
                placeholder="Write your hook..."
                className="w-full resize-none bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
                rows={2}
              />
              <div className="mt-2 flex items-center justify-between">
                <select
                  value={createTagId ?? ""}
                  onChange={(e) =>
                    setCreateTagId(e.target.value || undefined)
                  }
                  className="cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="">No tag</option>
                  {tags?.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelCreate}
                    className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!createBody.trim() || createMut.isPending}
                    className="cursor-pointer rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createMut.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template list */}
          {templates?.map((template) => (
            <div key={template.id}>
              {editingId === template.id ? (
                /* Edit form — inline replacement */
                <div className="rounded-lg bg-[var(--color-surface)] px-4 py-3">
                  <textarea
                    ref={editBodyRef}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    className="w-full resize-none bg-transparent text-sm text-[var(--color-text-primary)] outline-none"
                    rows={2}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <select
                      value={editTagId ?? ""}
                      onChange={(e) =>
                        setEditTagId(e.target.value || undefined)
                      }
                      className="cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="">No tag</option>
                      {tags?.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEdit}
                        className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={!editBody.trim() || updateMut.isPending}
                        className="cursor-pointer rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updateMut.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Display row */
                <div className="group flex items-start gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-[var(--color-surface)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      &ldquo;{template.body}&rdquo;
                    </p>
                    {template.tagName && (
                      <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: template.tagColor ?? "#3B82F6",
                          }}
                        />
                        {template.tagName}
                      </span>
                    )}
                  </div>

                  {/* Actions (visible on hover) */}
                  <div className="flex shrink-0 items-center gap-0.5 pt-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => startEditing(template)}
                      className="cursor-pointer rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                      aria-label="Edit hook template"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTemplate({
                          id: template.id,
                          body: template.body,
                        })
                      }
                      className="cursor-pointer rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-red-400"
                      aria-label="Delete hook template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {templates && templates.length === 0 && !isCreating && (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              No hook templates yet. Create one to speed up your script writing.
            </p>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTemplate}
        title="Delete hook template?"
        message={
          deleteTemplate
            ? `"${deleteTemplate.body.length > 60 ? deleteTemplate.body.slice(0, 60) + "\u2026" : deleteTemplate.body}" will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTemplate) deleteMut.mutate({ id: deleteTemplate.id });
        }}
        onCancel={() => setDeleteTemplate(null)}
        isPending={deleteMut.isPending}
      />
    </div>
  );
}
