"use client";

import { useEditorStore } from "~/stores/editor-store";
import { SaveIndicator } from "./save-indicator";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function StatsBar() {
  const { wordCount, charCount, estimatedDurationSeconds } = useEditorStore();

  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2">
      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <span>
          <span className="font-mono">{wordCount.toLocaleString()}</span> words
        </span>
        <span className="text-[var(--color-border-light)]">&middot;</span>
        <span>
          <span className="font-mono">{charCount.toLocaleString()}</span>{" "}
          characters
        </span>
        <span className="text-[var(--color-border-light)]">&middot;</span>
        <span>
          ~<span className="font-mono">{formatDuration(estimatedDurationSeconds)}</span>{" "}
          estimated duration
        </span>
      </div>

      <SaveIndicator />
    </div>
  );
}
