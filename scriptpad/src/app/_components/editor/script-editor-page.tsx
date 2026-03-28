"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useEditorStore } from "~/stores/editor-store";
import { EditorHeader } from "./editor-header";
import { EditorTitle } from "./editor-title";
import { MetadataRow } from "./metadata-row";
import { TiptapEditor } from "./tiptap-editor";
import { NotesField } from "./notes-field";
import { EditorSkeleton } from "./editor-skeleton";
import { StatsBar } from "./stats-bar";
import { KeyboardHelpModal } from "./keyboard-help-modal";
import {
  TeleprompterView,
  extractTeleprompterContent,
} from "./teleprompter-view";

interface ScriptEditorPageProps {
  scriptId: string;
}

export function ScriptEditorPage({ scriptId }: ScriptEditorPageProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const { setSaveState, setStats, reset } = useEditorStore();

  const pendingRef = useRef<Record<string, unknown>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Feature toggles
  const [isSplitView, setIsSplitView] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  // Store body JSON for teleprompter
  const bodyJsonRef = useRef<Record<string, unknown> | null>(null);

  const {
    data: script,
    isLoading,
    error,
  } = api.scripts.getById.useQuery(
    { id: scriptId },
    { refetchOnWindowFocus: false },
  );

  const updateScript = api.scripts.update.useMutation({
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      // Don't invalidate getById to avoid TipTap re-initialization
    },
    onError: () => {
      setSaveState("idle");
      toast.error("Failed to save changes");
    },
  });

  // Initialize stats from server data
  useEffect(() => {
    if (script) {
      setStats({
        wordCount: script.wordCount ?? 0,
        charCount: script.charCount ?? 0,
        estimatedDurationSeconds: script.estimatedDurationSeconds ?? 0,
      });
      bodyJsonRef.current = script.body as Record<string, unknown> | null;
    }
  }, [script, setStats]);

  // Reset store on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const flushSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const fields = { ...pendingRef.current };
    pendingRef.current = {};

    if (Object.keys(fields).length === 0) return;

    updateScript.mutate({ id: scriptId, ...fields });
  }, [scriptId, updateScript]);

  const flushSaveAsync = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const fields = { ...pendingRef.current };
    pendingRef.current = {};

    if (Object.keys(fields).length === 0) return;

    await updateScript.mutateAsync({ id: scriptId, ...fields });
  }, [scriptId, updateScript]);

  const scheduleAutoSave = useCallback(
    (fields: Record<string, unknown>) => {
      // Merge into pending
      pendingRef.current = { ...pendingRef.current, ...fields };

      // Track body JSON for teleprompter
      if (fields.body) {
        bodyJsonRef.current = fields.body as Record<string, unknown>;
      }

      // Reset the 3s timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        flushSave();
      }, 3000);
    },
    [flushSave],
  );

  const saveImmediate = useCallback(
    (fields: Record<string, unknown>) => {
      // Merge pending + new fields and flush immediately
      pendingRef.current = { ...pendingRef.current, ...fields };
      flushSave();
    },
    [flushSave],
  );

  // Flush save on Cmd+S
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        flushSave();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [flushSave]);

  // Flush save before unload
  useEffect(() => {
    function handleBeforeUnload() {
      if (Object.keys(pendingRef.current).length > 0) {
        const fields = { ...pendingRef.current };
        pendingRef.current = {};
        // Use sendBeacon for reliability
        const url = "/api/trpc/scripts.update";
        const body = JSON.stringify({
          json: { id: scriptId, ...fields },
        });
        navigator.sendBeacon(url, body);
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [scriptId]);

  const handleBack = useCallback(async () => {
    await flushSaveAsync();
    void utils.scripts.list.invalidate();
    void utils.scripts.statusCounts.invalidate();
    router.back();
  }, [flushSaveAsync, utils, router]);

  const handleMetadataChange = useCallback(() => {
    void utils.scripts.getById.invalidate({ id: scriptId });
    void utils.scripts.list.invalidate();
    void utils.scripts.statusCounts.invalidate();
    void utils.folders.list.invalidate();
    void utils.tags.list.invalidate();
  }, [utils, scriptId]);

  // Global keyboard shortcuts
  const popoverOpenRef = useRef(false);
  useEffect(() => {
    function handleKeyDownCapture(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Check if any portal popover/menu is in the DOM
        const portals = document.querySelectorAll(".fixed.z-50");
        popoverOpenRef.current = portals.length > 0;
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+\ → toggle split view
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setIsSplitView((v) => !v);
        return;
      }

      // Cmd+? → keyboard help
      if ((e.metaKey || e.ctrlKey) && e.key === "?") {
        e.preventDefault();
        setShowKeyboardHelp((v) => !v);
        return;
      }

      // Cmd+Enter → teleprompter
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        setShowTeleprompter(true);
        return;
      }

      // Escape → navigate to dashboard (only when no popover is open)
      if (e.key === "Escape" && !popoverOpenRef.current) {
        e.preventDefault();
        void handleBack();
      }
      popoverOpenRef.current = false;
    }

    document.addEventListener("keydown", handleKeyDownCapture, true);
    document.addEventListener("keydown", handleKeyDown, false);
    return () => {
      document.removeEventListener("keydown", handleKeyDownCapture, true);
      document.removeEventListener("keydown", handleKeyDown, false);
    };
  }, [handleBack]);

  // Loading skeleton
  if (isLoading) {
    return <EditorSkeleton />;
  }

  // Error / 404
  if (error || !script) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Script not found
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            This script may have been deleted or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 cursor-pointer rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const teleprompterContent = extractTeleprompterContent(bodyJsonRef.current);

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        script={script}
        onBack={handleBack}
        onMetadataChange={handleMetadataChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main editor panel */}
        <div className="flex-1 overflow-y-auto">
          <div
            className={`mx-auto w-full px-6 py-8 ${
              isSplitView ? "max-w-3xl" : "max-w-3xl"
            }`}
          >
            <EditorTitle
              initialTitle={script.title}
              onTitleChange={(title) => scheduleAutoSave({ title })}
            />

            <MetadataRow
              script={script}
              onMetadataChange={handleMetadataChange}
              onImmediateSave={saveImmediate}
            />

            <TiptapEditor
              initialContent={script.body}
              onContentChange={(body, bodyPlainText) =>
                scheduleAutoSave({ body, bodyPlainText })
              }
              onForceSave={flushSave}
              notesRef={notesRef}
            />

            <NotesField
              ref={notesRef}
              initialNotes={script.notes}
              onNotesChange={(notes) => scheduleAutoSave({ notes })}
            />
          </div>
        </div>

        {/* Split view right panel */}
        {isSplitView && (
          <div className="hidden w-80 flex-shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 lg:block">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Script Notes
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                {script.notes || "No notes yet. Add notes below the editor."}
              </p>

              <div className="border-t border-[var(--color-border)] pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Quick Actions
                </h3>
                <div className="mt-2 space-y-2">
                  <button
                    onClick={() => setShowTeleprompter(true)}
                    className="w-full cursor-pointer rounded-lg border border-[var(--color-border)] px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                  >
                    Teleprompter Mode
                  </button>
                  <button
                    onClick={() => setShowKeyboardHelp(true)}
                    className="w-full cursor-pointer rounded-lg border border-[var(--color-border)] px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                  >
                    Keyboard Shortcuts
                  </button>
                </div>
              </div>

              {script.tags && script.tags.length > 0 && (
                <div className="border-t border-[var(--color-border)] pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Tags
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {script.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <StatsBar />

      {/* Keyboard help modal */}
      <KeyboardHelpModal
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Teleprompter view */}
      <TeleprompterView
        isOpen={showTeleprompter}
        onClose={() => setShowTeleprompter(false)}
        content={teleprompterContent}
      />
    </div>
  );
}
