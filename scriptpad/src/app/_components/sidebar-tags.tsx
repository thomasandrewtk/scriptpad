"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useSidebarStore } from "~/stores/sidebar-store";
import { TAG_PRESET_COLORS } from "~/lib/tag-colors";
import { ColorPicker } from "~/app/_components/settings/color-picker";

export function SidebarTags() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();
  const { data: tags, isLoading } = api.tags.list.useQuery();
  const utils = api.useUtils();

  // Quick-create state
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState<string>(TAG_PRESET_COLORS[0]);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  const createTag = api.tags.create.useMutation({
    onSuccess: () => {
      void utils.tags.list.invalidate();
      setIsCreating(false);
      setCreateName("");
      toast.success("Tag created");
    },
    onError: (err) => toast.error(err.message),
  });

  // Pick first unused preset color
  useEffect(() => {
    if (isCreating && tags) {
      const usedColors = new Set(tags.map((t) => t.color));
      const unused = TAG_PRESET_COLORS.find((c) => !usedColors.has(c));
      setCreateColor(
        unused ?? TAG_PRESET_COLORS[tags.length % TAG_PRESET_COLORS.length] ?? TAG_PRESET_COLORS[0],
      );
    }
  }, [isCreating, tags]);

  // Position popover
  useEffect(() => {
    if (isCreating && addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 220),
      });
      requestAnimationFrame(() => createInputRef.current?.focus());
    }
  }, [isCreating]);

  // Close on outside click / escape
  useEffect(() => {
    if (!isCreating) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsCreating(false);
        setCreateName("");
      }
    }
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        addBtnRef.current &&
        !addBtnRef.current.contains(e.target as Node)
      ) {
        setIsCreating(false);
        setCreateName("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isCreating]);

  function handleCreate() {
    if (!createName.trim() || createTag.isPending) return;
    createTag.mutate({ name: createName.trim(), color: createColor });
  }

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
            "hidden flex-1 max-md:inline",
            isCollapsed ? "" : "lg:inline",
          ].join(" ")}
        >
          Tags
        </span>
        {/* Quick-create button */}
        <button
          ref={addBtnRef}
          onClick={() => {
            setIsCreating(!isCreating);
            setCreateName("");
          }}
          className={[
            "cursor-pointer rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]",
            "hidden max-md:inline-flex",
            isCollapsed ? "" : "lg:inline-flex",
          ].join(" ")}
          aria-label="New tag"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Tag create popover (portal) */}
      {isCreating &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-50 w-[210px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-xl shadow-black/30"
            style={popoverPos}
          >
            <input
              ref={createInputRef}
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="Tag name..."
              className="mb-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
              maxLength={100}
            />
            <ColorPicker value={createColor} onChange={setCreateColor} />
            <button
              onClick={handleCreate}
              disabled={!createName.trim() || createTag.isPending}
              className="mt-2 w-full cursor-pointer rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createTag.isPending ? "Creating..." : "Create Tag"}
            </button>
          </div>,
          document.body,
        )}

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
