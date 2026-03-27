"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "default",
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-[modal-backdrop_200ms_ease-out_forwards]"
        onClick={onCancel}
      />
      {/* Panel */}
      <div className="relative mx-4 w-full max-w-sm animate-[modal-panel_200ms_ease-out_forwards] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-2xl shadow-black/40">
        <div className="px-5 py-4">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            {title}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={[
              "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50",
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]",
            ].join(" ")}
          >
            {isPending ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
