"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MoreHorizontal,
  Copy,
  Trash2,
  Clock,
  Download,
  ClipboardCopy,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import {
  exportToText,
  copyToClipboard,
  downloadAsFile,
} from "./export-script";

type ScriptStatus = "idea" | "writing" | "ready" | "posted";

const STATUSES: { key: ScriptStatus; label: string; color: string }[] = [
  { key: "idea", label: "Idea", color: "#6B7280" },
  { key: "writing", label: "Writing", color: "#F59E0B" },
  { key: "ready", label: "Ready", color: "#10B981" },
  { key: "posted", label: "Posted", color: "#6366F1" },
];

interface EditorHeaderProps {
  script: RouterOutputs["scripts"]["getById"];
  onBack: () => void;
  onMetadataChange: () => void;
}

export function EditorHeader({
  script,
  onBack,
  onMetadataChange,
}: EditorHeaderProps) {
  const router = useRouter();
  const [statusOpen, setStatusOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const statusRef = useRef<HTMLButtonElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();

  const updateStatus = api.scripts.updateStatus.useMutation({
    onSuccess: () => {
      onMetadataChange();
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const duplicateScript = api.scripts.duplicate.useMutation({
    onSuccess: (data) => {
      void utils.scripts.list.invalidate();
      void utils.scripts.statusCounts.invalidate();
      toast.success("Script duplicated");
      router.push(`/script/${data.id}`);
    },
    onError: () => toast.error("Failed to duplicate"),
  });

  const deleteScript = api.scripts.softDelete.useMutation({
    onSuccess: () => {
      void utils.scripts.list.invalidate();
      void utils.scripts.statusCounts.invalidate();
      toast.success("Script deleted");
      router.push("/");
    },
    onError: () => toast.error("Failed to delete script"),
  });

  const currentStatus = STATUSES.find((s) => s.key === script.status)!;

  // Close dropdowns on click outside or escape
  useEffect(() => {
    if (!statusOpen && !moreOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setStatusOpen(false);
        setMoreOpen(false);
      }
    }
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        statusOpen &&
        statusMenuRef.current &&
        !statusMenuRef.current.contains(target) &&
        statusRef.current &&
        !statusRef.current.contains(target)
      ) {
        setStatusOpen(false);
      }
      if (
        moreOpen &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target) &&
        moreRef.current &&
        !moreRef.current.contains(target)
      ) {
        setMoreOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [statusOpen, moreOpen]);

  const getDropdownPosition = useCallback(
    (ref: React.RefObject<HTMLButtonElement | null>) => {
      if (!ref.current) return { top: 0, left: 0 };
      const rect = ref.current.getBoundingClientRect();
      return { top: rect.bottom + 4, left: rect.left };
    },
    [],
  );

  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
      {/* Left: Back button */}
      <button
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Right: Status + More */}
      <div className="flex items-center gap-2">
        {/* Status dropdown */}
        <button
          ref={statusRef}
          onClick={() => {
            setStatusOpen(!statusOpen);
            setMoreOpen(false);
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface)]"
          style={{ color: currentStatus.color }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: currentStatus.color }}
          />
          {currentStatus.label}
        </button>

        {/* More menu */}
        <button
          ref={moreRef}
          onClick={() => {
            setMoreOpen(!moreOpen);
            setStatusOpen(false);
          }}
          className="cursor-pointer rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Status dropdown portal */}
      {statusOpen &&
        createPortal(
          <div
            ref={statusMenuRef}
            className="fixed z-50 min-w-[150px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-xl shadow-black/30"
            style={getDropdownPosition(statusRef)}
          >
            {STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  updateStatus.mutate({ id: script.id, status: s.key });
                  setStatusOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
                {s.key === script.status && (
                  <span className="ml-auto text-xs text-[var(--color-accent)]">
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* More menu portal */}
      {moreOpen &&
        createPortal(
          <div
            ref={moreMenuRef}
            className="fixed z-50 min-w-[200px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-xl shadow-black/30"
            style={getDropdownPosition(moreRef)}
          >
            <button
              onClick={() => {
                duplicateScript.mutate({ id: script.id });
                setMoreOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              <Copy size={14} />
              Duplicate
            </button>

            <div className="my-1 border-t border-[var(--color-border)]" />

            {/* Export options */}
            <button
              onClick={async () => {
                const text = exportToText(
                  script.body as Record<string, unknown> | null,
                  {
                    includeAnnotations: false,
                    includeSectionHeaders: true,
                    title: script.title,
                  },
                );
                const ok = await copyToClipboard(text);
                toast.success(
                  ok ? "Spoken text copied" : "Failed to copy",
                );
                setMoreOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              <ClipboardCopy size={14} />
              Copy spoken text
            </button>
            <button
              onClick={async () => {
                const text = exportToText(
                  script.body as Record<string, unknown> | null,
                  {
                    includeAnnotations: true,
                    includeSectionHeaders: true,
                    title: script.title,
                  },
                );
                const ok = await copyToClipboard(text);
                toast.success(
                  ok ? "Full script copied" : "Failed to copy",
                );
                setMoreOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              <FileText size={14} />
              Copy with annotations
            </button>
            <button
              onClick={() => {
                const text = exportToText(
                  script.body as Record<string, unknown> | null,
                  {
                    includeAnnotations: true,
                    includeSectionHeaders: true,
                    title: script.title,
                  },
                );
                const safeName = script.title
                  .replace(/[^a-zA-Z0-9 ]/g, "")
                  .trim()
                  .replace(/\s+/g, "-")
                  .toLowerCase();
                downloadAsFile(text, `${safeName || "script"}.txt`);
                toast.success("Script downloaded");
                setMoreOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              <Download size={14} />
              Download as .txt
            </button>

            <div className="my-1 border-t border-[var(--color-border)]" />

            {/* Timestamps */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Clock size={12} />
                Created {format(new Date(script.createdAt), "MMM d, yyyy h:mm a")}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Clock size={12} />
                Updated{" "}
                {format(new Date(script.updatedAt), "MMM d, yyyy h:mm a")}
              </div>
            </div>

            <div className="my-1 border-t border-[var(--color-border)]" />

            <button
              onClick={() => {
                deleteScript.mutate({ id: script.id });
                setMoreOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
