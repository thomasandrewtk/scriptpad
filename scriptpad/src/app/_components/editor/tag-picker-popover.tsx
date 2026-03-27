"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { TAG_PRESET_COLORS } from "~/lib/tag-colors";

interface TagPickerPopoverProps {
  scriptId: string;
  currentTagIds: string[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onTagsChange: () => void;
}

export function TagPickerPopover({
  scriptId,
  currentTagIds,
  anchorRef,
  onClose,
  onTagsChange,
}: TagPickerPopoverProps) {
  const [filter, setFilter] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  const { data: allTags } = api.tags.list.useQuery();

  const addToScript = api.tags.addToScript.useMutation({
    onSuccess: () => onTagsChange(),
    onError: () => toast.error("Failed to add tag"),
  });

  const removeFromScript = api.tags.removeFromScript.useMutation({
    onSuccess: () => onTagsChange(),
    onError: () => toast.error("Failed to remove tag"),
  });

  const createTag = api.tags.create.useMutation({
    onSuccess: (newTag) => {
      addToScript.mutate({ scriptId, tagId: newTag.id });
      setFilter("");
    },
    onError: (err) => toast.error(err.message),
  });

  // Position the popover
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 240),
    });
  }, [anchorRef]);

  // Focus filter on mount
  useEffect(() => {
    requestAnimationFrame(() => filterRef.current?.focus());
  }, []);

  // Close on outside click or escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose, anchorRef]);

  const filteredTags = (allTags ?? []).filter((tag) =>
    tag.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const showCreate =
    filter.trim() &&
    !filteredTags.some(
      (t) => t.name.toLowerCase() === filter.trim().toLowerCase(),
    );

  function toggleTag(tagId: string) {
    if (currentTagIds.includes(tagId)) {
      removeFromScript.mutate({ scriptId, tagId });
    } else {
      addToScript.mutate({ scriptId, tagId });
    }
  }

  function handleCreate() {
    if (!filter.trim()) return;
    const color =
      TAG_PRESET_COLORS[(allTags?.length ?? 0) % TAG_PRESET_COLORS.length];
    createTag.mutate({ name: filter.trim(), color });
  }

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-50 w-[220px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-xl shadow-black/30"
      style={position}
    >
      <div className="p-2">
        <input
          ref={filterRef}
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && showCreate) {
              e.preventDefault();
              handleCreate();
            }
          }}
          placeholder="Filter or create..."
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="max-h-[200px] overflow-y-auto px-1 pb-1">
        {filteredTags.map((tag) => {
          const isApplied = currentTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--color-surface)]"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span
                className={
                  isApplied
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)]"
                }
              >
                {tag.name}
              </span>
              {isApplied && (
                <Check
                  size={12}
                  className="ml-auto text-[var(--color-accent)]"
                />
              )}
            </button>
          );
        })}

        {showCreate && (
          <button
            onClick={handleCreate}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--color-accent)] transition-colors hover:bg-[var(--color-surface)]"
          >
            <Plus size={12} />
            Create &quot;{filter.trim()}&quot;
          </button>
        )}

        {filteredTags.length === 0 && !showCreate && (
          <p className="px-2 py-2 text-center text-xs text-[var(--color-text-muted)]">
            No tags found
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
