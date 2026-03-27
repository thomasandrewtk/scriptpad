"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, StickyNote } from "lucide-react";

interface NotesFieldProps {
  initialNotes: string | null;
  onNotesChange: (notes: string | null) => void;
}

export const NotesField = forwardRef<HTMLTextAreaElement, NotesFieldProps>(
  function NotesField({ initialNotes, onNotesChange }, ref) {
    const [isExpanded, setIsExpanded] = useState(!!initialNotes);
    const [notes, setNotes] = useState(initialNotes ?? "");
    const internalRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    const autoResize = useCallback(() => {
      const el =
        (ref as React.RefObject<HTMLTextAreaElement>)?.current ??
        internalRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }, [ref]);

    useEffect(() => {
      if (isExpanded) {
        requestAnimationFrame(autoResize);
      }
    }, [isExpanded, autoResize]);

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      const value = e.target.value;
      setNotes(value);
      onNotesChange(value || null);
      autoResize();
    }

    // Combine refs
    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref],
    );

    return (
      <div className="mt-8 border-t border-[var(--color-border)] pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          {isExpanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
          <StickyNote size={14} />
          Notes
          {!isExpanded && notes && (
            <span className="ml-1 text-xs text-[var(--color-text-muted)]/60">
              (has content)
            </span>
          )}
        </button>

        {isExpanded && (
          <textarea
            ref={setRefs}
            value={notes}
            onChange={handleChange}
            placeholder="Internal notes, research, links..."
            rows={3}
            className="mt-3 w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent)]"
          />
        )}
      </div>
    );
  },
);
