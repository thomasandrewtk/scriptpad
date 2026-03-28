"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: "Formatting",
    shortcuts: [
      { keys: "Cmd+B", description: "Bold" },
      { keys: "Cmd+I", description: "Italic" },
      { keys: "Cmd+U", description: "Underline" },
    ],
  },
  {
    title: "Structure",
    shortcuts: [
      { keys: "Cmd+Shift+H", description: "Insert Hook section" },
      { keys: "Cmd+Shift+B", description: "Insert Body section" },
      { keys: "Cmd+Shift+C", description: "Insert CTA section" },
      { keys: "Cmd+Shift+N", description: "Insert scene note" },
      { keys: "Cmd+Shift+V", description: "Create line variant" },
      { keys: "Cmd+Shift+-", description: "Insert divider" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: "Cmd+Alt+Up", description: "Move section up / prev variant" },
      { keys: "Cmd+Alt+Down", description: "Move section down / next variant" },
      { keys: "/", description: "Open slash command menu" },
      { keys: "Cmd+S", description: "Force save" },
      { keys: "Escape", description: "Back to dashboard" },
    ],
  },
  {
    title: "Views",
    shortcuts: [
      { keys: "Cmd+\\", description: "Toggle split view" },
      { keys: "Cmd+Enter", description: "Enter teleprompter mode" },
      { keys: "Cmd+?", description: "Show this help" },
    ],
  },
];

export function KeyboardHelpModal({ isOpen, onClose }: KeyboardHelpModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ animation: "modal-backdrop 200ms ease-out forwards" }}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-2xl"
        style={{ animation: "modal-panel 200ms ease-out forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-[var(--color-text-primary)]">
                      {shortcut.description}
                    </span>
                    <kbd className="rounded bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
