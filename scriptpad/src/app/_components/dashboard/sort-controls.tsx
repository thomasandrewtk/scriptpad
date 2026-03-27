"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SortByOption = "createdAt" | "updatedAt" | "postDate";

interface SortControlsProps {
  sortBy: SortByOption;
  onSortChange: (sortBy: SortByOption) => void;
}

const SORT_OPTIONS: { key: SortByOption; label: string }[] = [
  { key: "createdAt", label: "Date Created" },
  { key: "updatedAt", label: "Last Edited" },
  { key: "postDate", label: "Post Date" },
];

export function SortControls({ sortBy, onSortChange }: SortControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? "Date Created";

  // Close on click-outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-light)] hover:text-[var(--color-text-primary)]"
      >
        <span className="text-[var(--color-text-muted)]/60">Sort:</span>
        {currentLabel}
        <ChevronDown
          size={14}
          className={[
            "transition-transform",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-lg">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                onSortChange(option.key);
                setIsOpen(false);
              }}
              className={[
                "flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm transition-colors",
                sortBy === option.key
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
