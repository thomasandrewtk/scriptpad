"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Anchor, X } from "lucide-react";
import { api } from "~/trpc/react";

interface HookTemplatePickerProps {
  onSelect: (body: string) => void;
  onClose: () => void;
}

export function HookTemplatePicker({
  onSelect,
  onClose,
}: HookTemplatePickerProps) {
  const [filter, setFilter] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: templates, isLoading } = api.hookTemplates.list.useQuery();

  // Auto-focus filter
  useEffect(() => {
    requestAnimationFrame(() => filterRef.current?.focus());
  }, []);

  // Close on escape or outside click
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
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

  const filtered = (templates ?? []).filter((t) => {
    const q = filter.toLowerCase();
    return (
      t.body.toLowerCase().includes(q) ||
      (t.tagName?.toLowerCase().includes(q) ?? false)
    );
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={panelRef}
        className="relative w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-2xl shadow-black/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Anchor size={16} />
            Insert Hook Template
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter */}
        <div className="px-4 py-3">
          <input
            ref={filterRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Template list */}
        <div className="max-h-[300px] overflow-y-auto px-2 pb-3">
          {isLoading ? (
            <div className="space-y-2 px-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-[var(--color-surface)]"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-[var(--color-text-muted)]">
              {templates?.length === 0
                ? "No hook templates yet"
                : "No matching templates"}
            </p>
          ) : (
            filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template.body)}
                className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-surface)]"
              >
                <div className="line-clamp-2 text-sm text-[var(--color-text-primary)]">
                  {template.body}
                </div>
                {template.tagName && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: template.tagColor ?? "#3B82F6",
                      }}
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {template.tagName}
                    </span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
