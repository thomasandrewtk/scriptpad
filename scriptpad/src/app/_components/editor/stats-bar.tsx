"use client";

import { useEditorStore } from "~/stores/editor-store";
import { SaveIndicator } from "./save-indicator";

const SECTION_COLORS: Record<string, string> = {
  hook: "#F59E0B",
  body: "#3B82F6",
  cta: "#10B981",
  custom: "#9CA3AF",
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function StatsBar() {
  const { wordCount, charCount, estimatedDurationSeconds, sectionStats } =
    useEditorStore();

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span>
            <span className="font-mono">{wordCount.toLocaleString()}</span>{" "}
            words
          </span>
          <span className="text-[var(--color-border-light)]">&middot;</span>
          <span>
            <span className="font-mono">{charCount.toLocaleString()}</span>{" "}
            characters
          </span>
          <span className="text-[var(--color-border-light)]">&middot;</span>
          <span>
            ~
            <span className="font-mono">
              {formatDuration(estimatedDurationSeconds)}
            </span>{" "}
            estimated duration
          </span>
        </div>

        <SaveIndicator />
      </div>

      {/* Per-section breakdown */}
      {sectionStats.length > 0 && (
        <div className="mt-1.5 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          {sectionStats.map((section, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    SECTION_COLORS[section.type] || SECTION_COLORS.custom,
                }}
              />
              <span style={{ color: SECTION_COLORS[section.type] || SECTION_COLORS.custom }}>
                {section.label}
              </span>
              <span className="font-mono">{section.wordCount}</span>w
              <span className="text-[var(--color-border-light)]">&middot;</span>
              <span className="font-mono">
                {formatDuration(section.durationSeconds)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
