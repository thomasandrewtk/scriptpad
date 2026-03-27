"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useQuickCaptureStore } from "~/stores/quick-capture-store";

export function QuickCaptureModal() {
  const router = useRouter();
  const { isOpen, close } = useQuickCaptureStore();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const createScript = api.scripts.create.useMutation({
    onSuccess: (data) => {
      void utils.scripts.list.invalidate();
      void utils.scripts.statusCounts.invalidate();
      close();
      toast.success("Script idea captured!", {
        action: {
          label: "Open",
          onClick: () => router.push(`/script/${data.id}`),
        },
      });
    },
    onError: () => toast.error("Failed to capture script"),
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setNotes("");
    }
  }, [isOpen]);

  // Auto-focus title when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure portal is mounted
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || createScript.isPending) return;
    createScript.mutate({ title: title.trim(), notes: notes.trim() || undefined });
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-[modal-backdrop_200ms_ease-out_forwards]"
        onClick={close}
      />
      {/* Panel */}
      <div className="relative mx-4 w-full max-w-md animate-[modal-panel_200ms_ease-out_forwards] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Quick Capture
          </h2>
          <button
            onClick={close}
            className="cursor-pointer rounded-lg p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4">
          <div className="space-y-3">
            {/* Title */}
            <div>
              <label
                htmlFor="qc-title"
                className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]"
              >
                Title
              </label>
              <input
                ref={titleRef}
                id="qc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="What's your script idea?"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
                maxLength={500}
              />
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="qc-notes"
                className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]"
              >
                Notes{" "}
                <span className="text-[var(--color-text-muted)]/60">
                  (optional)
                </span>
              </label>
              <textarea
                id="qc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Quick notes, hooks, angles..."
                rows={3}
                className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createScript.isPending}
              className="cursor-pointer rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createScript.isPending ? "Saving…" : "Save as Idea"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
