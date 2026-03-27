"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useEditorStore } from "~/stores/editor-store";
import { EditorHeader } from "./editor-header";
import { EditorTitle } from "./editor-title";
import { MetadataRow } from "./metadata-row";
import { TiptapEditor } from "./tiptap-editor";
import { NotesField } from "./notes-field";
import { AttachmentsSection } from "./attachments-section";
import { StatsBar } from "./stats-bar";

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

  const { data: script, isLoading, error } = api.scripts.getById.useQuery(
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

  // Escape key → navigate to dashboard (only when no popover is open)
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
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <div className="h-8 w-24 animate-pulse rounded bg-[var(--color-surface)]" />
        </div>
        <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
          <div className="mb-6 h-10 w-3/4 animate-pulse rounded bg-[var(--color-surface)]" />
          <div className="mb-4 h-6 w-1/2 animate-pulse rounded bg-[var(--color-surface)]" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--color-surface)]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--color-surface)]" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--color-surface)]" />
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        script={script}
        onBack={handleBack}
        onMetadataChange={handleMetadataChange}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
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

          <AttachmentsSection
            scriptId={scriptId}
            attachments={script.attachments}
            onAttachmentsChange={handleMetadataChange}
          />
        </div>
      </div>

      <StatsBar />
    </div>
  );
}
